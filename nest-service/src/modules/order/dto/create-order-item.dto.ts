import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty({ description: '菜品ID' })
  @IsNotEmpty({ message: '菜品ID不能为空' })
  @IsInt()
  dishId: number;

  @ApiProperty({ description: '数量', minimum: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity: number = 1;

  @ApiPropertyOptional({ description: '单项备注（少辣/不要葱等）' })
  @IsOptional()
  @IsString()
  remark?: string;
}
