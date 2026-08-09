import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { OrderStatus } from '../../../common/pipes/parse-order-status.pipe';

describe('OrderService', () => {
  let service: OrderService;
  let orderRepository: Repository<Order>;
  let orderItemRepository: Repository<OrderItem>;

  const mockOrder: Order = {
    id: 1,
    orderNo: 'ORD12345678',
    userId: 1,
    groupId: 1,
    status: 'pending',
    remark: '少辣',
    cookDate: '2026-08-05',
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
    user: null,
    group: null,
  };

  const mockOrderItem: OrderItem = {
    id: 1,
    orderId: 1,
    dishId: 1,
    quantity: 2,
    remark: '不要葱',
    order: mockOrder,
    dish: null,
  };

  const mockOrderRepository = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockOrderItemRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepository,
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: mockOrderItemRepository,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    orderRepository = module.get<Repository<Order>>(getRepositoryToken(Order));
    orderItemRepository = module.get<Repository<OrderItem>>(getRepositoryToken(OrderItem));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('应该创建订单', async () => {
      const createOrderDto: CreateOrderDto = {
        userId: 1,
        groupId: 1,
        remark: '少辣',
        items: [{ dishId: 1, quantity: 2, remark: '不要葱' }],
      };

      mockOrderRepository.create.mockReturnValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue(mockOrder);
      mockOrderItemRepository.create.mockReturnValue(mockOrderItem);

      const result = await service.create(createOrderDto);

      expect(orderRepository.create).toHaveBeenCalled();
      expect(orderRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('应该返回分页订单列表', async () => {
      const paginationDto: PaginationDto = { page: 1, pageSize: 10 };
      const mockOrders = [mockOrder];
      const mockTotal = 1;

      mockOrderRepository.findAndCount.mockResolvedValue([mockOrders, mockTotal]);

      const result = await service.findAll(paginationDto);

      expect(orderRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        relations: ['items', 'items.dish', 'user'],
        order: { cookDate: 'DESC', createdAt: 'DESC' },
      });
      expect(result).toEqual({
        list: mockOrders,
        total: mockTotal,
        page: 1,
        pageSize: 10,
      });
    });

    it('应该按状态筛选订单', async () => {
      const paginationDto: PaginationDto = { page: 1, pageSize: 10 };
      const status: OrderStatus = 'pending';
      const mockOrders = [mockOrder];
      const mockTotal = 1;

      mockOrderRepository.findAndCount.mockResolvedValue([mockOrders, mockTotal]);

      const result = await service.findAll(paginationDto, status);

      expect(orderRepository.findAndCount).toHaveBeenCalledWith({
        where: { status },
        skip: 0,
        take: 10,
        relations: ['items', 'items.dish', 'user'],
        order: { cookDate: 'DESC', createdAt: 'DESC' },
      });
      expect(result).toEqual({
        list: mockOrders,
        total: mockTotal,
        page: 1,
        pageSize: 10,
      });
    });
  });

  describe('findByGroupId', () => {
    it('应该返回指定组的订单列表', async () => {
      const groupId = 1;
      const paginationDto: PaginationDto = { page: 1, pageSize: 10 };
      const mockOrders = [mockOrder];
      const mockTotal = 1;

      mockOrderRepository.findAndCount.mockResolvedValue([mockOrders, mockTotal]);

      const result = await service.findByGroupId(groupId, paginationDto);

      expect(orderRepository.findAndCount).toHaveBeenCalledWith({
        where: { groupId },
        skip: 0,
        take: 10,
        relations: ['items', 'items.dish', 'user'],
        order: { cookDate: 'DESC', createdAt: 'DESC' },
      });
      expect(result).toEqual({
        list: mockOrders,
        total: mockTotal,
        page: 1,
        pageSize: 10,
      });
    });
  });

  describe('findOne', () => {
    it('应该返回指定订单详情', async () => {
      mockOrderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.findOne(1);

      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['items', 'items.dish', 'user'],
      });
      expect(result).toEqual(mockOrder);
    });

    it('订单不存在时应抛出 NotFoundException', async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        new NotFoundException('订单 ID 999 不存在'),
      );
    });
  });

  describe('update', () => {
    it('应该更新订单基本信息', async () => {
      const updateOrderDto: UpdateOrderDto = {
        remark: '更新后的备注',
      };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, ...updateOrderDto });

      const result = await service.update(1, updateOrderDto);

      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['items', 'items.dish', 'user'],
      });
      expect(orderRepository.save).toHaveBeenCalled();
      expect(result.remark).toBe(updateOrderDto.remark);
    });

    it('订单不存在时应抛出 NotFoundException', async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('应该更新订单状态', async () => {
      const status: OrderStatus = 'cooking';

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderRepository.save.mockResolvedValue({ ...mockOrder, status });

      const result = await service.updateStatus(1, status);

      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['items', 'items.dish', 'user'],
      });
      expect(orderRepository.save).toHaveBeenCalled();
      expect(result.status).toBe(status);
    });
  });

  describe('updateRating', () => {
    const completedOrder = { ...mockOrder, status: 'completed' as OrderStatus };

    it('应该为已完成订单保存评价星级', async () => {
      mockOrderRepository.findOne.mockResolvedValue(completedOrder);
      mockOrderRepository.save.mockImplementation((order) => Promise.resolve(order));

      const result = await service.updateRating(1, 1, 5);

      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['items', 'items.dish', 'user'],
      });
      expect(orderRepository.save).toHaveBeenCalled();
      expect(result.rating).toBe(5);
      expect(result.ratedAt).toBeDefined();
    });

    it('订单不存在时应抛出 NotFoundException', async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.updateRating(999, 1, 5)).rejects.toThrow(NotFoundException);
    });

    it('非已完成订单不能评价', async () => {
      mockOrderRepository.findOne.mockResolvedValue(mockOrder);

      await expect(service.updateRating(1, 1, 5)).rejects.toThrow(
        new BadRequestException('只能评价已完成的订单'),
      );
    });

    it('只能评价自己的订单', async () => {
      mockOrderRepository.findOne.mockResolvedValue(completedOrder);

      await expect(service.updateRating(1, 2, 5)).rejects.toThrow(
        new ForbiddenException('只能评价自己的订单'),
      );
    });
  });

  describe('remove', () => {
    it('应该删除订单并返回成功', async () => {
      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderRepository.remove.mockResolvedValue(mockOrder);

      const result = await service.remove(1);

      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['items', 'items.dish', 'user'],
      });
      expect(orderRepository.remove).toHaveBeenCalledWith(mockOrder);
      expect(result).toEqual({ success: true });
    });

    it('订单不存在时应抛出 NotFoundException', async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('addItem', () => {
    it('应该添加订单项', async () => {
      const createOrderItemDto = { dishId: 2, quantity: 1, remark: '少辣' };

      mockOrderRepository.findOne.mockResolvedValue(mockOrder);
      mockOrderItemRepository.create.mockReturnValue(mockOrderItem);
      mockOrderItemRepository.save.mockResolvedValue(mockOrderItem);

      const result = await service.addItem(1, createOrderItemDto);

      expect(orderRepository.findOne).toHaveBeenCalled();
      expect(orderItemRepository.create).toHaveBeenCalledWith({
        ...createOrderItemDto,
        orderId: 1,
      });
      expect(orderItemRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('updateItem', () => {
    it('应该更新订单项', async () => {
      const updateData = { quantity: 3, remark: '多放葱' };

      mockOrderItemRepository.findOne.mockResolvedValue(mockOrderItem);
      mockOrderItemRepository.save.mockResolvedValue({ ...mockOrderItem, ...updateData });

      const result = await service.updateItem(1, 1, updateData);

      expect(orderItemRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, orderId: 1 },
      });
      expect(orderItemRepository.save).toHaveBeenCalled();
      expect(result.quantity).toBe(3);
    });

    it('订单项不存在时应抛出 NotFoundException', async () => {
      mockOrderItemRepository.findOne.mockResolvedValue(null);

      await expect(service.updateItem(1, 999, {})).rejects.toThrow(
        new NotFoundException('订单项 ID 999 不存在'),
      );
    });
  });

  describe('removeItem', () => {
    it('应该删除订单项并返回成功', async () => {
      mockOrderItemRepository.findOne.mockResolvedValue(mockOrderItem);
      mockOrderItemRepository.remove.mockResolvedValue(mockOrderItem);

      const result = await service.removeItem(1, 1);

      expect(orderItemRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, orderId: 1 },
      });
      expect(orderItemRepository.remove).toHaveBeenCalledWith(mockOrderItem);
      expect(result).toEqual({ success: true });
    });

    it('订单项不存在时应抛出 NotFoundException', async () => {
      mockOrderItemRepository.findOne.mockResolvedValue(null);

      await expect(service.removeItem(1, 999)).rejects.toThrow(
        new NotFoundException('订单项 ID 999 不存在'),
      );
    });
  });
});
