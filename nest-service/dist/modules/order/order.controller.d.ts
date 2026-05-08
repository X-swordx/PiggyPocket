import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { OrderStatus } from '../../common/pipes/parse-order-status.pipe';
export declare class OrderController {
    private readonly orderService;
    constructor(orderService: OrderService);
    create(createOrderDto: CreateOrderDto): Promise<import("./entities/order.entity").Order>;
    findAll(paginationDto: PaginationDto, status?: OrderStatus): Promise<{
        list: import("./entities/order.entity").Order[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findByGroupId(groupId: number, paginationDto: PaginationDto): Promise<{
        list: import("./entities/order.entity").Order[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: number): Promise<import("./entities/order.entity").Order>;
    update(id: number, updateOrderDto: UpdateOrderDto): Promise<import("./entities/order.entity").Order>;
    updateStatus(id: number, updateOrderStatusDto: UpdateOrderStatusDto): Promise<import("./entities/order.entity").Order>;
    remove(id: number): Promise<{
        success: boolean;
    }>;
    addItem(orderId: number, createOrderItemDto: CreateOrderItemDto): Promise<import("./entities/order-item.entity").OrderItem>;
    updateItem(orderId: number, itemId: number, updateData: Partial<CreateOrderItemDto>): Promise<import("./entities/order-item.entity").OrderItem>;
    removeItem(orderId: number, itemId: number): Promise<{
        success: boolean;
    }>;
}
