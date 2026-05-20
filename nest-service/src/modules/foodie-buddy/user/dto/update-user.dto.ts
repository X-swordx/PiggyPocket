import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
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
