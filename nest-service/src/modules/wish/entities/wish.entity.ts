import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('wishes')
export class Wish {
  @ApiProperty({ description: '心愿ID' })
  @PrimaryGeneratedColumn({ comment: '心愿ID' })
  id: number;

  @ApiProperty({ description: '用户ID' })
  @Index()
  @Column({ type: 'int', comment: '用户ID' })
  userId: number;

  @ApiProperty({ description: '心愿名称' })
  @Column({ type: 'varchar', length: 100, comment: '心愿名称' })
  title: string;

  @ApiProperty({ description: '分类：旅行/技能/健康/成长' })
  @Column({ type: 'varchar', length: 20, nullable: true, comment: '分类：旅行/技能/健康/成长' })
  category: string;

  @ApiProperty({ description: '分类样式标识' })
  @Column({ type: 'varchar', length: 20, nullable: true, comment: '分类样式标识' })
  tagClass: string;

  @ApiProperty({ description: '筛选分组序号' })
  @Column({ type: 'int', default: 0, comment: '筛选分组序号' })
  filter: number;

  @ApiProperty({ description: '是否已完成' })
  @Column({ type: 'boolean', default: false, comment: '是否已完成' })
  completed: boolean;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt: Date;
}
