import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('dish_categories')
export class DishCategory {
  @ApiProperty({ description: '分类ID' })
  @PrimaryGeneratedColumn({ comment: '分类ID' })
  id: number;

  @ApiProperty({ description: '分类名称' })
  @Column({ type: 'varchar', length: 50, unique: true, comment: '分类名称' })
  name: string;

  @ApiProperty({ description: '排序值，小的靠前' })
  @Column({ type: 'int', default: 0, comment: '排序值，小的靠前' })
  sort: number;

  @ApiProperty({ description: '是否启用：0=停用，1=启用' })
  @Column({ type: 'tinyint', default: 1, comment: '是否启用：0=停用，1=启用' })
  enabled: number;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt: Date;
}
