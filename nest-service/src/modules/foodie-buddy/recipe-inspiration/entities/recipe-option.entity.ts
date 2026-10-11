import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/** 灵感菜谱选项类型 */
export type RecipeOptionType =
  | 'ingredient'
  | 'spicy'
  | 'preference'
  | 'taboo';

@Entity('recipe_options')
@Index('UQ_recipe_option_type_name', ['type', 'name'], { unique: true })
export class RecipeOption {
  @ApiProperty({ description: '选项ID' })
  @PrimaryGeneratedColumn({ comment: '选项ID' })
  id: number;

  @ApiProperty({
    description: '选项类型：ingredient=食材，spicy=辣度，preference=口味偏好，taboo=忌口',
  })
  @Column({ type: 'varchar', length: 20, comment: '选项类型' })
  type: RecipeOptionType;

  @ApiProperty({ description: '选项名称' })
  @Column({ type: 'varchar', length: 50, comment: '选项名称' })
  name: string;

  @ApiProperty({ description: '排序，小在前' })
  @Column({ type: 'int', default: 0, comment: '排序，小在前' })
  sort: number;

  @ApiProperty({ description: '状态：0=停用，1=启用' })
  @Column({ type: 'tinyint', default: 1, comment: '状态：0=停用，1=启用' })
  enabled: number;

  @ApiProperty({ description: '创建时间' })
  @CreateDateColumn({ type: 'datetime', comment: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @UpdateDateColumn({ type: 'datetime', comment: '更新时间' })
  updatedAt: Date;
}
