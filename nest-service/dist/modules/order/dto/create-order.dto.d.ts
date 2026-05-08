import { CreateOrderItemDto } from './create-order-item.dto';
export declare class CreateOrderDto {
    userId: number;
    groupId?: number;
    tableNo?: string;
    remark?: string;
    items: CreateOrderItemDto[];
}
