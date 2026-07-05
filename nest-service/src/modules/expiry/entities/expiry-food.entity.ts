import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('expiry_foods')
export class ExpiryFood {
  @ApiProperty({ description: '食品ID' })
  @PrimaryGeneratedColumn({ comment: '食品ID' })
  id: number;

  @ApiProperty({ description: '用户ID' })
  @Index()
  @Column({ type: 'int', comment: '用户ID' })
  userId: number;

  @ApiProperty({ description: '食品名称' })
  @Column({ type: 'varchar', length: 100, comment: '食品名称' })
  name: string;

  @ApiProperty({ description: '图片URL' })
  @Column({ type: 'varchar', length: 255, nullable: true, comment: '图片URL' })
  imageUrl?: string;

  @ApiProperty({ description: '保质期日期' })
  @Column({ type: 'date', comment: '保质期日期' })
  expiryDate: string;

  @ApiProperty({ description: '数量' })
  @Column({ type: 'int', default: 1, comment: '数量' })
  quantity: number;

  @ApiProperty({ description: '储存位置：fridge/freezer/pantry' })
  @Column({ type: 'varchar', length: 20, nullable: true, comment: '储存位置：fridge/freezer/pantry' })
  storage?: string;

  @ApiProperty({ description: '分类：dairy/meat/vegetable/fruit/seafood/condiment/snack/other' })
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
