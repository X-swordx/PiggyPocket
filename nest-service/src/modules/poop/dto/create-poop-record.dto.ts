import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreatePoopRecordDto {
  @ApiProperty({ description: '用户ID' })
  @IsNotEmpty({ message: '用户ID不能为空' })
  @IsInt()
  userId: number;

  @ApiProperty({ description: '布里斯托大便分型 1-7' })
  @IsNotEmpty({ message: '请选择大便分型' })
  @IsInt()
  @Min(1)
  @Max(7)
  bristolType: number;

  @ApiPropertyOptional({
    description: '实际排便时间（ISO 时间字符串），不传默认为当前时间',
  })
  @IsOptional()
  @IsString()
  occurredAt?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;
}
