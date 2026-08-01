import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository } from 'typeorm';
import { User } from '../foodie-buddy/user/entities/user.entity';
import { ExpiryFood } from '../expiry/entities/expiry-food.entity';
import { Wish } from '../wish/entities/wish.entity';
import { Dish } from '../foodie-buddy/dish/entities/dish.entity';
import { Order } from '../foodie-buddy/order/entities/order.entity';
import { AdminListQueryDto } from './dto/admin-list-query.dto';
import { AdminOperationLogService, LogContext } from './admin-operation-log.service';

/**
 * 管理端用户下拉/搜索。返回精简字段，避免暴露 openid 完整值。
 */
@Injectable()
export class AdminUserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ExpiryFood)
    private readonly foodRepo: Repository<ExpiryFood>,
    @InjectRepository(Wish)
    private readonly wishRepo: Repository<Wish>,
    @InjectRepository(Dish)
    private readonly dishRepo: Repository<Dish>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly opLog: AdminOperationLogService,
  ) {}

  async search(keyword?: string, limit = 30) {
    const where = keyword
      ? [{ nickname: Like(`%${keyword}%`) }, { name: Like(`%${keyword}%`) }]
      : {};
    const users = await this.userRepo.find({
      where,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return users.map((u) => ({
      id: u.id,
      nickname: u.nickname ?? u.name ?? `用户${u.id}`,
      avatar: u.avatar,
      openidTail: u.openid ? u.openid.slice(-6) : null,
    }));
  }

  async findAll(query: AdminListQueryDto) {
    const { page, pageSize, keyword } = query;
    const skip = (page - 1) * pageSize;

    const where = keyword
      ? [{ nickname: Like(`%${keyword}%`) }, { name: Like(`%${keyword}%`) }]
      : {};

    const [rows, total] = await this.userRepo.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    // 批量计数
    const counts = await this.loadCounts(rows.map((r) => r.id));

    return {
      list: rows.map((r) => ({
        id: r.id,
        nickname: r.nickname ?? r.name ?? null,
        avatar: r.avatar,
        openidTail: r.openid?.slice(-6) ?? null,
        status: r.status,
        createdAt: r.createdAt,
        foodCount: counts.food.get(r.id) ?? 0,
        wishCount: counts.wish.get(r.id) ?? 0,
        dishCount: counts.dish.get(r.id) ?? 0,
        orderCount: counts.order.get(r.id) ?? 0,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`用户 ID ${id} 不存在`);
    const counts = await this.loadCounts([id]);
    return {
      id: user.id,
      openid: user.openid,
      openidTail: user.openid?.slice(-6) ?? null,
      nickname: user.nickname ?? user.name ?? null,
      name: user.name,
      avatar: user.avatar,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      foodCount: counts.food.get(id) ?? 0,
      wishCount: counts.wish.get(id) ?? 0,
      dishCount: counts.dish.get(id) ?? 0,
      orderCount: counts.order.get(id) ?? 0,
    };
  }

  async update(
    ctx: LogContext,
    id: number,
    data: { nickname?: string; avatar?: string },
  ) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`用户 ID ${id} 不存在`);
    if (data.nickname !== undefined) user.nickname = data.nickname;
    if (data.avatar !== undefined) user.avatar = data.avatar;
    await this.userRepo.save(user);
    await this.opLog.record(ctx, 'update', 'user', id, data);
    return this.findOne(id);
  }

  async setStatus(ctx: LogContext, id: number, status: 0 | 1) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`用户 ID ${id} 不存在`);
    const before = user.status;
    user.status = status;
    await this.userRepo.save(user);
    await this.opLog.record(ctx, 'status', 'user', id, { from: before, to: status });
    return this.findOne(id);
  }

  private async loadCounts(userIds: number[]) {
    const empty = new Map<number, number>();
    if (!userIds.length) {
      return { food: empty, wish: empty, dish: empty, order: empty };
    }
    const [foods, wishes, dishes, orders] = await Promise.all([
      this.groupCount(this.foodRepo, 'expiry_food', 'userId', userIds),
      this.groupCount(this.wishRepo, 'wish', 'userId', userIds),
      this.groupCount(this.dishRepo, 'dish', 'userId', userIds),
      this.groupCount(this.orderRepo, 'order', 'userId', userIds),
    ]);
    return { food: foods, wish: wishes, dish: dishes, order: orders };
  }

  private async groupCount(
    repo: Repository<any>,
    alias: string,
    field: string,
    ids: number[],
  ): Promise<Map<number, number>> {
    const rows = await repo
      .createQueryBuilder(alias)
      .select(`${alias}.${field}`, 'uid')
      .addSelect('COUNT(*)', 'cnt')
      .where(`${alias}.${field} IN (:...ids)`, { ids })
      .groupBy(`${alias}.${field}`)
      .getRawMany<{ uid: number; cnt: string }>();
    return new Map(rows.map((r) => [Number(r.uid), Number(r.cnt)]));
  }
}
