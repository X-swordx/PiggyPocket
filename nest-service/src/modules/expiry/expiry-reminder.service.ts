import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpiryItem } from './entities/expiry-item.entity';
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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly wechatService: WechatService,
  ) {}

  @Cron('0 9 * * *', { timeZone: 'Asia/Shanghai' })
  async handleDailyReminder() {
    const result = await this.run();
    this.logger.log(
      `到期提醒执行完毕：待提醒 ${result.candidates} 件，已推送 ${result.sent} 条，跳过 ${result.skipped} 人`,
    );
  }

  /**
   * 扫描进入提醒窗口且从未推送过的物品，按用户推送一条微信订阅消息。
   *
   * 一次订阅授权只能推一条消息，所以同一用户有多件物品到期时，
   * 只推最早到期的那一件、也只给这一件打上 notifiedAt。其余留到下一天
   * （届时用户可能已再次授权），否则它们会永远收不到提醒。
   */
  async run(): Promise<ReminderResult> {
    const items = await this.itemRepository
      .createQueryBuilder('item')
      .where('item.notifiedAt IS NULL')
      .andWhere(
        `item.expiryDate <= DATE_ADD(${BEIJING_TODAY}, INTERVAL item.remindDays DAY)`,
      )
      .orderBy('item.expiryDate', 'ASC')
      .getMany();

    const byUser = new Map<number, ExpiryItem[]>();
    for (const item of items) {
      const list = byUser.get(item.userId);
      if (list) list.push(item);
      else byUser.set(item.userId, [item]);
    }

    let sent = 0;
    let skipped = 0;
    for (const [userId, list] of byUser) {
      if (await this.notifyUser(userId, list)) sent++;
      else skipped++;
    }

    return { candidates: items.length, sent, skipped };
  }

  private async notifyUser(
    userId: number,
    list: ExpiryItem[],
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user?.openid) return false;

    if (!(await this.wechatService.consumeQuota(userId))) return false;

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
        storage: STORAGE_LABELS[target.storage] || '未记录位置',
        quantity: target.quantity,
      }),
      REMIND_PAGE,
    );
    if (!success) {
      // 推送失败就把额度退回去，否则用户白白损失一次授权
      await this.wechatService.addQuota(userId, 1);
      return false;
    }

    await this.itemRepository.update(target.id, {
      notifiedAt: this.today(),
    });
    return true;
  }

  private today(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }
}
