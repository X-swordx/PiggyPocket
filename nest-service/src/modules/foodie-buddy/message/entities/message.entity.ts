import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('messages')
export class Message {
  @ApiProperty({ description: '消息ID' })
  @PrimaryGeneratedColumn({ comment: '消息ID' })
  id: number;

  @ApiProperty({ description: '标题' })
  @Column({ type: 'varchar', length: 100, comment: '标题' })
  title: string;

  @ApiProperty({ description: '内容' })
  @Column({ type: 'text', comment: '内容' })
  content: string;

  @ApiProperty({ description: '图标名' })
  @Column({ type: 'varchar', length: 50, default: 'sound-filled', comment: '图标名' })
  icon: string;

  @ApiProperty({ description: '图标背景色' })
  @Column({ type: 'varchar', length: 20, default: '#ffc2cc', comment: '图标背景色' })
  bgColor: string;

  @ApiProperty({ description: '排序值' })
  @Column({ type: 'int', default: 0, comment: '排序值' })
  sort: number;

  @ApiProperty({ description: '是否启用：0-停用，1-启用' })
  @Column({ type: 'tinyint', default: 1, comment: '是否启用' })
  enabled: number;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt: Date;
}
