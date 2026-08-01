import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AdminUser, AdminRole } from './entities/admin-user.entity';
import { AdminOperationLogService, LogContext } from './admin-operation-log.service';
import { AdminListQueryDto } from './dto/admin-list-query.dto';

@Injectable()
export class AdminAccountService {
  constructor(
    @InjectRepository(AdminUser)
    private readonly repo: Repository<AdminUser>,
    private readonly opLog: AdminOperationLogService,
  ) {}

  async findAll(query: AdminListQueryDto) {
    const { page, pageSize, keyword } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (keyword) where.username = Like(`%${keyword}%`);

    const [rows, total] = await this.repo.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });
    return { list: rows.map((r) => this.toResponse(r)), total, page, pageSize };
  }

  async findOne(id: number) {
    const u = await this.repo.findOne({ where: { id } });
    if (!u) throw new NotFoundException(`管理员 ID ${id} 不存在`);
    return this.toResponse(u);
  }

  async create(
    ctx: LogContext,
    data: { username: string; password: string; nickname?: string; role: AdminRole },
  ) {
    if (!data.username?.trim()) throw new BadRequestException('用户名不能为空');
    if (!data.password || data.password.length < 6) {
      throw new BadRequestException('密码至少 6 位');
    }
    const exists = await this.repo.findOne({ where: { username: data.username } });
    if (exists) throw new ConflictException('用户名已存在');

    const u = await this.repo.save(
      this.repo.create({
        username: data.username.trim(),
        passwordHash: await bcrypt.hash(data.password, 10),
        nickname: data.nickname,
        role: data.role,
        status: 1,
      }),
    );
    await this.opLog.record(ctx, 'create', 'admin_user', u.id, {
      username: u.username,
      role: u.role,
    });
    return this.toResponse(u);
  }

  async update(
    ctx: LogContext,
    id: number,
    data: { nickname?: string; role?: AdminRole },
  ) {
    const u = await this.repo.findOne({ where: { id } });
    if (!u) throw new NotFoundException(`管理员 ID ${id} 不存在`);
    const before = { nickname: u.nickname, role: u.role };
    if (data.nickname !== undefined) u.nickname = data.nickname;
    if (data.role !== undefined) u.role = data.role;
    await this.repo.save(u);
    await this.opLog.record(ctx, 'update', 'admin_user', id, { before, after: data });
    return this.toResponse(u);
  }

  async setStatus(ctx: LogContext, id: number, status: 0 | 1) {
    const u = await this.repo.findOne({ where: { id } });
    if (!u) throw new NotFoundException(`管理员 ID ${id} 不存在`);
    if (u.id === ctx.adminId && status === 0) {
      throw new BadRequestException('不能停用自己');
    }
    u.status = status;
    await this.repo.save(u);
    await this.opLog.record(ctx, 'status', 'admin_user', id, { status });
    return this.toResponse(u);
  }

  async resetPassword(ctx: LogContext, id: number, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('密码至少 6 位');
    }
    const u = await this.repo.findOne({ where: { id } });
    if (!u) throw new NotFoundException(`管理员 ID ${id} 不存在`);
    u.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.repo.save(u);
    await this.opLog.record(ctx, 'reset_password', 'admin_user', id);
    return { success: true };
  }

  async remove(ctx: LogContext, id: number) {
    const u = await this.repo.findOne({ where: { id } });
    if (!u) throw new NotFoundException(`管理员 ID ${id} 不存在`);
    if (u.id === ctx.adminId) {
      throw new BadRequestException('不能删除自己');
    }
    if (u.username === 'superadmin') {
      throw new BadRequestException('不能删除内置 superadmin');
    }
    await this.repo.remove(u);
    await this.opLog.record(ctx, 'delete', 'admin_user', id, { username: u.username });
    return { success: true };
  }

  private toResponse(u: AdminUser) {
    return {
      id: u.id,
      username: u.username,
      nickname: u.nickname,
      avatar: u.avatar,
      role: u.role,
      status: u.status,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    };
  }
}
