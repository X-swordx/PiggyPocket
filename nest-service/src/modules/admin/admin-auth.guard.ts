import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';

/**
 * 管理端 JWT 守卫。
 * fantastic-admin 前端约定通过 `Token` 请求头传递 JWT，同时兼容标准 `Authorization: Bearer <token>`。
 * 校验通过后把 payload 挂到 `request.admin`。
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly authService: AdminAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = extractToken(req);
    if (!token) {
      throw new UnauthorizedException('缺少登录凭证');
    }
    const payload = await this.authService.verify(token);
    req.admin = payload;
    return true;
  }
}

function extractToken(req: { headers: Record<string, string | string[] | undefined> }): string | null {
  const raw = req.headers['token'] ?? req.headers['authorization'];
  if (!raw) return null;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  return value.startsWith('Bearer ') ? value.slice(7) : value;
}
