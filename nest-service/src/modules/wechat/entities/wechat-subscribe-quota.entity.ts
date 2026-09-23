import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 微信小程序订阅消息的推送额度。
 *
 * 小程序订阅消息是「一次性订阅」：用户点一次授权，服务端只能推一条消息。
 * 所以要把用户攒下的授权次数累计在这里，推送时逐次消费。
 * 额度按模板分别计算（expiry=到期提醒，poop=排便提醒），不能混用。
 */
@Entity('wechat_subscribe_quotas')
@Index('IDX_quota_user_type', ['userId', 'templateType'], { unique: true })
export class WechatSubscribeQuota {
  @ApiProperty({ description: '记录ID' })
  @PrimaryGeneratedColumn({ comment: '记录ID' })
  id: number;

  @ApiProperty({ description: '用户ID' })
  @Index()
  @Column({ type: 'int', comment: '用户ID' })
  userId: number;

  @ApiProperty({ description: '模板类型：expiry/poop' })
  @Column({
    type: 'varchar',
    length: 20,
    default: 'expiry',
    comment: '模板类型：expiry/poop',
  })
  templateType: string;

  @ApiProperty({ description: '剩余可推送次数' })
  @Column({ type: 'int', default: 0, comment: '剩余可推送次数' })
  remaining: number;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt: Date;
}
