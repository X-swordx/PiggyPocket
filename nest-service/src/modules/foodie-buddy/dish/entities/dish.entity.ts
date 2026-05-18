import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('dishes')
export class Dish {
  @ApiProperty({ description: '菜品ID' })
  @PrimaryGeneratedColumn({ comment: '菜品ID' })
  id: number;

  @ApiProperty({ description: '菜品名称' })
  @Column({ type: 'varchar', length: 100, comment: '菜品名称' })
  name: string;

  @ApiProperty({ description: '描述' })
  @Column({ type: 'text', nullable: true, comment: '描述' })
  description: string;

  @ApiProperty({ description: '分类：热菜/凉菜/主食/饮品' })
  @Column({ type: 'varchar', length: 50, nullable: true, comment: '分类：热菜/凉菜/主食/饮品' })
  category: string;

  @ApiProperty({ description: '图片URL' })
  @Column({ type: 'varchar', length: 255, nullable: true, comment: '图片URL' })
  image: string;

  @ApiProperty({ description: '状态：0=下架，1=上架' })
  @Column({ type: 'tinyint', default: 1, comment: '状态：0=下架，1=上架' })
  status: number;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt: Date;
}
