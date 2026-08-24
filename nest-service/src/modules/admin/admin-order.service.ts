import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository, Between } from 'typeorm';
import { Order } from '../foodie-buddy/order/entities/order.entity';
import { OrderItem } from '../foodie-buddy/order/entities/order-item.entity';
import { User } from '../foodie-buddy/user/entities/user.entity';
import { DiningGroup } from '../foodie-buddy/dining-group/entities/dining-group.entity';
import { AdminListQueryDto } from './dto/admin-list-query.dto';
import { AdminOperationLogService, LogContext } from './admin-operation-log.service';

export type OrderStatus = 'pending' | 'confirming' | 'cooking' | 'completed';

@Injectable()
export class AdminOrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly itemRepo: Repository<OrderItem>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(DiningGroup)
    private readonly groupRepo: Repository<DiningGroup>,
    private readonly opLog: AdminOperationLogService,
  ) {}

  async findAll(
    query: AdminListQueryDto & {
      status?: OrderStatus;
      groupId?: number;
      startDate?: string;
      endDate?: string;
      cookStartDate?: string;
      cookEndDate?: string;
    },
  ) {
    const {
      page,
      pageSize,
      userId,
      keyword,
      status,
      groupId,
      startDate,
      endDate,
      cookStartDate,
      cookEndDate,
    } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (groupId) where.groupId = groupId;
    if (keyword) where.orderNo = Like(`%${keyword}%`);
    if (startDate && endDate) {
      // 显式带东八区偏移：库内是 UTC，纯日期串会被当成 UTC 零点，起始边界会偏 8 小时
      where.createdAt = Between(
        new Date(`${startDate}T00:00:00+08:00`),
        new Date(`${endDate}T23:59:59+08:00`),
      );
    }
    if (cookStartDate && cookEndDate) {
      where.cookDate = Between(cookStartDate, cookEndDate);
    }

    const [rows, total] = await this.orderRepo.findAndCount({
      where,
      skip,
      take: pageSize,
      relations: ['items', 'items.dish', 'items.dish.categoryRef'],
      order: { cookDate: 'DESC', createdAt: 'DESC' },
    });

    const users = await this.loadUserMap(rows.map((r) => r.userId));
    const groups = await this.loadGroupMap(rows.map((r) => r.groupId).filter(Boolean) as number[]);

    return {
      list: rows.map((r) => ({
        ...r,
        userNickname: users.get(r.userId)?.nickname ?? users.get(r.userId)?.name ?? null,
        groupName: r.groupId ? groups.get(r.groupId)?.name ?? null : null,
        itemCount: r.items?.length ?? 0,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items', 'items.dish', 'items.dish.categoryRef'],
    });
    if (!order) throw new NotFoundException(`订单 ID ${id} 不存在`);
    const user = await this.userRepo.findOne({ where: { id: order.userId } });
    const group = order.groupId
      ? await this.groupRepo.findOne({ where: { id: order.groupId } })
      : null;
    return {
      ...order,
      userNickname: user?.nickname ?? user?.name ?? null,
      groupName: group?.name ?? null,
    };
  }

  async setStatus(ctx: LogContext, id: number, status: OrderStatus) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException(`订单 ID ${id} 不存在`);
    const before = order.status;
    order.status = status;
    await this.orderRepo.save(order);
    await this.opLog.record(ctx, 'status', 'order', id, { from: before, to: status });
    return this.findOne(id);
  }

  async updateRemark(ctx: LogContext, id: number, remark: string) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException(`订单 ID ${id} 不存在`);
    order.remark = remark;
    await this.orderRepo.save(order);
    await this.opLog.record(ctx, 'update', 'order_remark', id, { remark });
    return this.findOne(id);
  }

  async remove(ctx: LogContext, id: number) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!order) throw new NotFoundException(`订单 ID ${id} 不存在`);
    if (order.items?.length) {
      await this.itemRepo.remove(order.items);
    }
    await this.orderRepo.remove(order);
    await this.opLog.record(ctx, 'delete', 'order', id, { orderNo: order.orderNo });
    return { success: true };
  }

  private async loadUserMap(ids: number[]) {
    const uniq = Array.from(new Set(ids)).filter(Boolean);
    if (!uniq.length) return new Map<number, User>();
    const users = await this.userRepo.find({ where: { id: In(uniq) } });
    return new Map(users.map((u) => [u.id, u]));
  }

  private async loadGroupMap(ids: number[]) {
    const uniq = Array.from(new Set(ids)).filter(Boolean);
    if (!uniq.length) return new Map<number, DiningGroup>();
    const groups = await this.groupRepo.find({ where: { id: In(uniq) } });
    return new Map(groups.map((g) => [g.id, g]));
  }
}
