import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminRolePermission } from './entities/admin-role-permission.entity';
import type { AdminRole } from './entities/admin-user.entity';
import {
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_CODES,
} from './admin-permissions';
import { AdminOperationLogService, LogContext } from './admin-operation-log.service';

/** 可在后台调整权限的角色（superadmin 固定全权限，不参与配置） */
const CONFIGURABLE_ROLES: AdminRole[] = ['operator', 'viewer'];

@Injectable()
export class AdminRolePermissionService {
  constructor(
    @InjectRepository(AdminRolePermission)
    private readonly repo: Repository<AdminRolePermission>,
    private readonly opLog: AdminOperationLogService,
  ) {}

  /** 取某角色的权限码；表里没有则回落到默认值。 */
  async getPermissions(role: AdminRole): Promise<string[]> {
    if (role === 'superadmin') {
      return ['*'];
    }
    const row = await this.repo.findOne({ where: { role } });
    if (!row) {
      return DEFAULT_ROLE_PERMISSIONS[role] ?? [];
    }
    return parsePermissions(row.permissions, role);
  }

  /** 后台「角色权限」页数据：全部权限码清单 + 各角色当前勾选值。 */
  async getConfig() {
    const roles = await Promise.all(
      CONFIGURABLE_ROLES.map(async (role) => ({
        role,
        permissions: await this.getPermissions(role),
      })),
    );
    return {
      allPermissions: ALL_PERMISSIONS,
      roles,
    };
  }

  async setPermissions(ctx: LogContext, role: AdminRole, permissions: string[]) {
    if (!CONFIGURABLE_ROLES.includes(role)) {
      throw new BadRequestException('该角色的权限不可修改');
    }
    const invalid = permissions.filter((p) => !PERMISSION_CODES.has(p));
    if (invalid.length) {
      throw new BadRequestException(`存在未知权限码：${invalid.join(', ')}`);
    }

    const before = await this.getPermissions(role);

    let row = await this.repo.findOne({ where: { role } });
    if (!row) {
      row = this.repo.create({ role });
    }
    row.permissions = JSON.stringify(permissions);
    await this.repo.save(row);

    await this.opLog.record(ctx, 'update', 'role_permission', role, {
      before,
      after: permissions,
    });

    return { role, permissions };
  }
}

function parsePermissions(raw: string, role: AdminRole): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((p): p is string => typeof p === 'string');
    }
  }
  catch {
    // 落库数据损坏时兜底到默认值，不让登录挂掉
  }
  return DEFAULT_ROLE_PERMISSIONS[role] ?? [];
}
