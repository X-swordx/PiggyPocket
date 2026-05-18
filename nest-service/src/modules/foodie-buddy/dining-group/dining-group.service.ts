import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiningGroup } from './entities/dining-group.entity';
import { DiningGroupMember } from './entities/dining-group-member.entity';
import { CreateDiningGroupDto } from './dto/create-dining-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateNicknameDto } from './dto/update-nickname.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class DiningGroupService {
  constructor(
    @InjectRepository(DiningGroup)
    private readonly groupRepository: Repository<DiningGroup>,
    @InjectRepository(DiningGroupMember)
    private readonly memberRepository: Repository<DiningGroupMember>,
    private readonly userService: UserService,
  ) {}

  async create(createDiningGroupDto: CreateDiningGroupDto) {
    const { name, creatorId } = createDiningGroupDto;

    // 验证用户存在
    const creator = await this.userService.findOne(creatorId);

    // 创建组
    const group = this.groupRepository.create({
      name,
      creatorId,
    });
    const savedGroup = await this.groupRepository.save(group);

    // 创建者自动加入组
    const member = this.memberRepository.create({
      groupId: savedGroup.id,
      userId: creatorId,
      nickname: creator.nickname || creator.name,
    });
    await this.memberRepository.save(member);

    return savedGroup;
  }

  async findMyGroups(userId: number) {
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

  async findOne(id: number) {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: ['members', 'members.user'],
    });
    if (!group) {
      throw new NotFoundException(`组 ID ${id} 不存在`);
    }
    return group;
  }

  async addMember(groupId: number, addMemberDto: AddMemberDto) {
    const { openid, nickname } = addMemberDto;

    // 检查组是否存在
    const group = await this.findOne(groupId);

    // 根据 openid 查找用户
    let user = await this.userService.findByOpenid(openid);
    if (!user) {
      // 用户不存在，自动创建
      user = await this.userService.create({ openid });
    }

    // 检查是否已在组内
    const existing = await this.memberRepository.findOne({
      where: { groupId, userId: user.id },
    });
    if (existing) {
      throw new BadRequestException('该用户已在组内');
    }

    // 添加成员
    const member = this.memberRepository.create({
      groupId,
      userId: user.id,
      nickname: nickname || user.nickname || user.name,
    });

    return await this.memberRepository.save(member);
  }

  async updateNickname(groupId: number, updateNicknameDto: UpdateNicknameDto) {
    const { userId, nickname } = updateNicknameDto;

    const member = await this.memberRepository.findOne({
      where: { groupId, userId },
    });
    if (!member) {
      throw new NotFoundException('该用户不在此组内');
    }

    member.nickname = nickname;
    return await this.memberRepository.save(member);
  }

  async removeMember(groupId: number, userId: number) {
    const member = await this.memberRepository.findOne({
      where: { groupId, userId },
    });
    if (!member) {
      throw new NotFoundException('该用户不在此组内');
    }

    await this.memberRepository.remove(member);
    return { success: true };
  }

  async leaveGroup(groupId: number, userId: number) {
    // 检查是否是创建者
    const group = await this.findOne(groupId);
    if (group.creatorId === userId) {
      throw new BadRequestException('创建者不能退出组，请先删除组或转让');
    }

    return await this.removeMember(groupId, userId);
  }
}
