import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateWishDto {
  @ApiProperty({ description: '用户ID' })
  @IsNotEmpty({ message: '用户ID不能为空' })
  @IsInt()
  userId: number;

  @ApiProperty({ description: '心愿名称' })
  @IsNotEmpty({ message: '心愿名称不能为空' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: '分类：旅行/技能/健康/成长' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '分类样式标识' })
  @IsOptional()
  @IsString()
  tagClass?: string;

  @ApiPropertyOptional({ description: '筛选分组序号', default: 0 })
  @IsOptional()
  @IsInt()
  filter?: number;
}
