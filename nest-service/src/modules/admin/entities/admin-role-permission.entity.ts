import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import type { AdminRole } from './admin-user.entity';

/**
 * 角色 → 权限码配置。
 * 角色本身仍是固定枚举（superadmin/operator/viewer），
 * 但每个角色拥有哪些权限码可以在后台勾选调整，无需改代码。
 */
@Entity('admin_role_permissions')
export class AdminRolePermission {
  @ApiProperty({ description: 'ID' })
  @PrimaryGeneratedColumn({ comment: 'ID' })
  id: number;

  @ApiProperty({ description: '角色', enum: ['superadmin', 'operator', 'viewer'] })
  @Index('IDX_admin_role_perm_role', { unique: true })
  @Column({ type: 'varchar', length: 20, comment: '角色' })
  role: AdminRole;

  @ApiProperty({ description: '权限码列表（JSON 数组）' })
  @Column({ type: 'text', comment: '权限码列表（JSON 数组）' })
  permissions: string;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt: Date;
}
