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
}
