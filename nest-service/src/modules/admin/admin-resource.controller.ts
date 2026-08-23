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
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminRoleGuard } from './admin-role.guard';
import { AdminResponseInterceptor } from './admin-response.interceptor';
import { AdminListQueryDto } from './dto/admin-list-query.dto';
import { AdminExpiryItemService } from './admin-expiry-item.service';
import { AdminWishService } from './admin-wish.service';
import { AdminDishService } from './admin-dish.service';
import { AdminDishCategoryService } from './admin-dish-category.service';
import { AdminUserService } from './admin-user.service';
import { AdminOrderService, OrderStatus } from './admin-order.service';
import { AdminDiningGroupService } from './admin-dining-group.service';
import { OssService } from '../oss/oss.service';
import { CreateExpiryItemDto } from '../expiry/dto/create-expiry-item.dto';
import { UpdateExpiryItemDto } from '../expiry/dto/update-expiry-item.dto';
import { CreateWishDto } from '../wish/dto/create-wish.dto';
import { UpdateWishDto } from '../wish/dto/update-wish.dto';
import { CreateDishDto } from '../foodie-buddy/dish/dto/create-dish.dto';
import { UpdateDishDto } from '../foodie-buddy/dish/dto/update-dish.dto';
import { ExpiryStatus } from '../expiry/expiry.service';

class ExpiryQueryDto extends AdminListQueryDto {
  @IsOptional()
  @IsIn(['fresh', 'expiring', 'expired'])
  status?: ExpiryStatus;
}

class WishQueryDto extends AdminListQueryDto {
  @IsOptional()
  completed?: string;

  @IsOptional()
  category?: string;
}

class DishQueryDto extends AdminListQueryDto {
  @IsOptional()
  @Type(() => Number)
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  status?: number;

  @IsOptional()
  @Type(() => Number)
  groupId?: number;
}

class DishCategoryCreateDto {
  @IsString()
  name: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number;

  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1])
  enabled?: number;
}

class DishCategoryUpdateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort?: number;

  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1])
  enabled?: number;
}

class OrderQueryDto extends AdminListQueryDto {
  @IsOptional()
  @IsIn(['pending', 'confirming', 'cooking', 'completed'])
  status?: OrderStatus;

  @IsOptional()
  @Type(() => Number)
  groupId?: number;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  cookStartDate?: string;

  @IsOptional()
  @IsString()
  cookEndDate?: string;
}

class OrderStatusDto {
  @IsIn(['pending', 'confirming', 'cooking', 'completed'])
  status: OrderStatus;
}

class OrderRemarkDto {
  @IsString()
  remark: string;
}

class DiningGroupCreateDto {
  @IsString()
  name: string;

  @Type(() => Number)
  @IsInt()
  creatorId: number;
}

class DiningGroupUpdateDto {
  @IsOptional()
  @IsString()
  name?: string;
}

class MemberAddDto {
  @Type(() => Number)
  @IsInt()
  userId: number;

  @IsOptional()
  @IsString()
  nickname?: string;
}

class MemberUpdateDto {
  @IsOptional()
  @IsString()
  nickname?: string;
}

class UserUpdateDto {
  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}

@ApiTags('后台 - 数据管理')
@Controller('admin')
@UseGuards(AdminAuthGuard, AdminRoleGuard)
@UseInterceptors(AdminResponseInterceptor)
export class AdminResourceController {
  constructor(
    private readonly expiryService: AdminExpiryItemService,
    private readonly wishService: AdminWishService,
    private readonly dishService: AdminDishService,
    private readonly dishCategoryService: AdminDishCategoryService,
    private readonly userService: AdminUserService,
    private readonly orderService: AdminOrderService,
    private readonly groupService: AdminDiningGroupService,
    private readonly ossService: OssService,
  ) {}

  private ctx(req: any) {
    const xff = req?.headers?.['x-forwarded-for'];
    const ip = typeof xff === 'string' && xff.length
      ? xff.split(',')[0].trim()
      : req?.ip ?? null;
    return {
      adminId: req.admin.sub,
      adminUsername: req.admin.username,
      ip,
    };
  }

