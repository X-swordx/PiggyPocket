import {
  Entity,
  Column,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Order } from '../../order/entities/order.entity';
import { DiningGroupMember } from '../../dining-group/entities/dining-group-member.entity';

@Entity('users')
export class User {
  @ApiProperty({ description: '用户ID' })
  @PrimaryGeneratedColumn({ comment: '用户ID' })
  id: number;

  @ApiProperty({ description: '微信 openid' })
  @Column({ type: 'varchar', length: 100, unique: true, nullable: true, comment: '微信 openid' })
  openid: string;

  @ApiProperty({ description: '用户名' })
  @Column({ type: 'varchar', length: 50, nullable: true, comment: '用户名' })
  name: string;

  @ApiProperty({ description: '微信昵称' })
  @Column({ type: 'varchar', length: 50, nullable: true, comment: '微信昵称' })
  nickname: string;

  @ApiProperty({ description: '微信头像URL' })
  @Column({ type: 'varchar', length: 255, nullable: true, comment: '微信头像URL' })
  avatar: string;

  @ApiProperty({ description: '状态：1=启用 0=禁用' })
  @Index()
  @Column({ type: 'tinyint', default: 1, comment: '状态：1=启用 0=禁用' })
  status: number;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt: Date;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToMany(() => DiningGroupMember, (member) => member.user)
  groupMembers: DiningGroupMember[];
}
