import { DiningGroup } from './dining-group.entity';
import { User } from '../../user/entities/user.entity';
export declare class DiningGroupMember {
    id: number;
    groupId: number;
    userId: number;
    nickname: string;
    joinedAt: Date;
    group: DiningGroup;
    user: User;
}
