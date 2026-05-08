import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DiningGroupService } from './dining-group.service';
import { DiningGroup } from './entities/dining-group.entity';
import { DiningGroupMember } from './entities/dining-group-member.entity';
import { UserService } from '../user/user.service';
import { CreateDiningGroupDto } from './dto/create-dining-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateNicknameDto } from './dto/update-nickname.dto';

describe('DiningGroupService', () => {
  let service: DiningGroupService;
  let groupRepository: Repository<DiningGroup>;
  let memberRepository: Repository<DiningGroupMember>;
  let userService: UserService;

  const mockGroup: DiningGroup = {
    id: 1,
    name: '吃货小分队',
    creatorId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    creator: null,
    members: [],
    orders: [],
  };

  const mockMember: DiningGroupMember = {
    id: 1,
    groupId: 1,
    userId: 1,
    nickname: '吃货一号',
    joinedAt: new Date(),
    group: mockGroup,
    user: null,
  };

  const mockUser = {
    id: 1,
    openid: 'test-openid-123',
    name: '测试用户',
    nickname: '昵称',
  };

  const mockGroupRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockMemberRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockUserService = {
    findOne: jest.fn(),
    findByOpenid: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiningGroupService,
        {
          provide: getRepositoryToken(DiningGroup),
          useValue: mockGroupRepository,
        },
        {
          provide: getRepositoryToken(DiningGroupMember),
          useValue: mockMemberRepository,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<DiningGroupService>(DiningGroupService);
    groupRepository = module.get<Repository<DiningGroup>>(getRepositoryToken(DiningGroup));
    memberRepository = module.get<Repository<DiningGroupMember>>(getRepositoryToken(DiningGroupMember));
    userService = module.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('应该创建饭搭子组', async () => {
      const createDiningGroupDto: CreateDiningGroupDto = {
        name: '吃货小分队',
        creatorId: 1,
      };

      mockUserService.findOne.mockResolvedValue(mockUser);
      mockGroupRepository.create.mockReturnValue(mockGroup);
      mockGroupRepository.save.mockResolvedValue(mockGroup);
      mockMemberRepository.create.mockReturnValue(mockMember);
      mockMemberRepository.save.mockResolvedValue(mockMember);

      const result = await service.create(createDiningGroupDto);

      expect(userService.findOne).toHaveBeenCalledWith(1);
      expect(groupRepository.create).toHaveBeenCalledWith({
        name: createDiningGroupDto.name,
        creatorId: createDiningGroupDto.creatorId,
      });
      expect(groupRepository.save).toHaveBeenCalled();
      expect(memberRepository.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('创建者不存在时应抛出 NotFoundException', async () => {
      const createDiningGroupDto: CreateDiningGroupDto = {
        name: '吃货小分队',
        creatorId: 999,
      };

      mockUserService.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.create(createDiningGroupDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMyGroups', () => {
    it('应该返回用户加入的所有组', async () => {
      const userId = 1;
      const mockMembers = [{ ...mockMember, group: mockGroup }];

      mockMemberRepository.find.mockResolvedValue(mockMembers);

      const result = await service.findMyGroups(userId);

      expect(memberRepository.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['group', 'group.creator'],
      });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findOne', () => {
    it('应该返回组详情（含成员列表）', async () => {
      mockGroupRepository.findOne.mockResolvedValue(mockGroup);

      const result = await service.findOne(1);

      expect(groupRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['members', 'members.user'],
      });
      expect(result).toEqual(mockGroup);
    });

    it('组不存在时应抛出 NotFoundException', async () => {
      mockGroupRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        new NotFoundException('组 ID 999 不存在'),
      );
    });
  });

  describe('addMember', () => {
    const groupId = 1;
    const addMemberDto: AddMemberDto = {
      openid: 'new-member-openid',
      nickname: '新成员',
    };

    it('应该添加成员（用户已存在）', async () => {
      mockGroupRepository.findOne.mockResolvedValue(mockGroup);
      mockUserService.findByOpenid.mockResolvedValue(mockUser);
      mockMemberRepository.findOne.mockResolvedValue(null);
      mockMemberRepository.create.mockReturnValue(mockMember);
      mockMemberRepository.save.mockResolvedValue(mockMember);

      const result = await service.addMember(groupId, addMemberDto);

      expect(groupRepository.findOne).toHaveBeenCalled();
      expect(userService.findByOpenid).toHaveBeenCalledWith(addMemberDto.openid);
      expect(memberRepository.findOne).toHaveBeenCalledWith({
        where: { groupId, userId: mockUser.id },
      });
      expect(memberRepository.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('应该添加成员（用户不存在时自动创建）', async () => {
      mockGroupRepository.findOne.mockResolvedValue(mockGroup);
      mockUserService.findByOpenid.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue({ id: 2, openid: addMemberDto.openid });
      mockMemberRepository.findOne.mockResolvedValue(null);
      mockMemberRepository.create.mockReturnValue(mockMember);
      mockMemberRepository.save.mockResolvedValue(mockMember);

      const result = await service.addMember(groupId, addMemberDto);

      expect(userService.create).toHaveBeenCalledWith({ openid: addMemberDto.openid });
      expect(result).toBeDefined();
    });

    it('用户已在组内时应抛出 BadRequestException', async () => {
      mockGroupRepository.findOne.mockResolvedValue(mockGroup);
      mockUserService.findByOpenid.mockResolvedValue(mockUser);
      mockMemberRepository.findOne.mockResolvedValue(mockMember);

      await expect(service.addMember(groupId, addMemberDto)).rejects.toThrow(
        new BadRequestException('该用户已在组内'),
      );
    });

    it('组不存在时应抛出 NotFoundException', async () => {
      mockGroupRepository.findOne.mockResolvedValue(null);

      await expect(service.addMember(999, addMemberDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateNickname', () => {
    it('应该修改在组里的昵称', async () => {
      const groupId = 1;
      const updateNicknameDto: UpdateNicknameDto = {
        userId: 1,
        nickname: '新昵称',
      };
      const updatedMember = { ...mockMember, nickname: updateNicknameDto.nickname };

      mockMemberRepository.findOne.mockResolvedValue(mockMember);
      mockMemberRepository.save.mockResolvedValue(updatedMember);

      const result = await service.updateNickname(groupId, updateNicknameDto);

      expect(memberRepository.findOne).toHaveBeenCalledWith({
        where: { groupId, userId: updateNicknameDto.userId },
      });
      expect(memberRepository.save).toHaveBeenCalled();
      expect(result.nickname).toBe(updateNicknameDto.nickname);
    });

    it('用户不在组内时应抛出 NotFoundException', async () => {
      const groupId = 1;
      const updateNicknameDto: UpdateNicknameDto = {
        userId: 999,
        nickname: '新昵称',
      };

      mockMemberRepository.findOne.mockResolvedValue(null);

      await expect(service.updateNickname(groupId, updateNicknameDto)).rejects.toThrow(
        new NotFoundException('该用户不在此组内'),
      );
    });
  });

  describe('removeMember', () => {
    it('应该移除成员', async () => {
      const groupId = 1;
      const userId = 1;

      mockMemberRepository.findOne.mockResolvedValue(mockMember);
      mockMemberRepository.remove.mockResolvedValue(mockMember);

      const result = await service.removeMember(groupId, userId);

      expect(memberRepository.findOne).toHaveBeenCalledWith({
        where: { groupId, userId },
      });
      expect(memberRepository.remove).toHaveBeenCalledWith(mockMember);
      expect(result).toEqual({ success: true });
    });

    it('用户不在组内时应抛出 NotFoundException', async () => {
      mockMemberRepository.findOne.mockResolvedValue(null);

      await expect(service.removeMember(1, 999)).rejects.toThrow(
        new NotFoundException('该用户不在此组内'),
      );
    });
  });

  describe('leaveGroup', () => {
    it('用户应该可以退出组', async () => {
      const groupId = 1;
      const userId = 2;

      mockGroupRepository.findOne.mockResolvedValue({ ...mockGroup, creatorId: 1 });
      mockMemberRepository.findOne.mockResolvedValue(mockMember);
      mockMemberRepository.remove.mockResolvedValue(mockMember);

      const result = await service.leaveGroup(groupId, userId);

      expect(groupRepository.findOne).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('创建者不能退出组', async () => {
      const groupId = 1;
      const userId = 1;

      mockGroupRepository.findOne.mockResolvedValue(mockGroup);

      await expect(service.leaveGroup(groupId, userId)).rejects.toThrow(
        new BadRequestException('创建者不能退出组，请先删除组或转让'),
      );
    });
  });
});
