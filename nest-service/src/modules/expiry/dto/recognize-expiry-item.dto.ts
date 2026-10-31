import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class RecognizeExpiryItemDto {
  @ApiProperty({ description: '已上传到本站 OSS 的图片 URL' })
  @IsNotEmpty({ message: '图片地址不能为空' })
  @IsString()
  @IsUrl(
    { require_protocol: true, protocols: ['http', 'https'] },
    { message: '图片地址不合法' },
  )
  imageUrl: string;
}