  // ================== 用户下拉 ==================

  @Get('users/options')
  @ApiOperation({ summary: '用户下拉搜索（精简版）' })
  searchUsers(@Query('keyword') keyword?: string) {
    return this.userService.search(keyword);
  }

  // ================== 用户管理 ==================

  @Get('users')
  @ApiOperation({ summary: '用户列表（含关联数量）' })
  listUsers(@Query() query: AdminListQueryDto) {
    return this.userService.findAll(query);
  }

  @Get('users/:id')
  getUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Put('users/:id')
  updateUser(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UserUpdateDto,
  ) {
    return this.userService.update(this.ctx(req), id, dto);
  }

  @Put('users/:id/status')
  setUserStatus(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: number,
  ) {
    return this.userService.setStatus(this.ctx(req), id, (status === 0 ? 0 : 1) as 0 | 1);
  }

  // ================== OSS 上传凭证代理 ==================

  @Get('oss/upload-token')
  @ApiOperation({ summary: '获取 OSS 直传签名（后台专用透传）' })
  getOssToken(@Query('dir') dir = 'admin') {
    return this.ossService.generatePostPolicy(dir);
  }

  // ================== 到期管家 ==================

  @Get('expiry-items')
  @ApiOperation({ summary: '到期物品列表' })
  listItems(@Query() query: ExpiryQueryDto) {
    return this.expiryService.findAll(query);
  }

  @Get('expiry-items/:id')
  getItem(@Param('id', ParseIntPipe) id: number) {
    return this.expiryService.findOne(id);
  }

  @Post('expiry-items')
  createItem(@Req() req: any, @Body() dto: CreateExpiryItemDto) {
    return this.expiryService.create(this.ctx(req), dto);
  }

  @Put('expiry-items/:id')
  updateItem(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExpiryItemDto,
  ) {
    return this.expiryService.update(this.ctx(req), id, dto);
  }

  @Delete('expiry-items/:id')
  removeItem(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.expiryService.remove(this.ctx(req), id);
  }

  @Delete('expiry-items/expired/batch')
  @ApiOperation({ summary: '批量删除已过期物品，可选按 userId 过滤' })
  removeExpiredItems(
    @Req() req: any,
    @Query('userId') userId?: string,
  ) {
    const uid = userId ? Number(userId) : undefined;
    return this.expiryService.removeExpired(this.ctx(req), uid);
  }

  @Post('expiry-items/reindex')
  @ApiOperation({ summary: '重建到期物品的向量索引（历史数据补向量用）' })
  reindexItems(@Req() req: any) {
    return this.expiryService.reindex(this.ctx(req));
  }

  @Post('expiry-items/reminder/run')
  @ApiOperation({ summary: '立即执行一次到期提醒扫描' })
  runItemReminder(@Req() req: any) {
    return this.expiryService.runReminder(this.ctx(req));
  }

  // ================== 心愿 ==================

  @Get('wishes')
  listWishes(@Query() query: WishQueryDto) {
    const completed =
      query.completed === undefined
        ? undefined
        : query.completed === 'true';
    return this.wishService.findAll({ ...query, completed });
  }

  @Get('wishes/:id')
  getWish(@Param('id', ParseIntPipe) id: number) {
    return this.wishService.findOne(id);
  }

  @Post('wishes')
  createWish(@Req() req: any, @Body() dto: CreateWishDto) {
    return this.wishService.create(this.ctx(req), dto);
  }

  @Put('wishes/:id')
  updateWish(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWishDto,
  ) {
    return this.wishService.update(this.ctx(req), id, dto);
  }

  @Put('wishes/:id/completed')
  toggleWishCompleted(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('completed') completed: boolean,
  ) {
    return this.wishService.toggleCompleted(this.ctx(req), id, completed);
  }

  @Delete('wishes/:id')
  removeWish(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.wishService.remove(this.ctx(req), id);
  }

