import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { ExpiryItem } from '../expiry/entities/expiry-item.entity';
import { User } from '../foodie-buddy/user/entities/user.entity';
import { CreateExpiryItemDto } from '../expiry/dto/create-expiry-item.dto';
import { UpdateExpiryItemDto } from '../expiry/dto/update-expiry-item.dto';
import { ExpiryStatus, applyStatusFilter } from '../expiry/expiry.service';
import { buildSearchText } from '../expiry/expiry-labels';
import { ExpiryReminderService } from '../expiry/expiry-reminder.service';
import { ItemVectorService } from '../vector/item-vector.service';
import { AdminListQueryDto } from './dto/admin-list-query.dto';
import { AdminOperationLogService, LogContext } from './admin-operation-log.service';

/** 重建向量索引的分批大小，避免一次性 embed 太多文本。 */
const REINDEX_BATCH = 100;

/**
 * 后台管理端专用的到期物品服务。
 * 与 mobile 侧 ExpiryService 的区别：
 * - list 可以跨用户；userId、status、keyword 均为可选。
 * - 返回列表附带 user.nickname 便于表格展示。
 * - 提供批量删除已过期物品、重建向量索引、手动触发提醒的能力。
 */
@Injectable()
export class AdminExpiryItemService {
  constructor(
    @InjectRepository(ExpiryItem)
    private readonly itemRepo: Repository<ExpiryItem>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly vectorService: ItemVectorService,
    private readonly reminderService: ExpiryReminderService,
    private readonly opLog: AdminOperationLogService,
  ) {}

  async findAll(query: AdminListQueryDto & { status?: ExpiryStatus }) {
    const { page, pageSize, userId, keyword, status } = query;

    const qb = this.itemRepo
      .createQueryBuilder('item')
      .orderBy('item.expiryDate', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    if (userId) qb.andWhere('item.userId = :userId', { userId });
    if (keyword) qb.andWhere('item.name LIKE :kw', { kw: `%${keyword}%` });
    applyStatusFilter(qb, 'item', status);

    const [rows, total] = await qb.getManyAndCount();
    const users = await this.loadUserMap(rows.map((r) => r.userId));

    return {
      list: rows.map((r) => this.toResponse(r, users.get(r.userId))),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number) {
    const item = await this.getOrFail(id);
    const user = await this.userRepo.findOne({ where: { id: item.userId } });
    return this.toResponse(item, user ?? null);
  }

  async create(ctx: LogContext, dto: CreateExpiryItemDto) {
    const saved = await this.itemRepo.save(this.itemRepo.create(dto));
    await this.vectorService.upsert(
      saved.id,
      saved.userId,
      buildSearchText(saved),
    );
    await this.opLog.record(ctx, 'create', 'expiry_item', saved.id, { name: saved.name });
    return this.findOne(saved.id);
  }

  async update(ctx: LogContext, id: number, dto: UpdateExpiryItemDto) {
    const item = await this.getOrFail(id);
    const resetNotified =
      (dto.expiryDate !== undefined && dto.expiryDate !== item.expiryDate) ||
      (dto.remindDays !== undefined && dto.remindDays !== item.remindDays);

    Object.assign(item, dto);
    if (resetNotified) item.notifiedAt = null;

    const saved = await this.itemRepo.save(item);
    await this.vectorService.upsert(
      saved.id,
      saved.userId,
      buildSearchText(saved),
    );
    await this.opLog.record(ctx, 'update', 'expiry_item', id, dto as any);
    return this.findOne(id);
  }

  async remove(ctx: LogContext, id: number) {
    const item = await this.getOrFail(id);
    await this.itemRepo.remove(item);
    await this.vectorService.remove(id);
    await this.opLog.record(ctx, 'delete', 'expiry_item', id, { name: item.name });
    return { success: true };
  }

  /** 批量删除已过期物品；未指定 userId 时清理全部用户的过期项。 */
  async removeExpired(ctx: LogContext, userId?: number) {
    const today = this.formatDate(new Date());
    const where: any = { expiryDate: LessThan(today) };
    if (userId) where.userId = userId;

    const doomed = await this.itemRepo.find({ where, select: ['id'] });
    const result = await this.itemRepo.delete(where);
    for (const item of doomed) {
      await this.vectorService.remove(item.id);
    }

    await this.opLog.record(ctx, 'delete', 'expiry_item_expired', null, {
      affected: result.affected ?? 0,
      userId,
    });
    return { success: true, affected: result.affected ?? 0 };
  }

  /**
   * 全量重建向量索引。改造前录入的历史数据没有向量，不重建就搜不到；
   * 换了 embedding 模型或维度后也需要跑一次。
   */
  async reindex(ctx: LogContext) {
    if (!this.vectorService.enabled) {
      return { total: 0, indexed: 0, failed: 0, enabled: false };
    }

    const total = await this.itemRepo.count();
    let indexed = 0;
    for (let skip = 0; skip < total; skip += REINDEX_BATCH) {
      const rows = await this.itemRepo.find({
        skip,
        take: REINDEX_BATCH,
        order: { id: 'ASC' },
      });
      indexed += await this.vectorService.upsertMany(
        rows.map((item) => ({
          id: item.id,
          userId: item.userId,
          text: buildSearchText(item),
        })),
      );
    }

    await this.opLog.record(ctx, 'update', 'expiry_item_reindex', null, {
      total,
      indexed,
    });
    return { total, indexed, failed: total - indexed, enabled: true };
  }

  /** 手动触发一次到期提醒扫描，用于联调与补推。 */
  async runReminder(ctx: LogContext) {
    const result = await this.reminderService.run();
    await this.opLog.record(ctx, 'update', 'expiry_item_reminder', null, result as any);
    return result;
  }

  private async getOrFail(id: number) {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`物品 ID $416775509376_AWS_us-west-1 不存在`);
    return item;
  }

  private async loadUserMap(userIds: number[]) {
    const uniq = Array.from(new Set(userIds)).filter(Boolean);
    if (uniq.length === 0) return new Map<number, User>();
    const users = await this.userRepo.find({ where: { id: In(uniq) } });
    return new Map(users.map((u) => [u.id, u]));
  }

  private toResponse(item: ExpiryItem, user: User | null | undefined) {
    const days = this.daysRemaining(item.expiryDate);
    const status: ExpiryStatus =
      days < 0 ? 'expired' : days <= item.remindDays ? 'expiring' : 'fresh';
    const statusText =
      status === 'expired' ? '已过期' : status === 'expiring' ? '即将到期' : '充足';
    const daysText =
      days < 0
        ? `${Math.abs(days)}天前过期`
        : days === 0
          ? '今天到期'
          : `${days}天后到期`;
    return {
      ...item,
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
