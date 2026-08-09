import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Message } from '../foodie-buddy/message/entities/message.entity';
import { CreateMessageDto } from '../foodie-buddy/message/dto/create-message.dto';
import { UpdateMessageDto } from '../foodie-buddy/message/dto/update-message.dto';
import { AdminListQueryDto } from './dto/admin-list-query.dto';
import { AdminOperationLogService, LogContext } from './admin-operation-log.service';

@Injectable()
export class AdminMessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly opLog: AdminOperationLogService,
  ) {}

  async findAll(query: AdminListQueryDto) {
    const { page, pageSize, keyword } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (keyword) {
      where.title = Like(`%${keyword}%`);
    }

    const [list, total] = await this.messageRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { sort: 'ASC', createdAt: 'DESC' },
    });

    return { list, total, page, pageSize };
  }

  async findOne(id: number) {
    const message = await this.messageRepository.findOne({ where: { id } });
    if (!message) {
      throw new NotFoundException(`消息 ID ${id} 不存在`);
    }
    return message;
  }

  async create(ctx: LogContext, dto: CreateMessageDto) {
    const message = this.messageRepository.create(dto);
    const saved = await this.messageRepository.save(message);
    await this.opLog.record(ctx, 'create', 'message', saved.id, dto);
    return saved;
  }

  async update(ctx: LogContext, id: number, dto: UpdateMessageDto) {
    const message = await this.findOne(id);
    Object.assign(message, dto);
    const saved = await this.messageRepository.save(message);
    await this.opLog.record(ctx, 'update', 'message', saved.id, dto);
    return saved;
  }

  async setEnabled(ctx: LogContext, id: number, enabled: number) {
    const message = await this.findOne(id);
    message.enabled = enabled === 0 ? 0 : 1;
    const saved = await this.messageRepository.save(message);
    await this.opLog.record(ctx, 'setEnabled', 'message', saved.id, { enabled: saved.enabled });
    return saved;
  }

  async remove(ctx: LogContext, id: number) {
    const message = await this.findOne(id);
    await this.messageRepository.remove(message);
    await this.opLog.record(ctx, 'delete', 'message', id);
    return { success: true };
  }
}
