import { Order } from '../../order/entities/order.entity';
import { DiningGroupMember } from '../../dining-group/entities/dining-group-member.entity';
export declare class User {
    id: number;
    openid: string;
    name: string;
    phone: string;
    nickname: string;
    avatar: string;
    email: string;
    address: string;
    createdAt: Date;
    updatedAt: Date;
    orders: Order[];
    groupMembers: DiningGroupMember[];
}
