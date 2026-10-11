import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class GenerateRecipesDto {
  @ApiProperty({ description: '手头食材（至少 1 项）', type: [String] })
  @IsArray()
  @ArrayMinSize(1, { message: '至少选择或输入一种食材' })
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(20, { each: true, message: '食材名称过长' })
  ingredients: string[];

  @ApiPropertyOptional({ description: '用餐人数', default: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  people?: number;

  @ApiPropertyOptional({ description: '辣度' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  spicy?: string;

  @ApiPropertyOptional({ description: '口味偏好', type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(20, { each: true })
  preferences?: string[];

  @ApiPropertyOptional({ description: '忌口', type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(20, { each: true })
  taboos?: string[];

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  notes?: string;
}
