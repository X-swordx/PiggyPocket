import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OssService } from './oss.service';

@ApiTags('OSS 上传')
@Controller('oss')
export class OssController {
  constructor(private readonly ossService: OssService) {}

  @Get('upload-token')
  @ApiOperation({ summary: '获取 OSS 直传 Post Policy 签名' })
  getUploadToken(@Query('dir') dir: string = 'uploads') {
    return this.ossService.generatePostPolicy(dir);
  }

  @Get('signed-url')
  @ApiOperation({ summary: '给裸 OSS URL 加读取签名' })
  getSignedUrl(@Query('url') url: string) {
    // 直传成功后客户端只有裸 URL，bucket 私有读，直接展示会 AccessDenied
    return { url: this.ossService.signUrl(url) };
  }
}
