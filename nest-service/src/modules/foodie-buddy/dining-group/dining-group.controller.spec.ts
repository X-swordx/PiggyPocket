import { Test, TestingModule } from '@nestjs/testing';
import { DiningGroupController } from './dining-group.controller';
import { DiningGroupService } from './dining-group.service';
import { CreateDiningGroupDto } from './dto/create-dining-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateNicknameDto } from './dto/update-nickname.dto';
import { DiningGroup } from './entities/dining-group.entity';

describe('DiningGroupController', () => {
  let controller: DiningGroupController;
  let service: DiningGroupService;

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

  const mockMember = {
    id: 1,
    groupId: 1,
    userId: 1,
    nickname: '吃货一号',
    joinedAt: new Date(),
  };

  const mockDiningGroupService = {
    create: jest.fn(),
    findMyGroups: jest.fn(),
    findOne: jest.fn(),
    addMember: jest.fn(),
    updateNickname: jest.fn(),
    removeMember: jest.fn(),
    leaveGroup: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiningGroupController],
      providers: [
        {
          provide: DiningGroupService,
          useValue: mockDiningGroupService,
        },
      ],
    }).compile();

    controller = module.get<DiningGroupController>(DiningGroupController);
    service = module.get<DiningGroupService>(DiningGroupService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('应该创建饭搭子组', async () => {
      const createDiningGroupDto: CreateDiningGroupDto = {
        name: '吃货小分队',
        creatorId: 1,
      };

      mockDiningGroupService.create.mockResolvedValue(mockGroup);

      const result = await controller.create(createDiningGroupDto);

      expect(service.create).toHaveBeenCalledWith(createDiningGroupDto);
      expect(result).toEqual(mockGroup);
    });
  });

  describe('findMyGroups', () => {
    it('应该返回我加入的所有组', async () => {
      const userId = 1;
      const expectedResult = [
        {
          ...mockGroup,
          myNickname: '吃货一号',
          joinedAt: new Date(),
        },
      ];

      mockDiningGroupService.findMyGroups.mockResolvedValue(expectedResult);

      const result = await controller.findMyGroups(userId);

      expect(service.findMyGroups).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('应该返回组详情（含成员列表）', async () => {
      mockDiningGroupService.findOne.mockResolvedValue(mockGroup);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockGroup);
    });
  });

  describe('addMember', () => {
    it('应该通过 openid 添加成员', async () => {
      const groupId = 1;
      const addMemberDto: AddMemberDto = {
        openid: 'new-member-openid',
        nickname: '新成员',
      };

      mockDiningGroupService.addMember.mockResolvedValue(mockMember);

      const result = await controller.addMember(groupId, addMemberDto);

      expect(service.addMember).toHaveBeenCalledWith(groupId, addMemberDto);
      expect(result).toEqual(mockMember);
    });
  });

  describe('updateNickname', () => {
    it('应该修改在组里的昵称', async () => {
      const groupId = 1;
      const updateNicknameDto: UpdateNicknameDto = {
        userId: 1,
        nickname: '新昵称',
      };
      const updatedMember = { ...mockMember, ...updateNicknameDto };

      mockDiningGroupService.updateNickname.mockResolvedValue(updatedMember);

      const result = await controller.updateNickname(groupId, updateNicknameDto);

      expect(service.updateNickname).toHaveBeenCalledWith(groupId, updateNicknameDto);
      expect(result).toEqual(updatedMember);
    });
  });

  describe('removeMember', () => {
    it('应该移除成员', async () => {
      const groupId = 1;
      const userId = 1;

      mockDiningGroupService.removeMember.mockResolvedValue({ success: true });

      const result = await controller.removeMember(groupId, userId);

      expect(service.removeMember).toHaveBeenCalledWith(groupId, userId);
      expect(result).toEqual({ success: true });
    });
  });

  describe('leaveGroup', () => {
    it('应该退出组', async () => {
      const groupId = 1;
      const userId = 2;

      mockDiningGroupService.leaveGroup.mockResolvedValue({ success: true });

      const result = await controller.leaveGroup(groupId, userId);

      expect(service.leaveGroup).toHaveBeenCalledWith(groupId, userId);
      expect(result).toEqual({ success: true });
    });
  });
});
