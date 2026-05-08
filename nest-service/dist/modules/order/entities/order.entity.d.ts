import { User } from '../../user/entities/user.entity';
import { DiningGroup } from '../../dining-group/entities/dining-group.entity';
import { OrderItem } from './order-item.entity';
export declare class Order {
    id: number;
    orderNo: string;
    userId: number;
    groupId: number;
    tableNo: string;
    status: string;
    remark: string;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    group: DiningGroup;
    items: OrderItem[];
}
