import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class CalorieIngredientDto {
  @IsString()
  @IsNotEmpty({ message: '食材名称不能为空' })
  name: string;

  @IsOptional()
  @IsString()
  amount?: string;
}

export class EstimateCaloriesDto {
  @IsString()
  @IsNotEmpty({ message: '菜品名称不能为空' })
  @MaxLength(50, { message: '菜品名称最长 50 个字符' })
  name: string;

  // 上传页的「再添加一行食材」不限行数，这里给提示词长度封顶
  @IsArray()
  @ArrayNotEmpty({ message: '用料清单不能为空' })
  @ArrayMaxSize(30, { message: '用料最多 30 项' })
  @ValidateNested({ each: true })
  @Type(() => CalorieIngredientDto)
  ingredients: CalorieIngredientDto[];
}
