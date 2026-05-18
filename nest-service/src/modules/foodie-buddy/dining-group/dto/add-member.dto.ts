import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({ description: '要添加成员的 openid' })
  @IsNotEmpty({ message: 'openid 不能为空' })
  @IsString()
  openid: string;

  @ApiProperty({ description: '在组内的昵称（可选）' })
  @IsOptional()
  @IsString()
  nickname?: string;
}
