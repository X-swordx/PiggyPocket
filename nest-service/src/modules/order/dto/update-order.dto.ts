import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateOrderDto {
  @ApiPropertyOptional({ description: '订单备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}
