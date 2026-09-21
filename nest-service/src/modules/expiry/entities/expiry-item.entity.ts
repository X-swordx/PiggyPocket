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

  @ApiProperty({ description: '所属饭搭子组ID，为空表示仅自己可见的私人物品', required: false })
  @Index()
  @Column({
    type: 'int',
    nullable: true,
    comment: '所属饭搭子组ID，为空表示私有',
  })
  groupId?: number | null;

  @ApiProperty({ description: '物品名称' })
  @Column({ type: 'varchar', length: 100, comment: '物品名称' })
  name: string;

  @ApiProperty({ description: '图片URL' })
  @Column({ type: 'varchar', length: 255, nullable: true, comment: '图片URL' })
  imageUrl?: string;

  @ApiProperty({ description: '生产日期', required: false })
  @Column({ type: 'date', nullable: true, comment: '生产日期' })
  productionDate?: string | null;

  @ApiProperty({ description: '保质期数值', required: false })
  @Column({ type: 'int', nullable: true, comment: '保质期数值' })
  shelfLifeValue?: number | null;

  @ApiProperty({ description: '保质期单位：day/month', required: false })
  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: '保质期单位：day/month',
  })
  shelfLifeUnit?: string | null;

  @ApiProperty({ description: '到期日期（生产日期 + 保质期，服务端计算）' })
  @Column({
    type: 'date',
    comment: '到期日期（生产日期 + 保质期，服务端计算）',
  })
  expiryDate: string;

  @ApiProperty({ description: '数量' })
  @Column({ type: 'int', default: 1, comment: '数量' })
  quantity: number;

  @ApiProperty({ description: '提前多少天提醒' })
  @Column({ type: 'int', default: 3, comment: '提前多少天提醒' })
  remindDays: number;

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
