import { Test, TestingModule } from '@nestjs/testing';
import { DishController } from './dish.controller';
import { DishService } from './dish.service';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Dish } from './entities/dish.entity';

describe('DishController', () => {
  let controller: DishController;
  let service: DishService;

  const userId = 1;

  const mockDish: Dish = {
    id: 1,
    name: '宫保鸡丁',
    description: '经典川菜',
    categoryId: 5,
    image: 'http://example.com/dish.jpg',
    status: 1,
    userId,
    groupId: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDishService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findCategories: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DishController],
      providers: [
        {
          provide: DishService,
          useValue: mockDishService,
        },
      ],
    }).compile();

    controller = module.get<DishController>(DishController);
    service = module.get<DishService>(DishService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('应该创建菜品', async () => {
      const createDishDto: CreateDishDto = {
        name: '宫保鸡丁',
        description: '经典川菜',
        categoryId: 5,
        status: 1,
        userId,
        groupId: 10,
      };

      mockDishService.create.mockResolvedValue(mockDish);

      const result = await controller.create(createDishDto);

      expect(service.create).toHaveBeenCalledWith(createDishDto);
      expect(result).toEqual(mockDish);
    });
  });

  describe('findAll', () => {
    it('应该返回菜品列表', async () => {
      const paginationDto: PaginationDto = { page: 1, pageSize: 10 };
      const expectedResult = {
        list: [mockDish],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      mockDishService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(paginationDto, userId);

      expect(service.findAll).toHaveBeenCalledWith(
        paginationDto,
        userId,
        undefined,
      );
      expect(result).toEqual(expectedResult);
    });

    it('应该按分类ID筛选菜品', async () => {
      const paginationDto: PaginationDto = { page: 1, pageSize: 10 };
      const expectedResult = {
        list: [mockDish],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      mockDishService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(paginationDto, userId, '5');

      expect(service.findAll).toHaveBeenCalledWith(paginationDto, userId, 5);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('应该返回单个菜品', async () => {
      mockDishService.findOne.mockResolvedValue(mockDish);

      const result = await controller.findOne(1, userId);

      expect(service.findOne).toHaveBeenCalledWith(1, userId);
      expect(result).toEqual(mockDish);
    });
  });

  describe('update', () => {
    it('应该更新菜品信息', async () => {
      const updateDishDto: UpdateDishDto = {
        name: '更新后的菜名',
      };
      const updatedDish = { ...mockDish, ...updateDishDto };

      mockDishService.update.mockResolvedValue(updatedDish);

      const result = await controller.update(1, userId, updateDishDto);

      expect(service.update).toHaveBeenCalledWith(1, userId, updateDishDto);
      expect(result).toEqual(updatedDish);
    });
  });

  describe('remove', () => {
    it('应该删除菜品', async () => {
      mockDishService.remove.mockResolvedValue({ success: true });

      const result = await controller.remove(1, userId);

      expect(service.remove).toHaveBeenCalledWith(1, userId);
      expect(result).toEqual({ success: true });
    });
  });
});
