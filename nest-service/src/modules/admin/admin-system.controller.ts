import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsArray, IsIn, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminRoleGuard } from './admin-role.guard';
import { AdminResponseInterceptor } from './admin-response.interceptor';
import { AdminAccountService } from './admin-account.service';
import { AdminOperationLogService } from './admin-operation-log.service';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminRolePermissionService } from './admin-role-permission.service';
import { AdminListQueryDto } from './dto/admin-list-query.dto';
import { AdminRole } from './entities/admin-user.entity';

class CreateAdminDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsIn(['superadmin', 'operator', 'viewer'])
  role: AdminRole;
}

class UpdateAdminDto {
  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsIn(['superadmin', 'operator', 'viewer'])
  role?: AdminRole;
}

class ResetPasswordDto {
  @IsString()
  @MinLength(6)
  newPassword: string;
}

class StatusDto {
  @IsIn([0, 1])
  @Type(() => Number)
  status: 0 | 1;
}

class RolePermissionDto {
  @IsIn(['operator', 'viewer'])
  role: AdminRole;

  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}

function clientIp(req: any): string | null {
  const xff = req?.headers?.['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim();
  return req?.ip ?? null;
}

@ApiTags('后台 - Dashboard / 系统')
@Controller('admin')
@UseGuards(AdminAuthGuard, AdminRoleGuard)
@UseInterceptors(AdminResponseInterceptor)
export class AdminSystemController {
  constructor(
    private readonly accountService: AdminAccountService,
    private readonly opLog: AdminOperationLogService,
    private readonly dashboard: AdminDashboardService,
    private readonly rolePermission: AdminRolePermissionService,
  ) {}

  // ============ 角色权限配置 ============

  @Get('role-permissions')
  @ApiOperation({ summary: '获取全部权限码清单与各角色当前配置' })
  getRolePermissions() {
    return this.rolePermission.getConfig();
  }

  @Put('role-permissions')
  @ApiOperation({ summary: '保存某角色的权限码' })
  setRolePermissions(@Req() req: any, @Body() dto: RolePermissionDto) {
    return this.rolePermission.setPermissions(
      this.ctx(req),
      dto.role,
      dto.permissions,
    );
  }

  // ============ Dashboard ============

  @Get('dashboard/overview')
  getOverview() {
    return this.dashboard.overview();
  }

  @Get('dashboard/order-status')
  getOrderStatus() {
    return this.dashboard.orderStatusDistribution();
  }

  @Get('dashboard/order-trend')
  getOrderTrend(@Query('days') days?: string) {
    const n = Number(days) || 7;
    return this.dashboard.orderTrend(Math.min(Math.max(n, 1), 30));
  }

  // ============ 管理员账号 ============

  @Get('admins')
  listAdmins(@Query() query: AdminListQueryDto) {
    return this.accountService.findAll(query);
  }

  @Get('admins/:id')
  getAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.accountService.findOne(id);
  }

  @Post('admins')
  createAdmin(@Req() req: any, @Body() dto: CreateAdminDto) {
    return this.accountService.create(this.ctx(req), dto);
  }

  @Put('admins/:id')
  updateAdmin(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminDto,
  ) {
    return this.accountService.update(this.ctx(req), id, dto);
  }

  @Put('admins/:id/status')
  setAdminStatus(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: StatusDto,
  ) {
    return this.accountService.setStatus(this.ctx(req), id, dto.status);
  }

  @Put('admins/:id/password')
  resetAdminPassword(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.accountService.resetPassword(this.ctx(req), id, dto.newPassword);
  }

  @Delete('admins/:id')
  removeAdmin(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.accountService.remove(this.ctx(req), id);
  }

  // ============ 操作日志 ============

  @Get('oplogs')
  listLogs(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('adminId') adminId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.opLog.findAll({
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
      action,
      resource,
      adminId: adminId ? Number(adminId) : undefined,
      startDate,
      endDate,
    });
  }

  private ctx(req: any) {
    return {
      adminId: req.admin.sub,
      adminUsername: req.admin.username,
      ip: clientIp(req),
    };
  }
}
