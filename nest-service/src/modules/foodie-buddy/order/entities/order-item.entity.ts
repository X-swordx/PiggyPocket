import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Order } from './order.entity';
import { Dish } from '../../dish/entities/dish.entity';

@Entity('order_items')
export class OrderItem {
  @ApiProperty({ description: 'ID' })
  @PrimaryGeneratedColumn({ comment: 'ID' })
  id: number;

  @ApiProperty({ description: '订单ID' })
  @Column({ type: 'int', comment: '订单ID' })
  orderId: number;

  @ApiProperty({ description: '菜品ID' })
  @Column({ type: 'int', comment: '菜品ID' })
  dishId: number;

  @ApiProperty({ description: '数量' })
  @Column({ type: 'int', default: 1, comment: '数量' })
  quantity: number;

  @ApiProperty({ description: '单项备注' })
  @Column({ type: 'varchar', length: 255, nullable: true, comment: '单项备注' })
  remark: string;

  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => Dish)
  @JoinColumn({ name: 'dishId' })
  dish: Dish;
}
