import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PoopRecord } from '../poop/entities/poop-record.entity';
import { User } from '../foodie-buddy/user/entities/user.entity';
import { CreatePoopRecordDto } from '../poop/dto/create-poop-record.dto';
import { UpdatePoopRecordDto } from '../poop/dto/update-poop-record.dto';
import { beijingDateOf } from '../poop/poop.service';
import { AdminListQueryDto } from './dto/admin-list-query.dto';
import { AdminOperationLogService, LogContext } from './admin-operation-log.service';

interface PoopListQueryDto extends AdminListQueryDto {
  bristolType?: number;
  startDate?: string;
  endDate?: string;
}

/**
 * 后台管理端专用的排便记录服务：可跨用户查询，附带用户昵称。
 */
@Injectable()
export class AdminPoopService {
  constructor(
    @InjectRepository(PoopRecord)
    private readonly recordRepo: Repository<PoopRecord>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly opLog: AdminOperationLogService,
  ) {}

  async findAll(query: PoopListQueryDto) {
    const {
      page,
      pageSize,
      userId,
      keyword,
      bristolType,
      startDate,
      endDate,
    } = query;

    const qb = this.recordRepo
      .createQueryBuilder('record')
      .orderBy('record.occurredAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    if (userId) qb.andWhere('record.userId = :userId', { userId });
    if (bristolType) qb.andWhere('record.bristolType = :bristolType', { bristolType });
    if (startDate) qb.andWhere('record.recordDate >= :startDate', { startDate });
    if (endDate) qb.andWhere('record.recordDate <= :endDate', { endDate });
    if (keyword) qb.andWhere('record.notes LIKE :kw', { kw: `%${keyword}%` });

    const [rows, total] = await qb.getManyAndCount();
    const users = await this.userRepo.find({
      where: { id: In(rows.map((r) => r.userId)) },
    });
    const userById = new Map(users.map((u) => [u.id, u]));

    return {
      list: rows.map((r) => this.toResponse(r, userById.get(r.userId))),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number) {
    const record = await this.getOrFail(id);
    const user = await this.userRepo.findOne({ where: { id: record.userId } });
    return this.toResponse(record, user);
  }

  async create(ctx: LogContext, dto: CreatePoopRecordDto) {
    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();
    const saved = await this.recordRepo.save(
      this.recordRepo.create({
        userId: dto.userId,
        bristolType: dto.bristolType,
        notes: dto.notes,
        occurredAt,
        recordDate: beijingDateOf(occurredAt),
      }),
    );
    await this.opLog.record(ctx, 'create', 'poop_record', saved.id, {
      bristolType: saved.bristolType,
    });
    return this.findOne(saved.id);
  }

  async update(ctx: LogContext, id: number, dto: UpdatePoopRecordDto) {
    const record = await this.getOrFail(id);

    let occurredAt = record.occurredAt;
    if (dto.occurredAt !== undefined) {
      occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();
    }

    Object.assign(record, dto, { occurredAt });
    record.recordDate = beijingDateOf(occurredAt);
    await this.recordRepo.save(record);

    await this.opLog.record(ctx, 'update', 'poop_record', id, dto as any);
    return this.findOne(id);
  }

  async remove(ctx: LogContext, id: number) {
    const record = await this.getOrFail(id);
    await this.recordRepo.remove(record);
    await this.opLog.record(ctx, 'delete', 'poop_record', id, {
      bristolType: record.bristolType,
    });
    return { success: true };
  }

  private async getOrFail(id: number) {
    const record = await this.recordRepo.findOne({ where: { id } });
    if (!record) throw new NotFoundException(`记录 ID ${id} 不存在`);
    return record;
  }

  private toResponse(record: PoopRecord, user?: User) {
    return {
      ...record,
      userNickname: user?.nickname ?? user?.name ?? null,
    };
  }
}
