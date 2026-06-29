import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Order } from './entities/order.entity';
import { OrderStatus } from '../../../common/pipes/parse-order-status.pipe';

describe('OrderController', () => {
  let controller: OrderController;
  let service: OrderService;

  const mockOrder: Order = {
    id: 1,
    orderNo: 'ORD12345678',
    userId: 1,
    groupId: 1,
    status: 'pending',
    remark: '少辣',
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
    user: null,
    group: null,
  };

  const mockOrderService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByGroupId: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    remove: jest.fn(),
    addItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
    service = module.get<OrderService>(OrderService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('应该创建订单', async () => {
      const createOrderDto: CreateOrderDto = {
        userId: 1,
        items: [{ dishId: 1, quantity: 2 }],
      };

      mockOrderService.create.mockResolvedValue(mockOrder);

      const result = await controller.create(createOrderDto);

      expect(service.create).toHaveBeenCalledWith(createOrderDto);
      expect(result).toEqual(mockOrder);
    });
  });

  describe('findAll', () => {
    it('应该返回订单列表', async () => {
      const paginationDto: PaginationDto = { page: 1, pageSize: 10 };
      const expectedResult = {
        list: [mockOrder],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      mockOrderService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(paginationDto);

      expect(service.findAll).toHaveBeenCalledWith(paginationDto, undefined, undefined);
      expect(result).toEqual(expectedResult);
    });

    it('应该按状态筛选订单', async () => {
      const paginationDto: PaginationDto = { page: 1, pageSize: 10 };
      const status: OrderStatus = 'pending';
      const expectedResult = {
        list: [mockOrder],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      mockOrderService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(paginationDto, status);

      expect(service.findAll).toHaveBeenCalledWith(paginationDto, status, undefined);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findByGroupId', () => {
    it('应该返回组内订单列表', async () => {
      const groupId = 1;
      const paginationDto: PaginationDto = { page: 1, pageSize: 10 };
      const expectedResult = {
        list: [mockOrder],
        total: 1,
        page: 1,
        pageSize: 10,
      };

      mockOrderService.findByGroupId.mockResolvedValue(expectedResult);

      const result = await controller.findByGroupId(groupId, paginationDto);

      expect(service.findByGroupId).toHaveBeenCalledWith(groupId, paginationDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('应该返回订单详情', async () => {
      mockOrderService.findOne.mockResolvedValue(mockOrder);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockOrder);
    });
  });

  describe('update', () => {
    it('应该更新订单基本信息', async () => {
      const updateOrderDto: UpdateOrderDto = {
        remark: '更新后的备注',
      };
      const updatedOrder = { ...mockOrder, ...updateOrderDto };

      mockOrderService.update.mockResolvedValue(updatedOrder);

      const result = await controller.update(1, updateOrderDto);

      expect(service.update).toHaveBeenCalledWith(1, updateOrderDto);
      expect(result).toEqual(updatedOrder);
    });
  });

  describe('updateStatus', () => {
    it('应该更新订单状态', async () => {
      const updateOrderStatusDto: UpdateOrderStatusDto = {
        status: 'cooking',
      };
      const updatedOrder = { ...mockOrder, status: 'cooking' };

      mockOrderService.updateStatus.mockResolvedValue(updatedOrder);

      const result = await controller.updateStatus(1, updateOrderStatusDto);

      expect(service.updateStatus).toHaveBeenCalledWith(1, 'cooking');
      expect(result).toEqual(updatedOrder);
    });
  });

  describe('remove', () => {
    it('应该删除订单', async () => {
      mockOrderService.remove.mockResolvedValue({ success: true });

      const result = await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual({ success: true });
    });
  });

  describe('addItem', () => {
    it('应该添加订单项', async () => {
      const createOrderItemDto: CreateOrderItemDto = {
        dishId: 2,
        quantity: 1,
        remark: '少辣',
      };
      const mockItem = { id: 2, ...createOrderItemDto, orderId: 1 };

      mockOrderService.addItem.mockResolvedValue(mockItem);

      const result = await controller.addItem(1, createOrderItemDto);

      expect(service.addItem).toHaveBeenCalledWith(1, createOrderItemDto);
      expect(result).toEqual(mockItem);
    });
  });

  describe('updateItem', () => {
    it('应该更新订单项', async () => {
      const updateData = { quantity: 3, remark: '多放葱' };
      const mockItem = { id: 1, orderId: 1, dishId: 1, ...updateData };

      mockOrderService.updateItem.mockResolvedValue(mockItem);

      const result = await controller.updateItem(1, 1, updateData);

      expect(service.updateItem).toHaveBeenCalledWith(1, 1, updateData);
      expect(result).toEqual(mockItem);
    });
  });

  describe('removeItem', () => {
    it('应该删除订单项', async () => {
      mockOrderService.removeItem.mockResolvedValue({ success: true });

      const result = await controller.removeItem(1, 1);

      expect(service.removeItem).toHaveBeenCalledWith(1, 1);
      expect(result).toEqual({ success: true });
    });
  });
});
