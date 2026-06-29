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
}
