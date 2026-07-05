import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateWishDto } from './create-wish.dto';

export class UpdateWishDto extends PartialType(CreateWishDto) {
  @ApiPropertyOptional({ description: '是否已完成' })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
