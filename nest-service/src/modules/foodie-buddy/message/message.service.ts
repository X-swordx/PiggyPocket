import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { MessageRead } from './entities/message-read.entity';

export interface MessageWithRead extends Message {
  isRead: boolean;
}

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(MessageRead)
    private readonly readRepository: Repository<MessageRead>,
  ) {}

  async findAllForUser(userId: number): Promise<MessageWithRead[]> {
    const messages = await this.messageRepository.find({
      where: { enabled: 1 },
      order: { sort: 'ASC', createdAt: 'DESC' },
    });

    const readRecord = await this.readRepository.findOne({ where: { userId } });
    const readAt = readRecord?.readAt ?? null;

    return messages.map((message) => ({
      ...message,
      isRead: readAt ? message.createdAt.getTime() <= readAt.getTime() : false,
    }));
  }

  async markAllRead(userId: number): Promise<{ success: boolean }> {
    let readRecord = await this.readRepository.findOne({ where: { userId } });
    const now = new Date();

    if (readRecord) {
      readRecord.readAt = now;
    } else {
      readRecord = this.readRepository.create({ userId, readAt: now });
    }

    await this.readRepository.save(readRecord);
    return { success: true };
  }
}
