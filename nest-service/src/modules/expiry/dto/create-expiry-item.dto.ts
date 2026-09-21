import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const STORAGE_VALUES = ['fridge', 'freezer', 'pantry', 'cabinet', 'other'];
const SHELF_LIFE_UNITS = ['day', 'month'];
const CATEGORY_VALUES = [
  'food',
  'medicine',
  'cosmetic',
  'daily',
  'pet',
  'consumable',
  'card',
  'document',
  'other',
];

export class CreateExpiryItemDto {
  @ApiProperty({ description: '用户ID' })
  @IsNotEmpty({ message: '用户ID不能为空' })
  @IsInt()
  userId: number;

  @ApiPropertyOptional({
    description: '共享到的饭搭子组ID；不传或传 null 表示仅自己可见',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  groupId?: number | null;

  @ApiProperty({ description: '物品名称' })
  @IsNotEmpty({ message: '物品名称不能为空' })
  @IsString()
  name: string;

  @ApiProperty({ description: '生产日期，如 2026-07-05' })
  @IsNotEmpty({ message: '生产日期不能为空' })
  @IsString()
  productionDate: string;

  @ApiProperty({
    description: '保质期数值，到期日 = 生产日期 + 保质期',
    example: 7,
  })
  @IsNotEmpty({ message: '保质期数值不能为空' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  shelfLifeValue: number;

  @ApiProperty({
    description: '保质期单位：day=天，month=月',
    enum: SHELF_LIFE_UNITS,
    example: 'day',
  })
  @IsNotEmpty()
  @IsIn(SHELF_LIFE_UNITS, {
    message: '保质期单位只能是：day、month',
  })
  shelfLifeUnit: string;

  @ApiPropertyOptional({ description: '数量', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ description: '提前多少天提醒', default: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(365)
  remindDays?: number;

  @ApiPropertyOptional({
    description: '存放位置：fridge/freezer/pantry/cabinet/other',
  })
  @IsOptional()
  @IsIn(STORAGE_VALUES, {
    message: '存放位置只能是：fridge、freezer、pantry、cabinet、other',
  })
  storage?: string;

  @ApiPropertyOptional({ description: '分类' })
  @IsOptional()
  @IsIn(CATEGORY_VALUES, {
    message:
      '分类只能是：food、medicine、cosmetic、daily、pet、consumable、card、document、other',
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
