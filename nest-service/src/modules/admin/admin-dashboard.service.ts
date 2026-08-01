import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, MoreThan, Repository } from 'typeorm';
import { User } from '../foodie-buddy/user/entities/user.entity';
import { ExpiryFood } from '../expiry/entities/expiry-food.entity';
import { Wish } from '../wish/entities/wish.entity';
import { Order } from '../foodie-buddy/order/entities/order.entity';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ExpiryFood)
    private readonly foodRepo: Repository<ExpiryFood>,
    @InjectRepository(Wish)
    private readonly wishRepo: Repository<Wish>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async overview() {
    const today = this.formatDate(new Date());
    const threeDaysLater = this.formatDate(this.daysFromNow(3));

    const [userTotal, foodTotal, wishTotal, orderTotal] = await Promise.all([
      this.userRepo.count(),
      this.foodRepo.count(),
      this.wishRepo.count(),
      this.orderRepo.count(),
    ]);

    const [
      newUsersToday,
      newOrdersToday,
      expiringSoon,
      expiringSoonCount,
      pendingOrdersCount,
      completedOrdersCount,
    ] = await Promise.all([
      this.userRepo.count({
        where: { createdAt: MoreThan(new Date(`${today}T00:00:00`)) },
      }),
      this.orderRepo.count({
        where: { createdAt: MoreThan(new Date(`${today}T00:00:00`)) },
      }),
      // 临期但还没过期（日期在今天到三天内）
      this.foodRepo.count({
        where: { expiryDate: Between(today, threeDaysLater) },
      }),
      // 0 业务含义：占位以避免变量重名
      Promise.resolve(0),
      this.orderRepo.count({ where: { status: 'pending' } }),
      this.orderRepo.count({ where: { status: 'completed' } }),
    ]);

    return {
      cards: {
        userTotal,
        foodTotal,
        wishTotal,
        orderTotal,
        newUsersToday,
        newOrdersToday,
        expiringSoon,
        pendingOrders: pendingOrdersCount,
        completedOrders: completedOrdersCount,
      },
    };
  }

  async orderStatusDistribution() {
    const rows = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(o.id)', 'count')
      .groupBy('o.status')
      .getRawMany<{ status: string; count: string }>();
    return rows.map((r) => ({ status: r.status, count: Number(r.count) }));
  }

  /** 近 N 天每日订单数（默认 7 天）。返回 [{ date: '2026-07-24', count: 3 }, ...] */
  async orderTrend(days = 7) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setDate(start.getDate() - (days - 1));

    const rows = await this.orderRepo
      .createQueryBuilder('o')
      .select("DATE_FORMAT(o.createdAt, '%Y-%m-%d')", 'date')
      .addSelect('COUNT(o.id)', 'count')
      .where('o.createdAt >= :start', { start: start.toISOString() })
      .groupBy('date')
      .getRawMany<{ date: string; count: string }>();

    const map = new Map(rows.map((r) => [r.date, Number(r.count)]));
    const list: { date: string; count: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = this.formatDate(d);
      list.push({ date: key, count: map.get(key) ?? 0 });
    }
    return list;
  }

  private daysFromNow(d: number) {
    const date = new Date();
    date.setDate(date.getDate() + d);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
