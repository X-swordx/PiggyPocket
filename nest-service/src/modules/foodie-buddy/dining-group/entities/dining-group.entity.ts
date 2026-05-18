import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { DiningGroupMember } from './dining-group-member.entity';
import { User } from '../../user/entities/user.entity';
import { Order } from '../../order/entities/order.entity';

@Entity('dining_groups')
export class DiningGroup {
  @ApiProperty({ description: '组ID' })
  @PrimaryGeneratedColumn({ comment: '组ID' })
  id: number;

  @ApiProperty({ description: '组名' })
  @Column({ type: 'varchar', length: 100, comment: '组名' })
  name: string;

  @ApiProperty({ description: '创建者ID' })
  @Column({ type: 'int', comment: '创建者ID' })
  creatorId: number;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @OneToMany(() => DiningGroupMember, (member) => member.group)
  members: DiningGroupMember[];

  @OneToMany(() => Order, (order) => order.group)
  orders: Order[];
}
