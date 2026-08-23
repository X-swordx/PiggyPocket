import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WechatSubscribeQuota } from './entities/wechat-subscribe-quota.entity';

interface AccessTokenResponse {
  access_token?: string;
  expires_in?: number;
  errcode?: number;
  errmsg?: string;
}

interface SendResponse {
  errcode?: number;
  errmsg?: string;
}

/** thing 类型的字段微信限制 20 个字符以内，超了整条消息会被拒。 */
const truncate = (text: string, max = 20) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

/**
 * 拼装「到期提醒」订阅消息的 data。
 *
 * ⚠️ 字段名 = 公共模板库里该关键词的 `rule` + `kid`，由微信固定编号决定，
 * 与你在后台勾选的顺序无关（已用现有的 tid=508 模板验证：kid=2 → thing2）。
 * 这里对应 tid=1326「保质期到期提醒」勾选的五项：
 *   kid=5  物品名称 thing            → thing5
 *   kid=16 过期日期 time             → time16
 *   kid=3  备注     thing            → thing3
 *   kid=10 位置     thing            → thing10
 *   kid=14 余量     character_string → character_string14
 * 模板里勾了几项就必须全部传，缺一项微信同样返回 47003 参数不匹配。
 */
export const buildExpiryData = (item: {
  name: string;
  expiryDate: string;
  remark: string;
  storage: string;
  quantity: number;
}) => {
  const [year, month, day] = item.expiryDate.split('-');
  return {
    thing5: { value: truncate(item.name) },
    time16: { value: `${year}年${Number(month)}月${Number(day)}日` },
    thing3: { value: truncate(item.remark) },
    thing10: { value: truncate(item.storage) },
    // character_string 只收 32 位以内的数字/字母/符号，塞汉字（如「3件」）会被拒
    character_string14: { value: String(item.quantity) },
  };
};

@Injectable()
export class WechatService {
  private readonly logger = new Logger(WechatService.name);
  private tokenCache: { token: string; expiresAt: number } | null = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(WechatSubscribeQuota)
    private readonly quotaRepository: Repository<WechatSubscribeQuota>,
  ) {}

  get expiryTemplateId(): string | undefined {
    return this.configService.get<string>('WECHAT_EXPIRY_TEMPLATE_ID');
  }

  /** 微信 access_token 有日调用限额，必须缓存；提前 5 分钟过期留出时钟偏差余量。 */
  async getAccessToken(force = false): Promise<string> {
    if (!force && this.tokenCache && this.tokenCache.expiresAt > Date.now()) {
      return this.tokenCache.token;
    }

    const appid = this.configService.get<string>('WECHAT_APPID');
    const secret = this.configService.get<string>('WECHAT_SECRET');
    if (!appid || !secret) {
      throw new Error('微信小程序配置缺失，请检查 WECHAT_APPID / WECHAT_SECRET');
    }

    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(appid)}&secret=${encodeURIComponent(secret)}`;
    const response = await fetch(url);
    const result = (await response.json()) as AccessTokenResponse;
    if (!result.access_token) {
      throw new Error(`获取微信 access_token 失败：${result.errmsg || '未知错误'}`);
    }

    this.tokenCache = {
      token: result.access_token,
      expiresAt: Date.now() + ((result.expires_in || 7200) - 300) * 1000,
    };
    return result.access_token;
  }

  /**
   * 发送订阅消息。返回是否成功，失败只记日志由调用方决定重试策略。
   * page 为用户点击通知后跳转的小程序页面。
   */
  async sendSubscribeMessage(
    openid: string,
    data: Record<string, { value: string }>,
    page?: string,
  ): Promise<boolean> {
    const templateId = this.expiryTemplateId;
    if (!templateId) {
      this.logger.warn('未配置 WECHAT_EXPIRY_TEMPLATE_ID，跳过订阅消息推送');
      return false;
    }

    const send = async (token: string) => {
      const response = await fetch(
        `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${encodeURIComponent(token)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            touser: openid,
            template_id: templateId,
            page,
            data,
          }),
        },
      );
      return (await response.json()) as SendResponse;
    };

    try {
      let result = await send(await this.getAccessToken());
      // 40001/42001 是 token 失效，强制刷新后重试一次
      if (result.errcode === 40001 || result.errcode === 42001) {
        result = await send(await this.getAccessToken(true));
      }
      if (result.errcode) {
        this.logger.warn(
          `订阅消息推送失败 openid=${openid} errcode=${result.errcode} ${result.errmsg}`,
        );
        return false;
      }
      return true;
    } catch (error) {
      this.logger.warn(`订阅消息推送异常 openid=${openid}：${(error as Error).message}`);
      return false;
    }
  }

  /** 用户每次点击授权后累加一次推送额度。 */
  async addQuota(userId: number, count = 1): Promise<void> {
    await this.quotaRepository.query(
      'INSERT INTO `wechat_subscribe_quotas` (`userId`, `remaining`) VALUES (?, ?) ' +
        'ON DUPLICATE KEY UPDATE `remaining` = `remaining` + ?',
      [userId, count, count],
    );
  }

  /** 剩余可推送次数，供小程序判断是否还要提示用户去授权。 */
  async getQuota(userId: number): Promise<number> {
    const row = await this.quotaRepository.findOne({ where: { userId } });
    return row?.remaining ?? 0;
  }

  /** 原子扣减一次额度。返回 false 表示该用户已无额度可推。 */
  async consumeQuota(userId: number): Promise<boolean> {
    const result = await this.quotaRepository
      .createQueryBuilder()
      .update(WechatSubscribeQuota)
      .set({ remaining: () => '`remaining` - 1' })
      .where('userId = :userId AND remaining > 0', { userId })
      .execute();
    return (result.affected ?? 0) > 0;
  }
}
