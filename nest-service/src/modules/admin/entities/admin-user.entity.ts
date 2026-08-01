import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/** 管理员角色 */
export type AdminRole = 'superadmin' | 'operator' | 'viewer';

/** 管理员状态：1=启用 0=禁用 */
export type AdminStatus = 0 | 1;

@Entity('admin_users')
export class AdminUser {
  @ApiProperty({ description: '管理员ID' })
  @PrimaryGeneratedColumn({ comment: '管理员ID' })
  id: number;

  @ApiProperty({ description: '登录用户名' })
  @Index('IDX_admin_users_username', { unique: true })
  @Column({ type: 'varchar', length: 50, comment: '登录用户名' })
  username: string;

  @ApiProperty({ description: '密码哈希（bcrypt）' })
  @Column({ type: 'varchar', length: 100, comment: '密码哈希（bcrypt）' })
  passwordHash: string;

  @ApiProperty({ description: '显示昵称' })
  @Column({ type: 'varchar', length: 50, nullable: true, comment: '显示昵称' })
  nickname: string;

  @ApiProperty({ description: '头像 URL' })
  @Column({ type: 'varchar', length: 255, nullable: true, comment: '头像 URL' })
  avatar: string;

  @ApiProperty({ description: '角色', enum: ['superadmin', 'operator', 'viewer'] })
  @Column({
    type: 'varchar',
    length: 20,
    default: 'operator',
    comment: '角色：superadmin/operator/viewer',
  })
  role: AdminRole;

  @ApiProperty({ description: '状态：1=启用 0=禁用' })
  @Column({ type: 'tinyint', default: 1, comment: '状态：1=启用 0=禁用' })
  status: AdminStatus;

  @ApiProperty({ description: '最后登录时间' })
  @Column({ type: 'datetime', nullable: true, comment: '最后登录时间' })
  lastLoginAt: Date;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt: Date;
}
