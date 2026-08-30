import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { OssService } from '../../modules/oss/oss.service';

/**
 * bucket 是私有读，数据库里存的裸 OSS URL 前端直接访问会 403。
 * 这里递归改写响应里所有属于本 bucket 的 URL，加上临时读取签名。
 *
 * 做成全局是为了一处覆盖所有实体的图片字段（dish.image /
 * expiry_item.imageUrl / user.avatar / admin_user.avatar /
 * order.ratingImage），小程序和管理端都不用改。
 *
 * 实体是 TypeORM 类实例而非 plain object，所以原地改写而不是重建对象；
 * createdAt/updatedAt 这类 Date 必须跳过，否则会被当普通对象拆掉。
 */
@Injectable()
export class OssSignInterceptor implements NestInterceptor {
  constructor(private readonly ossService: OssService) {}

  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => this.sign(data)));
  }

  private sign(value: any): any {
    if (typeof value === 'string') {
      return this.ossService.signUrl(value);
    }
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      for (const key of Object.keys(value)) {
        value[key] = this.sign(value[key]);
      }
    }
    return value;
  }
}
