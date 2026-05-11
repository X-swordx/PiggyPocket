import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsIn } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({ description: '订单状态：pending/confirming/cooking/completed' })
  @IsNotEmpty({ message: '状态不能为空' })
  @IsIn(['pending', 'confirming', 'cooking', 'completed'], {
    message: '无效的订单状态',
  })
  status: string;
}
