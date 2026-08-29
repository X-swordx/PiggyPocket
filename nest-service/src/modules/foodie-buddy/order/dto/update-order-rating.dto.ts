import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUrl, Max, Min } from 'class-validator';

export class UpdateOrderRatingDto {
  @ApiProperty({ description: '评价星级 1-5' })
  @IsInt({ message: '星级必须是整数' })
  @Min(1, { message: '星级最低 1 星' })
  @Max(5, { message: '星级最高 5 星' })
  rating: number;

  @ApiPropertyOptional({ description: '评价图片URL' })
  @IsOptional()
  @IsUrl({}, { message: '评价图片必须是有效 URL' })
  ratingImage?: string;
}
