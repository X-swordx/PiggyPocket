import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Like,
  MoreThan,
  LessThan,
  Between,
  FindOperator,
  In,
} from 'typeorm';
import { ExpiryFood } from '../expiry/entities/expiry-food.entity';
import { User } from '../foodie-buddy/user/entities/user.entity';
import { CreateExpiryFoodDto } from '../expiry/dto/create-expiry-food.dto';
import { UpdateExpiryFoodDto } from '../expiry/dto/update-expiry-food.dto';
import { ExpiryStatus } from '../expiry/expiry.service';
import { AdminListQueryDto } from './dto/admin-list-query.dto';
import { AdminOperationLogService, LogContext } from './admin-operation-log.service';

/**
 * 后台管理端专用的临期食品服务。
 * 与 mobile 侧 ExpiryService 的区别：
 * - list 可以跨用户；userId、status、keyword 均为可选。
 * - 返回列表附带 user.nickname 便于表格展示。
 * - 提供批量删除已过期食品的能力。
 */
@Injectable()
export class AdminExpiryFoodService {
  constructor(
    @InjectRepository(ExpiryFood)
    private readonly foodRepo: Repository<ExpiryFood>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly opLog: AdminOperationLogService,
  ) {}

  async findAll(query: AdminListQueryDto & { status?: ExpiryStatus }) {
    const { page, pageSize, userId, keyword, status } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (userId) where.userId = userId;
    if (keyword) where.name = Like(`%${keyword}%`);

    const dateOp = this.buildDateOperator(status);
    if (dateOp) where.expiryDate = dateOp;

    const [rows, total] = await this.foodRepo.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { expiryDate: 'ASC' },
    });

    const users = await this.loadUserMap(rows.map((r) => r.userId));

    return {
      list: rows.map((r) => this.toResponse(r, users.get(r.userId))),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number) {
    const food = await this.foodRepo.findOne({ where: { id } });
    if (!food) throw new NotFoundException(`食品 ID ${id} 不存在`);
    const user = await this.userRepo.findOne({ where: { id: food.userId } });
    return this.toResponse(food, user ?? null);
  }

  async create(ctx: LogContext, dto: CreateExpiryFoodDto) {
    const saved = await this.foodRepo.save(this.foodRepo.create(dto));
    await this.opLog.record(ctx, 'create', 'expiry_food', saved.id, { name: saved.name });
    return this.findOne(saved.id);
  }

  async update(ctx: LogContext, id: number, dto: UpdateExpiryFoodDto) {
    const food = await this.foodRepo.findOne({ where: { id } });
    if (!food) throw new NotFoundException(`食品 ID ${id} 不存在`);
    Object.assign(food, dto);
    await this.foodRepo.save(food);
    await this.opLog.record(ctx, 'update', 'expiry_food', id, dto as any);
    return this.findOne(id);
  }

  async remove(ctx: LogContext, id: number) {
    const food = await this.foodRepo.findOne({ where: { id } });
    if (!food) throw new NotFoundException(`食品 ID ${id} 不存在`);
    await this.foodRepo.remove(food);
    await this.opLog.record(ctx, 'delete', 'expiry_food', id, { name: food.name });
    return { success: true };
  }

  /** 批量删除已过期食品；未指定 userId 时清理全部用户的过期项。 */
  async removeExpired(ctx: LogContext, userId?: number) {
    const today = this.formatDate(new Date());
    const where: any = { expiryDate: LessThan(today) };
    if (userId) where.userId = userId;
    const result = await this.foodRepo.delete(where);
    await this.opLog.record(ctx, 'delete', 'expiry_food_expired', null, {
      affected: result.affected ?? 0,
      userId,
    });
    return { success: true, affected: result.affected ?? 0 };
  }

  private buildDateOperator(
    status?: ExpiryStatus,
  ): FindOperator<string> | undefined {
    const today = this.formatDate(new Date());
    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 3);
    const soon = this.formatDate(soonDate);
    if (status === 'expired') return LessThan(today);
    if (status === 'expiring') return Between(today, soon);
    if (status === 'fresh') return MoreThan(soon);
    return undefined;
  }

  private async loadUserMap(userIds: number[]) {
    const uniq = Array.from(new Set(userIds)).filter(Boolean);
    if (uniq.length === 0) return new Map<number, User>();
    const users = await this.userRepo.find({ where: { id: In(uniq) } });
    return new Map(users.map((u) => [u.id, u]));
  }

  private toResponse(food: ExpiryFood, user: User | null | undefined) {
    const days = this.daysRemaining(food.expiryDate);
    const status: ExpiryStatus =
      days < 0 ? 'expired' : days <= 3 ? 'expiring' : 'fresh';
    const statusText =
      status === 'expired' ? '已过期' : status === 'expiring' ? '即将过期' : '新鲜';
    const daysText =
      days < 0
        ? `${Math.abs(days)}天前过期`
        : days === 0
          ? '今天过期'
          : `${days}天后过期`;
    return {
      ...food,
      status,
      statusText,
      daysRemaining: days,
      daysText,
      userNickname: user?.nickname ?? user?.name ?? null,
    };
  }

  private daysRemaining(expiryDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(`${expiryDate}T00:00:00`);
    return Math.ceil((expiry.getTime() - today.getTime()) / (86400 * 1000));
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
