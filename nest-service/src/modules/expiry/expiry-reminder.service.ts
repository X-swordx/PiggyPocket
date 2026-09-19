import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ExpiryItem } from './entities/expiry-item.entity';
import { ExpiryItemNotification } from './entities/expiry-item-notification.entity';
import { DiningGroupMember } from '../foodie-buddy/dining-group/entities/dining-group-member.entity';
import { User } from '../foodie-buddy/user/entities/user.entity';
import { WechatService, buildExpiryData } from '../wechat/wechat.service';
import { STORAGE_LABELS } from './expiry-labels';
import { BEIJING_TODAY } from './expiry.service';

export interface ReminderResult {
  candidates: number;
  sent: number;
  skipped: number;
}

const REMIND_PAGE = 'pages/expiry/index';

@Injectable()
export class ExpiryReminderService {
  private readonly logger = new Logger(ExpiryReminderService.name);

  constructor(
    @InjectRepository(ExpiryItem)
    private readonly itemRepository: Repository<ExpiryItem>,
    @InjectRepository(ExpiryItemNotification)
    private readonly notificationRepository: Repository<ExpiryItemNotification>,
    @InjectRepository(DiningGroupMember)
    private readonly memberRepository: Repository<DiningGroupMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly wechatService: WechatService,
  ) {}

  @Cron('0 9 * * *', { timeZone: 'Asia/Shanghai' })
  async handleDailyReminder() {
    const result = await this.run();
    this.logger.log(
      `到期提醒执行完毕：待提醒 ${result.candidates} 条，已推送 ${result.sent} 人，跳过 ${result.skipped} 人`,
    );
  }

  /**
   * 扫描进入提醒窗口的物品，按「物品 × 接收人」展开推送：
   * - 私人物品接收人是所有者；共享物品接收人是当前组内全部成员（发送时实时取，
   *   成员退组后自然不再收到，无需在退组时清理）。
   * - 是否已推过由 expiry_item_notifications 按 (itemId, userId) 记录，
   *   每人有自己的订阅额度，互不影响。
   *
   * 一次订阅授权只能推一条消息，所以同一用户有多件待提醒物品时，
   * 只推最早到期的那一件；其余留到下一天（届时用户可能已再次授权）。
   */
  async run(): Promise<ReminderResult> {
    const items = await this.itemRepository
      .createQueryBuilder('item')
      .where(
        `item.expiryDate <= DATE_ADD(${BEIJING_TODAY}, INTERVAL item.remindDays DAY)`,
      )
      .orderBy('item.expiryDate', 'ASC')
      .getMany();

    if (!items.length) return { candidates: 0, sent: 0, skipped: 0 };

    // 共享物品 -> 组成员映射
    const groupIds = Array.from(
      new Set(items.map((i) => i.groupId).filter((g): g is number => !!g)),
    );
    const memberRows = groupIds.length
      ? await this.memberRepository.find({ where: { groupId: In(groupIds) } })
      : [];
    const membersByGroup = new Map<number, number[]>();
    for (const row of memberRows) {
      const list = membersByGroup.get(row.groupId);
      if (list) list.push(row.userId);
      else membersByGroup.set(row.groupId, [row.userId]);
    }

    // 已成功推送过的 (itemId,userId)，不再重复
    const sentRows = await this.notificationRepository.find({
      where: { itemId: In(items.map((i) => i.id)) },
    });
    const sentKeys = new Set(sentRows.map((r) => `${r.itemId}:${r.userId}`));

    // 按接收人聚合待提醒物品
    const pendingByUser = new Map<number, ExpiryItem[]>();
    let candidates = 0;
    for (const item of items) {
      const recipients = item.groupId
        ? membersByGroup.get(item.groupId) ?? []
        : [item.userId];
      for (const userId of recipients) {
        if (sentKeys.has(`${item.id}:${userId}`)) continue;
        const list = pendingByUser.get(userId);
        if (list) list.push(item);
        else pendingByUser.set(userId, [item]);
        candidates++;
      }
    }

    const users = await this.userRepository.find({
      where: { id: In([...pendingByUser.keys()]) },
    });
    const userById = new Map(users.map((u) => [u.id, u]));

    let sent = 0;
    let skipped = 0;
    for (const [userId, list] of pendingByUser) {
      if (await this.notifyUser(userById.get(userId), list)) sent++;
      else skipped++;
    }

    return { candidates, sent, skipped };
  }

  private async notifyUser(
    user: User | undefined,
    list: ExpiryItem[],
  ): Promise<boolean> {
    if (!user?.openid) return false;

    if (!(await this.wechatService.consumeQuota(user.id))) return false;

    const target = list[0];
    const remark =
      list.length > 1
        ? `另有${list.length - 1}件物品也快到期了`
        : target.notes || '记得及时处理';

    const success = await this.wechatService.sendSubscribeMessage(
      user.openid,
      buildExpiryData({
        name: target.name,
        expiryDate: target.expiryDate,
        remark,
        storage: STORAGE_LABELS[target.storage ?? ''] || '未记录位置',
        quantity: target.quantity,
      }),
      REMIND_PAGE,
    );
    if (!success) {
      // 推送失败就把额度退回去，否则用户白白损失一次授权
      await this.wechatService.addQuota(user.id, 1);
      return false;
    }

    // 唯一索引兜底并发，重复插入直接忽略
    await this.notificationRepository
      .insert({
        itemId: target.id,
        userId: user.id,
        notifiedAt: this.today(),
      })
      .catch(() => undefined);
    return true;
  }

  private today(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }
}
