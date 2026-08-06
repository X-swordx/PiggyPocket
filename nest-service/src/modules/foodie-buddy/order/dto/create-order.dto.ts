import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @ApiProperty({ description: '下单用户ID' })
  @IsNotEmpty({ message: '用户ID不能为空' })
  @IsInt()
  userId: number;

  @ApiPropertyOptional({ description: '用餐组ID' })
  @IsOptional()
  @IsInt()
  groupId?: number;

  @ApiPropertyOptional({ description: '订单备注' })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiPropertyOptional({ description: '做菜日期，如 2026-08-05' })
  @IsOptional()
  @IsString()
  cookDate?: string;

  @ApiProperty({ description: '订单项列表', type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
