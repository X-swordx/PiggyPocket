import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { OrderStatus } from '../../../common/pipes/parse-order-status.pipe';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  private generateOrderNo(): string {
    const date = new Date();
    const timestamp = date.getTime().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `ORD${timestamp}${random}`;
  }

  async create(createOrderDto: CreateOrderDto) {
    const { items, ...orderData } = createOrderDto;

    const order = this.orderRepository.create({
      ...orderData,
      orderNo: this.generateOrderNo(),
      items: items.map((item) => this.orderItemRepository.create(item)),
    });

    return await this.orderRepository.save(order);
  }

  async findAll(paginationDto: PaginationDto, status?: string) {
    const { page, pageSize } = paginationDto;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [list, total] = await this.orderRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      relations: ['items', 'items.dish', 'user'],
      order: { createdAt: 'DESC' },
    });

    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  async findByGroupId(groupId: number, paginationDto: PaginationDto) {
    const { page, pageSize } = paginationDto;
    const skip = (page - 1) * pageSize;

    const [list, total] = await this.orderRepository.findAndCount({
      where: { groupId },
      skip,
      take: pageSize,
      relations: ['items', 'items.dish', 'user'],
      order: { createdAt: 'DESC' },
    });

    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.dish', 'user'],
    });
    if (!order) {
      throw new NotFoundException(`订单 ID ${id} 不存在`);
    }
    return order;
  }

  async update(id: number, updateOrderDto: UpdateOrderDto) {
    const order = await this.findOne(id);
    Object.assign(order, updateOrderDto);
    return await this.orderRepository.save(order);
  }

  async updateStatus(id: number, status: OrderStatus) {
    const order = await this.findOne(id);
    order.status = status;
    return await this.orderRepository.save(order);
  }

  async remove(id: number) {
    const order = await this.findOne(id);
    await this.orderRepository.remove(order);
    return { success: true };
  }

  async addItem(orderId: number, createOrderItemDto: CreateOrderItemDto) {
    const order = await this.findOne(orderId);
    const item = this.orderItemRepository.create({
      ...createOrderItemDto,
      orderId,
    });
    return await this.orderItemRepository.save(item);
  }

  async updateItem(orderId: number, itemId: number, updateData: Partial<CreateOrderItemDto>) {
    const item = await this.orderItemRepository.findOne({
      where: { id: itemId, orderId },
    });
    if (!item) {
      throw new NotFoundException(`订单项 ID ${itemId} 不存在`);
    }
    Object.assign(item, updateData);
    return await this.orderItemRepository.save(item);
  }

  async removeItem(orderId: number, itemId: number) {
    const item = await this.orderItemRepository.findOne({
      where: { id: itemId, orderId },
    });
    if (!item) {
      throw new NotFoundException(`订单项 ID ${itemId} 不存在`);
    }
    await this.orderItemRepository.remove(item);
    return { success: true };
  }
}
