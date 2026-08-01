import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Like, Repository } from 'typeorm';
import { AdminOperationLog } from './entities/admin-operation-log.entity';

export interface LogContext {
  adminId: number;
  adminUsername: string;
  ip?: string | null;
}

@Injectable()
export class AdminOperationLogService {
  constructor(
    @InjectRepository(AdminOperationLog)
    private readonly repo: Repository<AdminOperationLog>,
  ) {}

  /** 写一条日志；失败不抛错，避免日志写失败影响主业务。 */
  async record(
    ctx: LogContext,
    action: string,
    resource?: string,
    target?: string | number | null,
    payload?: unknown,
  ) {
    try {
      const row = this.repo.create({
        adminId: ctx.adminId,
        adminUsername: ctx.adminUsername,
        action,
        resource: resource ?? null,
        target: target === undefined || target === null ? null : String(target),
        payload: payload === undefined ? null : safeStringify(payload),
        ip: ctx.ip ?? null,
      });
      await this.repo.save(row);
    }
    catch (err) {
      // 不阻断业务
      // eslint-disable-next-line no-console
      console.error('[admin-oplog] record failed', err);
    }
  }

  async findAll(query: {
    page?: number;
    pageSize?: number;
    action?: string;
    resource?: string;
    adminId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, pageSize = 20, action, resource, adminId, startDate, endDate } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (adminId) where.adminId = adminId;
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(`${endDate}T23:59:59`));
    }

    const [list, total] = await this.repo.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    return { list, total, page, pageSize };
  }
}

function safeStringify(v: unknown): string {
  try {
    return JSON.stringify(v, (_k, val) => {
      if (val instanceof Date) return val.toISOString();
      return val;
    });
  }
  catch {
    return '[unserializable]';
  }
}
