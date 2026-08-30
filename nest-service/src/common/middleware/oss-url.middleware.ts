import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { OssService } from '../../modules/oss/oss.service';

/**
 * 剥掉请求体里 OSS URL 的读取签名。
 *
 * 编辑表单会把读到的图片 URL 原样回传（dish-detail / add-food /
 * history-menu / profile 四处都是「预填 → 保存时回传」），而响应里的 URL
 * 是 OssSignInterceptor 加过签名、会过期的。签名一旦入库，TTL 到点后
 * 那条记录的图片就永久失效——所以入库前先还原成裸 URL。
 *
 * 走中间件而不是全局 pipe：只碰 body，不波及 query/param，
 * 且在 ValidationPipe 之前执行。
 */
@Injectable()
export class OssUrlMiddleware implements NestMiddleware {
  constructor(private readonly ossService: OssService) {}

  use(req: Request, _res: Response, next: NextFunction) {
    this.strip(req.body);
    next();
  }

  private strip(value: any) {
    if (!value || typeof value !== 'object') return;
    for (const key of Object.keys(value)) {
      const item = value[key];
      if (typeof item === 'string') {
        value[key] = this.ossService.stripSign(item);
      } else {
        this.strip(item);
      }
    }
  }
}
