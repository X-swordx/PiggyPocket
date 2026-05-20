import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DishService } from './dish.service';
import { Dish } from './entities/dish.entity';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';

describe('DishService', () => {
  let service: DishService;
  let repository: Repository<Dish>;

  const mockDish: Dish = {
    id: 1,
    name: '宫保鸡丁',
    description: '经典川菜',
    category: '热菜',
    image: 'http://example.com/dish.jpg',
    status: 1,
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DishService,
        {
          provide: getRepositoryToken(Dish),
          useValue: mockDishRepository,
        },
      ],
    }).compile();

    service = module.get<DishService>(DishService);
    repository = module.get<Repository<Dish>>(getRepositoryToken(Dish));

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
        category: '热菜',
        status: 1,
      };

      mockDishRepository.create.mockReturnValue(createDishDto);
      mockDishRepository.save.mockResolvedValue({ ...mockDish, ...createDishDto });

      const result = await service.create(createDishDto);

      expect(repository.create).toHaveBeenCalledWith(createDishDto);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('应该返回分页菜品列表', async () => {
      const paginationDto: PaginationDto = { page: 1, pageSize: 10 };
      const mockDishes = [mockDish];
      const mockTotal = 1;

      mockDishRepository.findAndCount.mockResolvedValue([mockDishes, mockTotal]);

      const result = await service.findAll(paginationDto);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: {},
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

    it('应该按分类筛选菜品', async () => {
      const paginationDto: PaginationDto = { page: 1, pageSize: 10 };
      const category = '热菜';
      const mockDishes = [mockDish];
      const mockTotal = 1;

      mockDishRepository.findAndCount.mockResolvedValue([mockDishes, mockTotal]);

      const result = await service.findAll(paginationDto, category);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { category },
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
  });

  describe('findOne', () => {
    it('应该返回指定菜品', async () => {
      mockDishRepository.findOne.mockResolvedValue(mockDish);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockDish);
    });

    it('菜品不存在时应抛出 NotFoundException', async () => {
      mockDishRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        new NotFoundException('菜品 ID 999 不存在'),
      );
    });
  });

  describe('update', () => {
    it('应该更新菜品信息', async () => {
      const updateDishDto: UpdateDishDto = {
        name: '更新后的菜名',
        description: '更新后的描述',
      };

      mockDishRepository.findOne.mockResolvedValue(mockDish);
      mockDishRepository.save.mockResolvedValue({ ...mockDish, ...updateDishDto });

      const result = await service.update(1, updateDishDto);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(repository.save).toHaveBeenCalled();
      expect(result.name).toBe(updateDishDto.name);
      expect(result.description).toBe(updateDishDto.description);
    });

    it('菜品不存在时应抛出 NotFoundException', async () => {
      mockDishRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('应该删除菜品并返回成功', async () => {
      mockDishRepository.findOne.mockResolvedValue(mockDish);
      mockDishRepository.remove.mockResolvedValue(mockDish);

      const result = await service.remove(1);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(repository.remove).toHaveBeenCalledWith(mockDish);
      expect(result).toEqual({ success: true });
    });

    it('菜品不存在时应抛出 NotFoundException', async () => {
      mockDishRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
