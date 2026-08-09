import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('message_reads')
export class MessageRead {
  @ApiProperty({ description: '记录ID' })
  @PrimaryGeneratedColumn({ comment: '记录ID' })
  id: number;

  @ApiProperty({ description: '用户ID' })
  @Index({ unique: true })
  @Column({ type: 'int', comment: '用户ID' })
  userId: number;

  @ApiProperty({ description: '最近已读时间' })
  @Column({ type: 'datetime', comment: '最近已读时间' })
  readAt: Date;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt: Date;
}
