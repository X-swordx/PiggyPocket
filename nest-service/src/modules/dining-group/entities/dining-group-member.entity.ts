import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { DiningGroup } from './dining-group.entity';
import { User } from '../../user/entities/user.entity';

@Entity('dining_group_members')
export class DiningGroupMember {
  @ApiProperty({ description: 'ID' })
  @PrimaryGeneratedColumn({ comment: 'ID' })
  id: number;

  @ApiProperty({ description: '组ID' })
  @Column({ type: 'int', comment: '组ID' })
  groupId: number;

  @ApiProperty({ description: '用户ID' })
  @Column({ type: 'int', comment: '用户ID' })
  userId: number;

  @ApiProperty({ description: '在组内的昵称' })
  @Column({ type: 'varchar', length: 50, nullable: true, comment: '在组内的昵称' })
  nickname: string;

  @ApiProperty({ description: '加入时间' })
  @CreateDateColumn({ type: 'datetime', comment: '加入时间' })
  joinedAt: Date;

  @ManyToOne(() => DiningGroup, (group) => group.members)
  @JoinColumn({ name: 'groupId' })
  group: DiningGroup;

  @ManyToOne(() => User, (user) => user.groupMembers)
  @JoinColumn({ name: 'userId' })
  user: User;
}
