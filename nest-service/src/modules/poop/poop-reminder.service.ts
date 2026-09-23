import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PoopRecord } from './entities/poop-record.entity';
import { PoopReminderNotification } from './entities/poop-reminder-notification.entity';
import { WechatSubscribeQuota } from '../wechat/entities/wechat-subscribe-quota.entity';
import { User } from '../foodie-buddy/user/entities/user.entity';
import { WechatService } from '../wechat/wechat.service';
import { beijingDateOf } from './poop.service';

export interface ReminderResult {
  candidates: number;
  sent: number;
  skipped: number;
}

const REMIND_PAGE = 'pages/poop/index';
const TEMPLATE_TYPE = 'poop';

/**
 * 拼装「拉粑粑么」订阅消息的 data。
 *
 * ⚠️ 字段名必须与小程序后台所选模板的关键词 kid 一一对应（约定同 buildExpiryData）。
 * 这里按常见「健康/生活提醒」模板的三个关键词（提醒事项 thing / 提醒时间 time /
 * 备注 thing）编写。在小程序公共模板库选定模板后，如 kid 不同需同步调整这里，
 * 否则微信返回 47003 参数不匹配。
 */
const buildPoopReminderData = () => {
  const now = new Date();
  return {
    thing21: { value: '今天拉粑粑了么？' },
    date14: {
      value: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate(),
      ).padStart(2, '0')} 21:00`,
    },
    thing10: { value: '记一笔，AI 帮你看看肠道状态' },
  };
};

@Injectable()
export class PoopReminderService {
  private readonly logger = new Logger(PoopReminderService.name);

  constructor(
    @InjectRepository(PoopRecord)
    private readonly recordRepository: Repository<PoopRecord>,
    @InjectRepository(PoopReminderNotification)
    private readonly notificationRepository: Repository<PoopReminderNotification>,
    @InjectRepository(WechatSubscribeQuota)
    private readonly quotaRepository: Repository<WechatSubscribeQuota>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly wechatService: WechatService,
  ) { }

  @Cron('0 21 * * *', { timeZone: 'Asia/Shanghai' })
  async handleDailyReminder() {
    const result = await this.run();
    this.logger.log(
      `排便提醒执行完毕：待提醒 ${result.candidates} 人，已推送 ${result.sent} 人，跳过 ${result.skipped} 人`,
    );
  }

  /**
   * 只推给「有 poop 模板订阅额度」的用户，并且：
   * - 今天已经记过排便的用户不打扰（问题已经有答案了）；
   * - 今天已经成功推过的不重复推，由 poop_reminder_notifications 去重。
   */
  async run(): Promise<ReminderResult> {
    const today = beijingDateOf(new Date());

    const quotaRows = await this.quotaRepository.find({
      where: { templateType: TEMPLATE_TYPE },
    });
    const candidateIds = quotaRows
      .filter((row) => row.remaining > 0)
      .map((row) => row.userId);
    if (!candidateIds.length) {
      return { candidates: 0, sent: 0, skipped: 0 };
    }

    const poopedToday = await this.recordRepository.find({
      where: { recordDate: today, userId: In(candidateIds) },
      select: ['userId'],
    });
    const poopedUserIds = new Set(poopedToday.map((r) => r.userId));

    const notifiedToday = await this.notificationRepository.find({
      where: { notifiedAt: today, userId: In(candidateIds) },
      select: ['userId'],
    });
    const notifiedUserIds = new Set(notifiedToday.map((r) => r.userId));

    const targets = candidateIds.filter(
      (userId) => !poopedUserIds.has(userId) && !notifiedUserIds.has(userId),
    );
    if (!targets.length) {
      return { candidates: 0, sent: 0, skipped: 0 };
    }

    const users = await this.userRepository.find({
      where: { id: In(targets) },
    });

    let sent = 0;
    let skipped = 0;
    for (const user of users) {
      if (await this.notifyUser(user, today)) sent++;
      else skipped++;
    }

    return { candidates: users.length, sent, skipped };
  }

  private async notifyUser(user: User, today: string): Promise<boolean> {
    if (!user.openid) return false;

    const templateId = this.wechatService.poopTemplateId;
    if (!templateId) return false;

    if (!(await this.wechatService.consumeQuota(user.id, TEMPLATE_TYPE))) {
      return false;
    }

    const success = await this.wechatService.sendSubscribeMessage(
      user.openid,
      buildPoopReminderData(),
      REMIND_PAGE,
      templateId,
    );
    if (!success) {
      // 推送失败退回额度，不白耗用户的一次授权
      await this.wechatService.addQuota(user.id, 1, TEMPLATE_TYPE);
      return false;
    }

    // 唯一索引兜底并发，重复插入直接忽略
    await this.notificationRepository
      .insert({ userId: user.id, notifiedAt: today })
      .catch(() => undefined);
    return true;
  }
}
