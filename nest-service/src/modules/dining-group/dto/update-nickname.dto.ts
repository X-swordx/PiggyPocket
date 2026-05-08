import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt } from 'class-validator';

export class UpdateNicknameDto {
  @ApiProperty({ description: '用户ID' })
  @IsNotEmpty({ message: '用户ID不能为空' })
  @IsInt()
  userId: number;

  @ApiProperty({ description: '新昵称' })
  @IsNotEmpty({ message: '昵称不能为空' })
  @IsString()
  nickname: string;
}
