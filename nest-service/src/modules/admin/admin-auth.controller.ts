import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminResponseInterceptor } from './admin-response.interceptor';
import { AdminOperationLogService } from './admin-operation-log.service';

@ApiTags('后台 - 认证')
@Controller('admin/auth')
@UseInterceptors(AdminResponseInterceptor)
export class AdminAuthController {
  constructor(
    private readonly authService: AdminAuthService,
    private readonly opLog: AdminOperationLogService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: '管理员登录' })
  async login(@Req() req: any, @Body() dto: AdminLoginDto) {
    const result = await this.authService.login(dto);
    const xff = req?.headers?.['x-forwarded-for'];
    const ip = typeof xff === 'string' && xff.length
      ? xff.split(',')[0].trim()
      : req?.ip ?? null;
    await this.opLog.record(
      { adminId: result.id, adminUsername: result.username, ip },
      'login',
      'admin_auth',
      result.username,
    );
    return result;
  }

  @Get('profile')
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: '获取当前管理员信息' })
  profile(@Req() req: any) {
    return this.authService.getProfile(req.admin.sub);
  }

  @Post('logout')
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: '登出（客户端清除 token 即可，服务端无状态）' })
  async logout(@Req() req: any) {
    await this.opLog.record(
      { adminId: req.admin.sub, adminUsername: req.admin.username, ip: req?.ip ?? null },
      'logout',
      'admin_auth',
      req.admin.username,
    );
    return { success: true };
  }
}
