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
exports.OrderController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const order_service_1 = require("./order.service");
const create_order_dto_1 = require("./dto/create-order.dto");
const update_order_dto_1 = require("./dto/update-order.dto");
const update_order_status_dto_1 = require("./dto/update-order-status.dto");
const create_order_item_dto_1 = require("./dto/create-order-item.dto");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const parse_order_status_pipe_1 = require("../../common/pipes/parse-order-status.pipe");
let OrderController = class OrderController {
    constructor(orderService) {
        this.orderService = orderService;
    }
    create(createOrderDto) {
        return this.orderService.create(createOrderDto);
    }
    findAll(paginationDto, status) {
        return this.orderService.findAll(paginationDto, status);
    }
    findByGroupId(groupId, paginationDto) {
        return this.orderService.findByGroupId(groupId, paginationDto);
    }
    findOne(id) {
        return this.orderService.findOne(id);
    }
    update(id, updateOrderDto) {
        return this.orderService.update(id, updateOrderDto);
    }
    updateStatus(id, updateOrderStatusDto) {
        return this.orderService.updateStatus(id, updateOrderStatusDto.status);
    }
    remove(id) {
        return this.orderService.remove(id);
    }
    addItem(orderId, createOrderItemDto) {
        return this.orderService.addItem(orderId, createOrderItemDto);
    }
    updateItem(orderId, itemId, updateData) {
        return this.orderService.updateItem(orderId, itemId, updateData);
    }
    removeItem(orderId, itemId) {
        return this.orderService.removeItem(orderId, itemId);
    }
};
exports.OrderController = OrderController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建订单' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_order_dto_1.CreateOrderDto]),
    __metadata("design:returntype", void 0)
], OrderController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '获取订单列表' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: '按状态筛选' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Query)('status', new parse_order_status_pipe_1.ParseOrderStatusPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto, String]),
    __metadata("design:returntype", void 0)
], OrderController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('group/:groupId'),
    (0, swagger_1.ApiOperation)({ summary: '获取组内所有订单' }),
    __param(0, (0, common_1.Param)('groupId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", void 0)
], OrderController.prototype, "findByGroupId", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取订单详情' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], OrderController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新订单基本信息' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_order_dto_1.UpdateOrderDto]),
    __metadata("design:returntype", void 0)
], OrderController.prototype, "update", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: '更新订单状态' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_order_status_dto_1.UpdateOrderStatusDto]),
    __metadata("design:returntype", void 0)
], OrderController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '删除订单' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], OrderController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/items'),
    (0, swagger_1.ApiOperation)({ summary: '添加订单项' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_order_item_dto_1.CreateOrderItemDto]),
    __metadata("design:returntype", void 0)
], OrderController.prototype, "addItem", null);
__decorate([
    (0, common_1.Put)(':id/items/:itemId'),
    (0, swagger_1.ApiOperation)({ summary: '更新订单项' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('itemId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", void 0)
], OrderController.prototype, "updateItem", null);
__decorate([
    (0, common_1.Delete)(':id/items/:itemId'),
    (0, swagger_1.ApiOperation)({ summary: '删除订单项' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('itemId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], OrderController.prototype, "removeItem", null);
exports.OrderController = OrderController = __decorate([
    (0, swagger_1.ApiTags)('订单管理'),
    (0, common_1.Controller)('orders'),
    __metadata("design:paramtypes", [order_service_1.OrderService])
], OrderController);
//# sourceMappingURL=order.controller.js.map