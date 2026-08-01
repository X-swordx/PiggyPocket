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

  @ApiProperty({ description: '热量' })
  @Column({ type: 'int', nullable: true, comment: '热量' })
  calories?: number;

  @ApiProperty({ description: '烹饪时间' })
  @Column({ type: 'varchar', length: 50, nullable: true, comment: '烹饪时间' })
  cookingTime?: string;

  @ApiProperty({ description: '用料' })
  @Column({ type: 'simple-json', nullable: true, comment: '用料' })
  ingredients?: Array<{ name: string; amount: string }>;

  @ApiProperty({ description: '烹饪步骤' })
  @Column({ type: 'simple-json', nullable: true, comment: '烹饪步骤' })
  steps?: string[];

  @ApiProperty({ description: '标签' })
  @Column({ type: 'simple-json', nullable: true, comment: '标签' })
  tags?: string[];

  @ApiProperty({ description: '背景色' })
  @Column({ type: 'varchar', length: 20, nullable: true, comment: '背景色' })
  bgColor?: string;

  @ApiProperty({ description: '创建者ID' })
  @Column({ type: 'int', comment: '创建者ID' })
  userId: number;

  @ApiProperty({ description: '所属饭搭子组ID', required: false })
  @Column({ type: 'int', nullable: true, comment: '所属饭搭子组ID' })
  groupId: number | null;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt: Date;
}
