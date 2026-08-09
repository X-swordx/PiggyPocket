import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DishService } from './dish.service';
import { Dish } from './entities/dish.entity';
import { DishCategory } from './entities/dish-category.entity';
import { DiningGroupMember } from '../dining-group/entities/dining-group-member.entity';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';

describe('DishService', () => {
  let service: DishService;
  let repository: Repository<Dish>;
  let memberRepository: Repository<DiningGroupMember>;

  const userId = 1;
  const groupId = 10;
  const categoryId = 5;

  const mockDish: Dish = {
    id: 1,
    name: '宫保鸡丁',
    description: '经典川菜',
    categoryId,
    image: 'http://example.com/dish.jpg',
    status: 1,
    userId,
    groupId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDishRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockCategoryRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockMemberRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DishService,
        {
          provide: getRepositoryToken(Dish),
          useValue: mockDishRepository,
        },
        {
          provide: getRepositoryToken(DishCategory),
          useValue: mockCategoryRepository,
        },
        {
          provide: getRepositoryToken(DiningGroupMember),
          useValue: mockMemberRepository,
        },
      ],
    }).compile();

    service = module.get<DishService>(DishService);
    repository = module.get<Repository<Dish>>(getRepositoryToken(Dish));
    memberRepository = module.get<Repository<DiningGroupMember>>(
      getRepositoryToken(DiningGroupMember),
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('应该创建菜品', async () => {
      const createDishDto: CreateDishDto = {
        name: '宫保鸡丁',
        description: '经典川菜',
        categoryId,
        status: 1,
        userId,
        groupId,
      };

      mockMemberRepository.findOne.mockResolvedValue({ userId, groupId });
      mockCategoryRepository.findOne.mockResolvedValue({
        id: categoryId,
        name: '肉类',
        enabled: 1,
      });
      mockDishRepository.create.mockReturnValue(createDishDto);
      mockDishRepository.save.mockResolvedValue({
        ...mockDish,
        ...createDishDto,
      });

      const result = await service.create(createDishDto);

      expect(memberRepository.findOne).toHaveBeenCalledWith({
        where: { userId, groupId },
      });
      expect(repository.create).toHaveBeenCalledWith(createDishDto);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('非组成员创建菜品时应抛出 ForbiddenException', async () => {
      const createDishDto: CreateDishDto = {
        name: '宫保鸡丁',
        categoryId,
        userId,
        groupId,
      };

      mockMemberRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDishDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('分类已停用时应抛出 BadRequestException', async () => {
      const createDishDto: CreateDishDto = {
        name: '宫保鸡丁',
        categoryId,
        userId,
        groupId,
      };

      mockMemberRepository.findOne.mockResolvedValue({ userId, groupId });
      mockCategoryRepository.findOne.mockResolvedValue({
        id: categoryId,
        name: '肉类',
        enabled: 0,
      });

      await expect(service.create(createDishDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('分类不存在时应抛出 BadRequestException', async () => {
      const createDishDto: CreateDishDto = {
        name: '宫保鸡丁',
        categoryId: 999,
        userId,
        groupId,
      };

      mockMemberRepository.findOne.mockResolvedValue({ userId, groupId });
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDishDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('应该返回用户所在组的菜品列表', async () => {
      const paginationDto: PaginationDto = { page: 1, pageSize: 10 };
      const mockDishes = [mockDish];
      const mockTotal = 1;

      mockMemberRepository.find.mockResolvedValue([
        { groupId },
        { groupId: 20 },
      ]);
      mockDishRepository.findAndCount.mockResolvedValue([mockDishes, mockTotal]);

      const result = await service.findAll(paginationDto, userId);

      expect(memberRepository.find).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { groupId: expect.anything() },
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual({
        list: mockDishes,
        total: mockTotal,
        page: 1,
        pageSize: 10,
      });
    });

    it('应该按分类ID筛选菜品', async () => {
      const paginationDto: PaginationDto = { page: 1, pageSize: 10 };

      mockMemberRepository.find.mockResolvedValue([{ groupId }]);
      mockDishRepository.findAndCount.mockResolvedValue([[mockDish], 1]);

      const result = await service.findAll(paginationDto, userId, categoryId);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { groupId: expect.anything(), categoryId },
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
      expect(result.list).toHaveLength(1);
    });

    it('用户无饭搭子组时应返回空列表', async () => {
      const paginationDto: PaginationDto = { page: 1, pageSize: 10 };

      mockMemberRepository.find.mockResolvedValue([]);

      const result = await service.findAll(paginationDto, userId);

      expect(repository.findAndCount).not.toHaveBeenCalled();
      expect(result).toEqual({
        list: [],
        total: 0,
        page: 1,
        pageSize: 10,
      });
    });
  });

  describe('findOne', () => {
    it('应该返回指定菜品', async () => {
      mockDishRepository.findOne.mockResolvedValue(mockDish);
      mockMemberRepository.findOne.mockResolvedValue({ userId, groupId });

      const result = await service.findOne(1, userId);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(memberRepository.findOne).toHaveBeenCalledWith({
        where: { userId, groupId },
      });
      expect(result).toEqual(mockDish);
    });

    it('菜品不存在时应抛出 NotFoundException', async () => {
      mockDishRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, userId)).rejects.toThrow(
        new NotFoundException('菜品 ID 999 不存在'),
      );
    });

    it('非组成员查看时应抛出 ForbiddenException', async () => {
      mockDishRepository.findOne.mockResolvedValue(mockDish);
      mockMemberRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(1, 999)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('应该更新菜品信息', async () => {
      const updateDishDto: UpdateDishDto = {
        name: '更新后的菜名',
        description: '更新后的描述',
      };

      mockDishRepository.findOne.mockResolvedValue(mockDish);
      mockMemberRepository.findOne.mockResolvedValue({ userId, groupId });
      mockDishRepository.save.mockResolvedValue({
        ...mockDish,
        ...updateDishDto,
      });

      const result = await service.update(1, userId, updateDishDto);

      expect(repository.save).toHaveBeenCalled();
      expect(result.name).toBe(updateDishDto.name);
      expect(result.description).toBe(updateDishDto.description);
    });

    it('禁止修改菜品所属饭搭子组', async () => {
      mockDishRepository.findOne.mockResolvedValue(mockDish);
      mockMemberRepository.findOne.mockResolvedValue({ userId, groupId });

      await expect(
        service.update(1, userId, { groupId: 99 } as UpdateDishDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('非组成员更新时应抛出 ForbiddenException', async () => {
      mockDishRepository.findOne.mockResolvedValue(mockDish);
      mockMemberRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(1, 999, { name: '新名字' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('应该删除菜品并返回成功', async () => {
      mockDishRepository.findOne.mockResolvedValue(mockDish);
      mockMemberRepository.findOne.mockResolvedValue({ userId, groupId });
      mockDishRepository.remove.mockResolvedValue(mockDish);

      const result = await service.remove(1, userId);

      expect(repository.remove).toHaveBeenCalledWith(mockDish);
      expect(result).toEqual({ success: true });
    });

    it('非组成员删除时应抛出 ForbiddenException', async () => {
      mockDishRepository.findOne.mockResolvedValue(mockDish);
      mockMemberRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(1, 999)).rejects.toThrow(ForbiddenException);
    });
  });
});
