import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/** 简易操作日志。action 字符串枚举；target 标识资源 ID（可空）。 */
@Entity('admin_operation_logs')
@Index('IDX_admin_oplog_createdAt', ['createdAt'])
@Index('IDX_admin_oplog_admin', ['adminId'])
export class AdminOperationLog {
  @ApiProperty({ description: '日志ID' })
  @PrimaryGeneratedColumn({ comment: '日志ID' })
  id: number;

  @ApiProperty({ description: '管理员ID' })
  @Column({ type: 'int', comment: '管理员ID' })
  adminId: number;

  @ApiProperty({ description: '管理员账号（冗余存）' })
  @Column({ type: 'varchar', length: 50, comment: '管理员账号' })
  adminUsername: string;

  @ApiProperty({ description: '动作', example: 'create/update/delete/login/...' })
  @Column({ type: 'varchar', length: 30, comment: '动作' })
  action: string;

  @ApiProperty({ description: '资源类型/名称', required: false })
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '资源类型或模块名',
  })
  resource: string | null;

  @ApiProperty({ description: '资源 ID（可空）' })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '资源 ID',
  })
  target: string | null;

  @ApiProperty({ description: '请求参数/上下文（json 文本）', required: false })
  @Column({ type: 'text', nullable: true, comment: '附加上下文' })
  payload: string | null;

  @ApiProperty({ description: '操作 IP' })
  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
    comment: '操作 IP',
  })
  ip: string | null;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;
}
