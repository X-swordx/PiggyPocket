import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

const STORAGE_VALUES = ['fridge', 'freezer', 'pantry'];
const CATEGORY_VALUES = [
  'dairy',
  'meat',
  'vegetable',
  'fruit',
  'seafood',
  'condiment',
  'snack',
  'other',
];

export class CreateExpiryFoodDto {
  @ApiProperty({ description: '用户ID' })
  @IsNotEmpty({ message: '用户ID不能为空' })
  @IsInt()
  userId: number;

  @ApiProperty({ description: '食品名称' })
  @IsNotEmpty({ message: '食品名称不能为空' })
  @IsString()
  name: string;

  @ApiProperty({ description: '保质期日期，如 2026-07-05' })
  @IsNotEmpty({ message: '保质期日期不能为空' })
  @IsString()
  expiryDate: string;

  @ApiPropertyOptional({ description: '数量', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ description: '储存位置：fridge/freezer/pantry' })
  @IsOptional()
  @IsIn(STORAGE_VALUES, {
    message: '储存位置只能是：fridge、freezer、pantry',
  })
  storage?: string;

  @ApiPropertyOptional({ description: '分类' })
  @IsOptional()
  @IsIn(CATEGORY_VALUES, {
    message: '分类只能是：dairy、meat、vegetable、fruit、seafood、condiment、snack、other',
  })
  category?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: '图片URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: '背景色' })
  @IsOptional()
  @IsString()
  bgColor?: string;
}
