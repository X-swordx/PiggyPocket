import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ParseOrderStatusPipe, OrderStatus } from '../../../common/pipes/parse-order-status.pipe';

@ApiTags('订单管理')
@Controller('foodie-buddy/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: '创建订单' })
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: '获取订单列表' })
  @ApiQuery({ name: 'status', required: false, description: '按状态筛选' })
  @ApiQuery({ name: 'userId', required: false, description: '按用户筛选' })
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('status', new ParseOrderStatusPipe()) status?: OrderStatus,
    @Query('userId') userId?: string,
  ) {
    return this.orderService.findAll(paginationDto, status, userId ? Number(userId) : undefined);
  }

  @Get('group/:groupId')
  @ApiOperation({ summary: '获取组内所有订单' })
  findByGroupId(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.orderService.findByGroupId(groupId, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取订单详情' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新订单基本信息' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.orderService.update(id, updateOrderDto);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新订单状态' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(id, updateOrderStatusDto.status as OrderStatus);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除订单' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.remove(id);
  }

  @Post(':id/items')
  @ApiOperation({ summary: '添加订单项' })
  addItem(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() createOrderItemDto: CreateOrderItemDto,
  ) {
    return this.orderService.addItem(orderId, createOrderItemDto);
  }

  @Put(':id/items/:itemId')
  @ApiOperation({ summary: '更新订单项' })
  updateItem(
    @Param('id', ParseIntPipe) orderId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() updateData: Partial<CreateOrderItemDto>,
  ) {
    return this.orderService.updateItem(orderId, itemId, updateData);
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: '删除订单项' })
  removeItem(
    @Param('id', ParseIntPipe) orderId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.orderService.removeItem(orderId, itemId);
  }
}
