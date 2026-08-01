import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // 管理端接口已经用局部拦截器包装成 fantastic-admin 需要的
        // { status, error, data } 结构，此处不再二次包装。
        if (data && typeof data === 'object' && 'status' in data && 'error' in data) {
          return data;
        }
        return {
          code: 0,
          data,
          message: 'success',
        };
      }),
    );
  }
}
