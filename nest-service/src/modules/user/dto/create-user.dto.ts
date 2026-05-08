import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: '微信 openid' })
  @IsNotEmpty({ message: 'openid 不能为空' })
  @IsString()
  openid: string;

  @ApiPropertyOptional({ description: '用户名' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '微信昵称' })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({ description: '微信头像URL' })
  @IsOptional()
  @IsString()
  avatar?: string;
}
