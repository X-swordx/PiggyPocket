import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class InspiredIngredientDto {
  @ApiProperty({ description: '食材名称' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: '用量' })
  @IsString()
  @MaxLength(50)
  amount: string;
}

class SaveInspiredDishDto {
  @ApiProperty({ description: '菜品名称' })
  @IsNotEmpty({ message: '菜品名称不能为空' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: '一句话描述' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiPropertyOptional({ description: '烹饪时间' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  cookingTime?: string;

  @ApiPropertyOptional({ description: '用料', type: [InspiredIngredientDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => InspiredIngredientDto)
  ingredients?: InspiredIngredientDto[];

  @ApiPropertyOptional({ description: '烹饪步骤', type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  steps?: string[];
}

export class SaveInspirationDto {
  @ApiProperty({ description: '创建者ID' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  userId: number;

  @ApiProperty({ description: '所属饭搭子组ID' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  groupId: number;

  @ApiProperty({ description: '勾选要加入菜谱的推荐菜（1-3 道）', type: [SaveInspiredDishDto] })
  @IsArray()
  @ArrayMinSize(1, { message: '请至少勾选一道菜' })
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => SaveInspiredDishDto)
  dishes: SaveInspiredDishDto[];
}
