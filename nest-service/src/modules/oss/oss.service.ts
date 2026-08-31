import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface OssPostPolicy {
  host: string;
  accessid: string;
  policy: string;
  signature: string;
  expire: number;
  dir: string;
}

@Injectable()
export class OssService {
  private readonly endpoint: string;
  private readonly bucket: string;
  private readonly accessKeyId: string;
  private readonly accessKeySecret: string;
  private readonly host: string;

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.configService.get<string>('OSS_ENDPOINT', '');
    this.bucket = this.configService.get<string>('OSS_BUCKET', '');
    this.accessKeyId = this.configService.get<string>('OSS_ACCESS_KEY_ID', '');
    this.accessKeySecret = this.configService.get<string>('OSS_ACCESS_KEY_SECRET', '');

    // 构造 OSS Host
    // 如果 endpoint 已包含 bucket 则直接用，否则拼接 bucket.endpoint
    if (this.endpoint) {
      this.host = `https://${this.bucket}.${this.endpoint}`;
    } else {
      this.host = '';
    }
  }

  /**
   * 生成 OSS Post Policy 签名
   * 参考文档：https://help.aliyun.com/zh/oss/user-guide/wechat-applet-uploads-files-directly-to-oss
   */
  generatePostPolicy(dir: string): OssPostPolicy {
    const expire = Math.floor(Date.now() / 1000) + 300; // 5 分钟有效期
    const expireStr = new Date((expire + 8 * 3600) * 1000).toISOString(); // 北京时间

    const policyObj = {
      expiration: expireStr,
      conditions: [
        ['content-length-range', 1, 10485760], // 最大 10MB
        ['starts-with', '$key', dir],
      ],
    };

    const policy = Buffer.from(JSON.stringify(policyObj)).toString('base64');
    const signature = crypto
      .createHmac('sha1', this.accessKeySecret)
      .update(policy)
      .digest('base64');

    return {
      host: this.host,
      accessid: this.accessKeyId,
      policy,
      signature,
      expire,
      dir,
    };
  }

  /**
   * 给私有 bucket 的对象 URL 加读取签名。
   * bucket 是私有读，裸 URL 直接访问返回 AccessDenied。
   * 不属于本 bucket 的 URL（如微信 CDN 头像）原样返回。
   */
  signUrl(url: string): string {
    const key = this.extractKey(url);
    if (!key) return url;

    // 7 天：前端会把带图的数据缓存进本地存储（菜谱草稿、已选菜、登录用户），
    // 有效期太短会让隔天打开的缓存图 403
    const expires = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
    const signature = crypto
      .createHmac('sha1', this.accessKeySecret)
      .update(`GET\n\n\n${expires}\n/${this.bucket}/${key}`)
      .digest('base64');

    return `${this.host}/${key}?OSSAccessKeyId=${this.accessKeyId}&Expires=${expires}&Signature=${encodeURIComponent(signature)}`;
  }

  /**
   * 去掉读取签名。
   * 签名会过期，绝不能入库——否则 TTL 到点后那条记录的图片永久失效。
   */
  stripSign(url: string): string {
    const key = this.extractKey(url);
    return key ? `${this.host}/${key}` : url;
  }

  /** 从本 bucket 的 URL 里取出 object key；不是本 bucket 的返回空串。 */
  private extractKey(url: string): string {
    if (!this.host) return '';
    const prefix = `${this.host}/`;
    if (!url.startsWith(prefix)) return '';
    return url.slice(prefix.length).split('?')[0];
  }
}
