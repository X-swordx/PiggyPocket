import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';
import { DiningGroup } from '../../dining-group/entities/dining-group.entity';
import { OrderItem } from './order-item.entity';

@Entity('orders')
export class Order {
  @ApiProperty({ description: '订单ID' })
  @PrimaryGeneratedColumn({ comment: '订单ID' })
  id: number;

  @ApiProperty({ description: '订单号' })
  @Column({ type: 'varchar', length: 50, unique: true, comment: '订单号' })
  orderNo: string;

  @ApiProperty({ description: '下单用户ID' })
  @Column({ type: 'int', comment: '下单用户ID' })
  userId: number;

  @ApiProperty({ description: '用餐组ID' })
  @Column({ type: 'int', nullable: true, comment: '用餐组ID' })
  groupId: number;

  @ApiProperty({ description: '状态：pending/confirming/cooking/completed' })
  @Column({ type: 'varchar', length: 20, default: 'pending', comment: '状态：pending/confirming/cooking/completed' })
  status: string;

  @ApiProperty({ description: '订单备注' })
  @Column({ type: 'text', nullable: true, comment: '订单备注' })
  remark: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => DiningGroup, (group) => group.orders)
  @JoinColumn({ name: 'groupId' })
  group: DiningGroup;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];
}
