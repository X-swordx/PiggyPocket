import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 到期提醒的「物品 × 接收人」推送记录。
 *
 * 一件物品共享给组后要分别推送给每个成员，各自的订阅额度也独立累计，
 * 所以无法再用 expiry_items 上的单个 notifiedAt 标记，只能按人记录：
 * 存在一条记录就表示该成员已成功收到过这件物品的提醒，不再重复推送。
 */
@Entity('expiry_item_notifications')
@Unique('UQ_expiry_notif_item_user', ['itemId', 'userId'])
export class ExpiryItemNotification {
  @ApiProperty({ description: 'ID' })
  @PrimaryGeneratedColumn({ comment: 'ID' })
  id: number;

  @ApiProperty({ description: '到期物品ID' })
  @Index()
  @Column({ type: 'int', comment: '到期物品ID' })
  itemId: number;

  @ApiProperty({ description: '接收提醒的用户ID' })
  @Column({ type: 'int', comment: '接收提醒的用户ID' })
  userId: number;

  @ApiProperty({ description: '成功推送日期' })
  @Column({ type: 'date', comment: '成功推送日期' })
  notifiedAt: string;

  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;
}
