import { Repository } from 'typeorm';
import { DiningGroup } from './entities/dining-group.entity';
import { DiningGroupMember } from './entities/dining-group-member.entity';
import { CreateDiningGroupDto } from './dto/create-dining-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateNicknameDto } from './dto/update-nickname.dto';
import { UserService } from '../user/user.service';
export declare class DiningGroupService {
    private readonly groupRepository;
    private readonly memberRepository;
    private readonly userService;
    constructor(groupRepository: Repository<DiningGroup>, memberRepository: Repository<DiningGroupMember>, userService: UserService);
    create(createDiningGroupDto: CreateDiningGroupDto): Promise<DiningGroup>;
    findMyGroups(userId: number): Promise<{
        myNickname: string;
        joinedAt: Date;
        id: number;
        name: string;
        creatorId: number;
        createdAt: Date;
        updatedAt: Date;
        creator: import("../user/entities/user.entity").User;
        members: DiningGroupMember[];
        orders: import("../order/entities/order.entity").Order[];
    }[]>;
    findOne(id: number): Promise<DiningGroup>;
    addMember(groupId: number, addMemberDto: AddMemberDto): Promise<DiningGroupMember>;
    updateNickname(groupId: number, updateNicknameDto: UpdateNicknameDto): Promise<DiningGroupMember>;
    removeMember(groupId: number, userId: number): Promise<{
        success: boolean;
    }>;
    leaveGroup(groupId: number, userId: number): Promise<{
        success: boolean;
    }>;
}
