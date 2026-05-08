import { Order } from './order.entity';
import { Dish } from '../../dish/entities/dish.entity';
export declare class OrderItem {
    id: number;
    orderId: number;
    dishId: number;
    quantity: number;
    remark: string;
    order: Order;
    dish: Dish;
}
