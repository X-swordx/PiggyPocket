import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';

describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;

  const mockUser: User = {
    id: 1,
    openid: 'test-openid-123',
    name: '测试用户',
    nickname: '昵称',
    avatar: 'http://example.com/avatar.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
    orders: [],
    groupMembers: [],
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('应该创建新用户', async () => {
      const createUserDto: CreateUserDto = {
        openid: 'new-openid-456',
        name: '新用户',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(createUserDto);
      mockUserRepository.save.mockResolvedValue({ ...mockUser, ...createUserDto });

      const result = await service.create(createUserDto);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { openid: createUserDto.openid } });
      expect(repository.create).toHaveBeenCalledWith(createUserDto);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('用户已存在时应返回现有用户', async () => {
      const createUserDto: CreateUserDto = {
        openid: 'test-openid-123',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { openid: createUserDto.openid } });
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });
  });

  describe('wechatLogin', () => {
    beforeEach(() => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'WECHAT_APPID') return 'appid';
        if (key === 'WECHAT_SECRET') return 'secret';
        return undefined;
      });
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ openid: 'wechat-openid', session_key: 'secret-session' }),
      } as any);
    });

    it('应该通过微信 code 登录并创建用户', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({ openid: 'wechat-openid', nickname: '微信用户' });
      mockUserRepository.save.mockResolvedValue({ ...mockUser, openid: 'wechat-openid', nickname: '微信用户' });

      const result = await service.wechatLogin({ code: 'login-code', nickname: '微信用户' });

      expect(global.fetch).toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith({
        openid: 'wechat-openid',
        nickname: '微信用户',
        avatar: undefined,
      });
      expect((result as any).session_key).toBeUndefined();
    });

    it('用户已存在且没有新资料时应返回现有用户', async () => {
      const existingUser = { ...mockUser, openid: 'wechat-openid' };
      mockUserRepository.findOne.mockResolvedValue(existingUser);

      const result = await service.wechatLogin({ code: 'login-code' });

      expect(repository.findOne).toHaveBeenCalledWith({ where: { openid: 'wechat-openid' } });
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
      expect(result).toEqual(existingUser);
    });

    it('用户已存在且传入微信资料时应更新用户', async () => {
      const existingUser = { ...mockUser, openid: 'wechat-openid', nickname: undefined, avatar: undefined } as any;
      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue({
        ...existingUser,
        nickname: '微信用户',
        avatar: 'http://example.com/wechat-avatar.jpg',
      });

      const result = await service.wechatLogin({
        code: 'login-code',
        nickname: '微信用户',
        avatar: 'http://example.com/wechat-avatar.jpg',
      });

      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledWith({
        ...existingUser,
        nickname: '微信用户',
        avatar: 'http://example.com/wechat-avatar.jpg',
      });
      expect(result.nickname).toBe('微信用户');
      expect(result.avatar).toBe('http://example.com/wechat-avatar.jpg');
    });
  });

  describe('findAll', () => {
    it('应该返回分页用户列表', async () => {
      const paginationDto: PaginationDto = { page: 1, pageSize: 10 };
      const mockUsers = [mockUser];
      const mockTotal = 1;

      mockUserRepository.findAndCount.mockResolvedValue([mockUsers, mockTotal]);

      const result = await service.findAll(paginationDto);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual({
        list: mockUsers,
        total: mockTotal,
        page: 1,
        pageSize: 10,
      });
    });

    it('第二页时应正确计算 skip', async () => {
      const paginationDto: PaginationDto = { page: 2, pageSize: 10 };

      mockUserRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(paginationDto);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('应该返回指定用户', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockUser);
    });

    it('用户不存在时应抛出 NotFoundException', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        new NotFoundException('用户 ID 999 不存在'),
      );
    });
  });

  describe('findByOpenid', () => {
    it('应该根据 openid 返回用户', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByOpenid('test-openid-123');

      expect(repository.findOne).toHaveBeenCalledWith({ where: { openid: 'test-openid-123' } });
      expect(result).toEqual(mockUser);
    });

    it('用户不存在时应返回 null', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findByOpenid('not-exist-openid');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('应该更新用户信息', async () => {
      const updateUserDto: UpdateUserDto = {
        name: '更新后的名字',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({ ...mockUser, ...updateUserDto });

      const result = await service.update(1, updateUserDto);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(repository.save).toHaveBeenCalled();
      expect(result.name).toBe(updateUserDto.name);
    });

    it('用户不存在时应抛出 NotFoundException', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('应该删除用户并返回成功', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.remove.mockResolvedValue(mockUser);

      const result = await service.remove(1);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(repository.remove).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({ success: true });
    });

    it('用户不存在时应抛出 NotFoundException', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
