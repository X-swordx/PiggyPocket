import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 每晚「拉粑粑么」提醒的成功推送记录，按「用户 × 日期」去重。
 */
@Entity('poop_reminder_notifications')
@Index('UQ_poop_reminder_user_date', ['userId', 'notifiedAt'], { unique: true })
export class PoopReminderNotification {
  @ApiProperty({ description: '记录ID' })
  @PrimaryGeneratedColumn({ comment: '记录ID' })
  id: number;

  @ApiProperty({ description: '接收提醒的用户ID' })
  @Column({ type: 'int', comment: '接收提醒的用户ID' })
  userId: number;

  @ApiProperty({ description: '成功推送日期（东八区日历日）' })
  @Column({
    type: 'date',
    comment: '成功推送日期（东八区日历日）',
  })
  notifiedAt: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;
}
