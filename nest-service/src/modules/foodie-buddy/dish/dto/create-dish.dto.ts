import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

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
}
