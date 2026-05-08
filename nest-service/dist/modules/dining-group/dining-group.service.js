"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiningGroupService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const dining_group_entity_1 = require("./entities/dining-group.entity");
const dining_group_member_entity_1 = require("./entities/dining-group-member.entity");
const user_service_1 = require("../user/user.service");
let DiningGroupService = class DiningGroupService {
    constructor(groupRepository, memberRepository, userService) {
        this.groupRepository = groupRepository;
        this.memberRepository = memberRepository;
        this.userService = userService;
    }
    async create(createDiningGroupDto) {
        const { name, creatorId } = createDiningGroupDto;
        const creator = await this.userService.findOne(creatorId);
        const group = this.groupRepository.create({
            name,
            creatorId,
        });
        const savedGroup = await this.groupRepository.save(group);
        const member = this.memberRepository.create({
            groupId: savedGroup.id,
            userId: creatorId,
            nickname: creator.nickname || creator.name,
        });
        await this.memberRepository.save(member);
        return savedGroup;
    }
    async findMyGroups(userId) {
        const members = await this.memberRepository.find({
            where: { userId },
            relations: ['group', 'group.creator'],
        });
        const groups = members.map((m) => ({
            ...m.group,
            myNickname: m.nickname,
            joinedAt: m.joinedAt,
        }));
        return groups;
    }
    async findOne(id) {
        const group = await this.groupRepository.findOne({
            where: { id },
            relations: ['members', 'members.user'],
        });
        if (!group) {
            throw new common_1.NotFoundException(`组 ID ${id} 不存在`);
        }
        return group;
    }
    async addMember(groupId, addMemberDto) {
        const { openid, nickname } = addMemberDto;
        const group = await this.findOne(groupId);
        let user = await this.userService.findByOpenid(openid);
        if (!user) {
            user = await this.userService.create({ openid });
        }
        const existing = await this.memberRepository.findOne({
            where: { groupId, userId: user.id },
        });
        if (existing) {
            throw new common_1.BadRequestException('该用户已在组内');
        }
        const member = this.memberRepository.create({
            groupId,
            userId: user.id,
            nickname: nickname || user.nickname || user.name,
        });
        return await this.memberRepository.save(member);
    }
    async updateNickname(groupId, updateNicknameDto) {
        const { userId, nickname } = updateNicknameDto;
        const member = await this.memberRepository.findOne({
            where: { groupId, userId },
        });
        if (!member) {
            throw new common_1.NotFoundException('该用户不在此组内');
        }
        member.nickname = nickname;
        return await this.memberRepository.save(member);
    }
    async removeMember(groupId, userId) {
        const member = await this.memberRepository.findOne({
            where: { groupId, userId },
        });
        if (!member) {
            throw new common_1.NotFoundException('该用户不在此组内');
        }
        await this.memberRepository.remove(member);
        return { success: true };
    }
    async leaveGroup(groupId, userId) {
        const group = await this.findOne(groupId);
        if (group.creatorId === userId) {
            throw new common_1.BadRequestException('创建者不能退出组，请先删除组或转让');
        }
        return await this.removeMember(groupId, userId);
    }
};
exports.DiningGroupService = DiningGroupService;
exports.DiningGroupService = DiningGroupService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(dining_group_entity_1.DiningGroup)),
    __param(1, (0, typeorm_1.InjectRepository)(dining_group_member_entity_1.DiningGroupMember)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        user_service_1.UserService])
], DiningGroupService);
//# sourceMappingURL=dining-group.service.js.map