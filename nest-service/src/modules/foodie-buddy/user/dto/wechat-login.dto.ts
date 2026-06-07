import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class WechatLoginDto {
  @ApiProperty({ description: '微信登录 code' })
  @IsNotEmpty({ message: 'code 不能为空' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ description: '微信昵称' })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({ description: '微信头像URL' })
  @IsOptional()
  @IsString()
  avatar?: string;
}
