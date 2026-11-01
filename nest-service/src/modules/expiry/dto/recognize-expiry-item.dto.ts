import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  IsUrl,
} from 'class-validator';

export class RecognizeExpiryItemDto {
  @ApiProperty({
    type: [String],
    description: '已上传到本站 OSS 的图片 URL，1～2 张，按 [名称面, 日期面] 顺序',
  })
  @IsArray({ message: '图片地址格式不正确' })
  @ArrayMinSize(1, { message: '至少上传一张图片' })
  @ArrayMaxSize(2, { message: '最多上传两张图片' })
  @IsString({ each: true })
  @IsUrl(
    { require_protocol: true, protocols: ['http', 'https'] },
    { each: true, message: '图片地址不合法' },
  )
  imageUrls: string[];
}
