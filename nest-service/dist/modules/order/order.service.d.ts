import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { OrderStatus } from '../../common/pipes/parse-order-status.pipe';
export declare class OrderService {
    private readonly orderRepository;
    private readonly orderItemRepository;
    constructor(orderRepository: Repository<Order>, orderItemRepository: Repository<OrderItem>);
    private generateOrderNo;
    create(createOrderDto: CreateOrderDto): Promise<Order>;
    findAll(paginationDto: PaginationDto, status?: string): Promise<{
        list: Order[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findByGroupId(groupId: number, paginationDto: PaginationDto): Promise<{
        list: Order[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: number): Promise<Order>;
    update(id: number, updateOrderDto: UpdateOrderDto): Promise<Order>;
    updateStatus(id: number, status: OrderStatus): Promise<Order>;
    remove(id: number): Promise<{
        success: boolean;
    }>;
    addItem(orderId: number, createOrderItemDto: CreateOrderItemDto): Promise<OrderItem>;
    updateItem(orderId: number, itemId: number, updateData: Partial<CreateOrderItemDto>): Promise<OrderItem>;
    removeItem(orderId: number, itemId: number): Promise<{
        success: boolean;
    }>;
}
