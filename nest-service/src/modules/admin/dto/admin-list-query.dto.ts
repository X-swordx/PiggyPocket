import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

/**
 * 后台管理端通用列表查询参数。
 * 与移动端 PaginationDto 的区别：`userId` 变为可选（后台可跨用户查询），
 * 并额外提供 `keyword` 用于名称/标题模糊搜索。
 */
export class AdminListQueryDto {
  @ApiPropertyOptional({ description: '页码，默认 1', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ description: '每页数量，默认 20', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize: number = 20;

  @ApiPropertyOptional({ description: '按用户 ID 过滤（可选）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @ApiPropertyOptional({ description: '关键字（作用在名称/标题）' })
  @IsOptional()
  @IsString()
  keyword?: string;
}
