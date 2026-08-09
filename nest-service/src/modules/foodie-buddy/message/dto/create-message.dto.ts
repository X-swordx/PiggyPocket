import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMessageDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  title: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  bgColor?: string;

  @ApiPropertyOptional({ description: '排序值，越小越靠前' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort?: number;

  @ApiPropertyOptional({ description: '是否启用：0-停用，1-启用' })
  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1])
  enabled?: number;
}
