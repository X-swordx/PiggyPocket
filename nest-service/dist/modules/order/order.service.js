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
exports.OrderService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("./entities/order.entity");
const order_item_entity_1 = require("./entities/order-item.entity");
let OrderService = class OrderService {
    constructor(orderRepository, orderItemRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
    }
    generateOrderNo() {
        const date = new Date();
        const timestamp = date.getTime().toString().slice(-8);
        const random = Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, '0');
        return `ORD${timestamp}${random}`;
    }
    async create(createOrderDto) {
        const { items, ...orderData } = createOrderDto;
        const order = this.orderRepository.create({
            ...orderData,
            orderNo: this.generateOrderNo(),
            items: items.map((item) => this.orderItemRepository.create(item)),
        });
        return await this.orderRepository.save(order);
    }
    async findAll(paginationDto, status) {
        const { page, pageSize } = paginationDto;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (status) {
            where.status = status;
        }
        const [list, total] = await this.orderRepository.findAndCount({
            where,
            skip,
            take: pageSize,
            relations: ['items', 'items.dish', 'user'],
            order: { createdAt: 'DESC' },
        });
        return {
            list,
            total,
            page,
            pageSize,
        };
    }
    async findByGroupId(groupId, paginationDto) {
        const { page, pageSize } = paginationDto;
        const skip = (page - 1) * pageSize;
        const [list, total] = await this.orderRepository.findAndCount({
            where: { groupId },
            skip,
            take: pageSize,
            relations: ['items', 'items.dish', 'user'],
            order: { createdAt: 'DESC' },
        });
        return {
            list,
            total,
            page,
            pageSize,
        };
    }
    async findOne(id) {
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: ['items', 'items.dish', 'user'],
        });
        if (!order) {
            throw new common_1.NotFoundException(`订单 ID ${id} 不存在`);
        }
        return order;
    }
    async update(id, updateOrderDto) {
        const order = await this.findOne(id);
        Object.assign(order, updateOrderDto);
        return await this.orderRepository.save(order);
    }
    async updateStatus(id, status) {
        const order = await this.findOne(id);
        order.status = status;
        return await this.orderRepository.save(order);
    }
    async remove(id) {
        const order = await this.findOne(id);
        await this.orderRepository.remove(order);
        return { success: true };
    }
    async addItem(orderId, createOrderItemDto) {
        const order = await this.findOne(orderId);
        const item = this.orderItemRepository.create({
            ...createOrderItemDto,
            orderId,
        });
        return await this.orderItemRepository.save(item);
    }
    async updateItem(orderId, itemId, updateData) {
        const item = await this.orderItemRepository.findOne({
            where: { id: itemId, orderId },
        });
        if (!item) {
            throw new common_1.NotFoundException(`订单项 ID ${itemId} 不存在`);
        }
        Object.assign(item, updateData);
        return await this.orderItemRepository.save(item);
    }
    async removeItem(orderId, itemId) {
        const item = await this.orderItemRepository.findOne({
            where: { id: itemId, orderId },
        });
        if (!item) {
            throw new common_1.NotFoundException(`订单项 ID ${itemId} 不存在`);
        }
        await this.orderItemRepository.remove(item);
        return { success: true };
    }
};
exports.OrderService = OrderService;
exports.OrderService = OrderService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(order_item_entity_1.OrderItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], OrderService);
//# sourceMappingURL=order.service.js.map