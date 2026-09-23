import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('poop_records')
@Index('IDX_poop_user_date', ['userId', 'recordDate'])
export class PoopRecord {
  @ApiProperty({ description: '记录ID' })
  @PrimaryGeneratedColumn({ comment: '记录ID' })
  id: number;

  @ApiProperty({ description: '用户ID' })
  @Index()
  @Column({ type: 'int', comment: '用户ID' })
  userId: number;

  @ApiProperty({ description: '排便日期（东八区日历日，服务端按 occurredAt 换算）' })
  @Column({
    type: 'date',
    comment: '排便日期（东八区日历日，服务端按 occurredAt 换算）',
  })
  recordDate: string;

  @ApiProperty({ description: '实际排便时间（UTC）' })
  @Column({ type: 'datetime', comment: '实际排便时间（UTC）' })
  occurredAt: Date;

  @ApiProperty({ description: '布里斯托大便分型 1-7' })
  @Column({ type: 'tinyint', comment: '布里斯托大便分型 1-7' })
  bristolType: number;

  @ApiProperty({ description: '备注', required: false })
  @Column({ type: 'text', nullable: true, comment: '备注' })
  notes?: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt: Date;
}
