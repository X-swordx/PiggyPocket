import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AdminUser } from './entities/admin-user.entity';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRolePermissionService } from './admin-role-permission.service';

export interface AdminJwtPayload {
  sub: number;
  username: string;
  role: string;
}

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(AdminUser)
    private readonly adminRepo: Repository<AdminUser>,
    private readonly jwtService: JwtService,
    private readonly rolePermissionService: AdminRolePermissionService,
  ) {}

  async login(dto: AdminLoginDto) {
    const user = await this.adminRepo.findOne({ where: { username: dto.username } });
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    if (user.status !== 1) {
      throw new ForbiddenException('账号已被禁用');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    user.lastLoginAt = new Date();
    await this.adminRepo.save(user);

    const payload: AdminJwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };
    const token = await this.jwtService.signAsync(payload);

    return {
      id: user.id,
      token,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
      permissions: await this.rolePermissionService.getPermissions(user.role),
    };
  }

  async verify(token: string): Promise<AdminJwtPayload> {
    try {
      return await this.jwtService.verifyAsync<AdminJwtPayload>(token);
    } catch {
      throw new UnauthorizedException('登录已失效，请重新登录');
    }
  }

  async findById(id: number) {
    return this.adminRepo.findOne({ where: { id } });
  }

  async getProfile(id: number) {
    const user = await this.findById(id);
    if (!user || user.status !== 1) {
      throw new UnauthorizedException('账号不可用');
    }
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
      permissions: await this.rolePermissionService.getPermissions(user.role),
      lastLoginAt: user.lastLoginAt,
    };
  }
}
