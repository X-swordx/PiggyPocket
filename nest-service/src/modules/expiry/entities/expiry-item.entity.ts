import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('expiry_items')
export class ExpiryItem {
  @ApiProperty({ description: '物品ID' })
  @PrimaryGeneratedColumn({ comment: '物品ID' })
  id: number;

  @ApiProperty({ description: '用户ID' })
  @Index()
  @Column({ type: 'int', comment: '用户ID' })
  userId: number;

  @ApiProperty({ description: '物品名称' })
  @Column({ type: 'varchar', length: 100, comment: '物品名称' })
  name: string;

  @ApiProperty({ description: '图片URL' })
  @Column({ type: 'varchar', length: 255, nullable: true, comment: '图片URL' })
  imageUrl?: string;

  @ApiProperty({ description: '到期日期' })
  @Column({ type: 'date', comment: '到期日期' })
  expiryDate: string;

  @ApiProperty({ description: '数量' })
  @Column({ type: 'int', default: 1, comment: '数量' })
  quantity: number;

  @ApiProperty({ description: '提前多少天提醒' })
  @Column({ type: 'int', default: 3, comment: '提前多少天提醒' })
  remindDays: number;

  @ApiProperty({ description: '已推送提醒的日期，非空即不再重复推送' })
  @Column({
    type: 'date',
    nullable: true,
    comment: '已推送提醒的日期',
  })
  notifiedAt?: string | null;

  @ApiProperty({
    description: '存放位置：fridge/freezer/pantry/cabinet/other',
  })
  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '存放位置：fridge/freezer/pantry/cabinet/other',
  })
  storage?: string;

  @ApiProperty({
    description:
      '分类：food/medicine/cosmetic/daily/pet/consumable/card/document/other',
  })
  @Column({ type: 'varchar', length: 20, nullable: true, comment: '分类' })
  category?: string;

  @ApiProperty({ description: '备注' })
  @Column({ type: 'text', nullable: true, comment: '备注' })
  notes?: string;

  @ApiProperty({ description: '背景色' })
  @Column({ type: 'varchar', length: 20, nullable: true, comment: '背景色' })
  bgColor?: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt: Date;
}
