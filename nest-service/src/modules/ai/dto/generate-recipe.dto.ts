import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GenerateRecipeDto {
  @IsString()
  @IsNotEmpty({ message: '菜谱名称不能为空' })
  @MaxLength(50, { message: '菜谱名称最长 50 个字符' })
  name: string;
}
