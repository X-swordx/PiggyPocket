import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt } from 'class-validator';

export class CreateDiningGroupDto {
  @ApiProperty({ description: '组名' })
  @IsNotEmpty({ message: '组名不能为空' })
  @IsString()
  name: string;

  @ApiProperty({ description: '创建者用户ID' })
  @IsNotEmpty({ message: '创建者ID不能为空' })
  @IsInt()
  creatorId: number;
}
