import { DiningGroupService } from './dining-group.service';
import { CreateDiningGroupDto } from './dto/create-dining-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateNicknameDto } from './dto/update-nickname.dto';
export declare class DiningGroupController {
    private readonly diningGroupService;
    constructor(diningGroupService: DiningGroupService);
    create(createDiningGroupDto: CreateDiningGroupDto): Promise<import("./entities/dining-group.entity").DiningGroup>;
    findMyGroups(userId: number): Promise<{
        myNickname: string;
        joinedAt: Date;
        id: number;
        name: string;
        creatorId: number;
        createdAt: Date;
        updatedAt: Date;
        creator: import("../user/entities/user.entity").User;
        members: import("./entities/dining-group-member.entity").DiningGroupMember[];
        orders: import("../order/entities/order.entity").Order[];
    }[]>;
    findOne(id: number): Promise<import("./entities/dining-group.entity").DiningGroup>;
    addMember(groupId: number, addMemberDto: AddMemberDto): Promise<import("./entities/dining-group-member.entity").DiningGroupMember>;
    updateNickname(groupId: number, updateNicknameDto: UpdateNicknameDto): Promise<import("./entities/dining-group-member.entity").DiningGroupMember>;
    removeMember(groupId: number, userId: number): Promise<{
        success: boolean;
    }>;
    leaveGroup(groupId: number, userId: number): Promise<{
        success: boolean;
    }>;
}
