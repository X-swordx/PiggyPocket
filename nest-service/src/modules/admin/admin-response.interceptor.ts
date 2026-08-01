import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * 管理端专用响应包装。
 * fantastic-admin 前端 axios 拦截器约定 `{ status: 1|0, error, data }`：
 *   status=1 且 error 为空表示业务成功。
 *
 * 全局 TransformInterceptor 输出的是 `{ code, data, message }`，不兼容——
 * 因此在管理端 controller 上局部覆盖，全局拦截器最后再套一层无影响
 * （NestJS 中 controller 级拦截器先执行，因此这里返回的对象会成为最终 data
 * 再被全局 TransformInterceptor 包成 { code:0, data:{status:1,...}, message:'success' }。
 * 我们希望管理端返回的响应体是 fantastic-admin 期望的形状，所以在
 * app.module 注册时用 mount-path 排除法：管理端路径跳过全局拦截器，
 * 见 main.ts 的处理）。
 *
 * 这里只负责把 controller return 值包成 { status:1, error:'', data }。
 */
@Injectable()
export class AdminResponseInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => ({
        status: 1,
        error: '',
        data,
      })),
    );
  }
}