  // ================== 菜品 ==================

  @Get('dishes')
  listDishes(@Query() query: DishQueryDto) {
    return this.dishService.findAll(query);
  }

  @Get('dishes/:id')
  getDish(@Param('id', ParseIntPipe) id: number) {
    return this.dishService.findOne(id);
  }

  @Post('dishes')
  createDish(@Req() req: any, @Body() dto: CreateDishDto) {
    return this.dishService.create(this.ctx(req), dto);
  }

  @Put('dishes/:id')
  updateDish(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDishDto,
  ) {
    return this.dishService.update(this.ctx(req), id, dto);
  }

  @Put('dishes/:id/status')
  setDishStatus(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: number,
  ) {
    return this.dishService.setStatus(this.ctx(req), id, status);
  }

  @Delete('dishes/:id')
  removeDish(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.dishService.remove(this.ctx(req), id);
  }

  // ================== 菜品分类 ==================

  @Get('dish-categories')
  listDishCategories() {
    return this.dishCategoryService.findAll();
  }

  @Post('dish-categories')
  createDishCategory(@Req() req: any, @Body() dto: DishCategoryCreateDto) {
    return this.dishCategoryService.create(this.ctx(req), dto);
  }

  @Put('dish-categories/:id')
  updateDishCategory(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DishCategoryUpdateDto,
  ) {
    return this.dishCategoryService.update(this.ctx(req), id, dto);
  }

  @Put('dish-categories/:id/enabled')
  setDishCategoryEnabled(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('enabled') enabled: number,
  ) {
    return this.dishCategoryService.setEnabled(this.ctx(req), id, enabled);
  }

  @Delete('dish-categories/:id')
  removeDishCategory(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.dishCategoryService.remove(this.ctx(req), id);
  }

  // ================== 订单 ==================

  @Get('orders')
  listOrders(@Query() query: OrderQueryDto) {
    return this.orderService.findAll(query);
  }

  @Get('orders/:id')
  getOrder(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.findOne(id);
  }

  @Put('orders/:id/status')
  setOrderStatus(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: OrderStatusDto,
  ) {
    return this.orderService.setStatus(this.ctx(req), id, dto.status);
  }

  @Put('orders/:id/remark')
  setOrderRemark(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: OrderRemarkDto,
  ) {
    return this.orderService.updateRemark(this.ctx(req), id, dto.remark);
  }

  @Delete('orders/:id')
  removeOrder(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.orderService.remove(this.ctx(req), id);
  }

  // ================== 饭搭子分组 ==================

  @Get('dining-groups')
  listGroups(@Query() query: AdminListQueryDto) {
    return this.groupService.findAll(query);
  }

  @Get('dining-groups/:id')
  getGroup(@Param('id', ParseIntPipe) id: number) {
    return this.groupService.findOne(id);
  }

  @Post('dining-groups')
  createGroup(@Req() req: any, @Body() dto: DiningGroupCreateDto) {
    return this.groupService.create(this.ctx(req), dto);
  }

  @Put('dining-groups/:id')
  updateGroup(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DiningGroupUpdateDto,
  ) {
    return this.groupService.update(this.ctx(req), id, dto);
  }

  @Delete('dining-groups/:id')
  removeGroup(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.groupService.remove(this.ctx(req), id);
  }

  @Get('dining-groups/:id/members')
  listGroupMembers(@Param('id', ParseIntPipe) id: number) {
    return this.groupService.listMembers(id);
  }

  @Post('dining-groups/:id/members')
  addGroupMember(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MemberAddDto,
  ) {
    return this.groupService.addMember(this.ctx(req), id, dto);
  }

  @Put('dining-groups/:id/members/:memberId')
  updateGroupMember(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body() dto: MemberUpdateDto,
  ) {
    return this.groupService.updateMember(this.ctx(req), id, memberId, dto);
  }

  @Delete('dining-groups/:id/members/:memberId')
  removeGroupMember(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
  ) {
    return this.groupService.removeMember(this.ctx(req), id, memberId);
  }
}
