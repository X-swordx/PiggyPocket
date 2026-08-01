import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository } from 'typeorm';
import { Wish } from '../wish/entities/wish.entity';
import { User } from '../foodie-buddy/user/entities/user.entity';
import { CreateWishDto } from '../wish/dto/create-wish.dto';
import { UpdateWishDto } from '../wish/dto/update-wish.dto';
import { AdminListQueryDto } from './dto/admin-list-query.dto';
import { AdminOperationLogService, LogContext } from './admin-operation-log.service';

@Injectable()
export class AdminWishService {
  constructor(
    @InjectRepository(Wish)
    private readonly wishRepo: Repository<Wish>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly opLog: AdminOperationLogService,
  ) {}

  async findAll(
    query: AdminListQueryDto & { completed?: boolean; category?: string },
  ) {
    const { page, pageSize, userId, keyword, completed, category } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (userId) where.userId = userId;
    if (keyword) where.title = Like(`%${keyword}%`);
    if (completed !== undefined) where.completed = completed;
    if (category) where.category = category;

    const [rows, total] = await this.wishRepo.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    const users = await this.loadUserMap(rows.map((r) => r.userId));

    return {
      list: rows.map((r) => ({
        ...r,
        userNickname: users.get(r.userId)?.nickname ?? users.get(r.userId)?.name ?? null,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number) {
    const wish = await this.wishRepo.findOne({ where: { id } });
    if (!wish) throw new NotFoundException(`心愿 ID ${id} 不存在`);
    const user = await this.userRepo.findOne({ where: { id: wish.userId } });
    return {
      ...wish,
      userNickname: user?.nickname ?? user?.name ?? null,
    };
  }

  async create(ctx: LogContext, dto: CreateWishDto) {
    const saved = await this.wishRepo.save(this.wishRepo.create(dto));
    await this.opLog.record(ctx, 'create', 'wish', saved.id, { title: saved.title });
    return this.findOne(saved.id);
  }

  async update(ctx: LogContext, id: number, dto: UpdateWishDto) {
    const wish = await this.wishRepo.findOne({ where: { id } });
    if (!wish) throw new NotFoundException(`心愿 ID ${id} 不存在`);
    Object.assign(wish, dto);
    await this.wishRepo.save(wish);
    await this.opLog.record(ctx, 'update', 'wish', id, dto as any);
    return this.findOne(id);
  }

  async remove(ctx: LogContext, id: number) {
    const wish = await this.wishRepo.findOne({ where: { id } });
    if (!wish) throw new NotFoundException(`心愿 ID ${id} 不存在`);
    await this.wishRepo.remove(wish);
    await this.opLog.record(ctx, 'delete', 'wish', id, { title: wish.title });
    return { success: true };
  }

  async toggleCompleted(ctx: LogContext, id: number, completed: boolean) {
    return this.update(ctx, id, { completed } as UpdateWishDto);
  }

  private async loadUserMap(userIds: number[]) {
    const uniq = Array.from(new Set(userIds)).filter(Boolean);
    if (uniq.length === 0) return new Map<number, User>();
    const users = await this.userRepo.find({ where: { id: In(uniq) } });
    return new Map(users.map((u) => [u.id, u]));
  }
}
