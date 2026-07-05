import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';


class DishIngredientDto {
  @ApiProperty({ description: '食材名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '用量' })
  @IsString()
  amount: string;
}

export class CreateDishDto {
  @ApiProperty({ description: '菜品名称' })
  @IsNotEmpty({ message: '菜品名称不能为空' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '分类：热菜/凉菜/主食/饮品' })
  @IsOptional()
  @IsIn(['热菜', '凉菜', '主食', '饮品'], { message: '分类只能是：热菜、凉菜、主食、饮品' })
  category?: string;

  @ApiPropertyOptional({ description: '图片URL' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: '状态：0=下架，1=上架', default: 1 })
  @IsOptional()
  @IsIn([0, 1], { message: '状态只能是 0 或 1' })
  status?: number;

  @ApiPropertyOptional({ description: '热量' })
  @IsOptional()
  @IsInt()
  calories?: number;

  @ApiPropertyOptional({ description: '烹饪时间' })
  @IsOptional()
  @IsString()
  cookingTime?: string;

  @ApiPropertyOptional({ description: '用料', type: [DishIngredientDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DishIngredientDto)
  ingredients?: DishIngredientDto[];

  @ApiPropertyOptional({ description: '烹饪步骤', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  steps?: string[];

  @ApiPropertyOptional({ description: '标签', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: '背景色' })
  @IsOptional()
  @IsString()
  bgColor?: string;

  @ApiProperty({ description: '创建者ID' })
  @IsNotEmpty({ message: '创建者ID不能为空' })
  @Type(() => Number)
  @IsInt({ message: '创建者ID必须是整数' })
  userId: number;

  @ApiProperty({ description: '所属饭搭子组ID' })
  @IsNotEmpty({ message: '所属饭搭子组ID不能为空' })
  @Type(() => Number)
  @IsInt({ message: '所属饭搭子组ID必须是整数' })
  groupId: number;
}
