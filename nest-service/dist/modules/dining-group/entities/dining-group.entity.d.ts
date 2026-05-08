import { DiningGroupMember } from './dining-group-member.entity';
import { User } from '../../user/entities/user.entity';
import { Order } from '../../order/entities/order.entity';
export declare class DiningGroup {
    id: number;
    name: string;
    creatorId: number;
    createdAt: Date;
    updatedAt: Date;
    creator: User;
    members: DiningGroupMember[];
    orders: Order[];
}
