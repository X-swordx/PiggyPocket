import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AdminRole } from './entities/admin-user.entity';

/**
 * 角色写权限守卫。挂在 AdminAuthGuard 之后（依赖 req.admin）。
 *
 * 规则：
 * - viewer：只读，禁止任何 POST/PUT/PATCH/DELETE。
 * - operator：可以写业务数据，但禁止访问系统管理（/admin/admins*、/admin/oplogs）。
 * - superadmin：不限制。
 *
 * 采用「按 HTTP 方法 + 路径前缀」判定，而不是给每个路由标注权限码，
 * 因为当前只有 3 个固定角色，逐个标注属于过度设计。
 */
@Injectable()
export class AdminRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const role: AdminRole | undefined = req.admin?.role;
    if (!role) {
      throw new ForbiddenException('缺少角色信息');
    }
    if (role === 'superadmin') {
      return true;
    }

    const method = String(req.method || '').toUpperCase();
    const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    if (role === 'viewer' && isWrite) {
      throw new ForbiddenException('只读角色不能执行写操作');
    }

    if (role === 'operator' && isSystemPath(req)) {
      throw new ForbiddenException('该角色无权访问系统管理');
    }

    return true;
  }
}

/** 系统管理相关路径：管理员账号、操作日志、角色权限配置。 */
function isSystemPath(req: { path?: string; url?: string }): boolean {
  const path = req.path ?? req.url ?? '';
  return /\/admin\/(admins|oplogs|role-permissions)\b/.test(path);
}
