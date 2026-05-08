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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderItem = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
const order_entity_1 = require("./order.entity");
const dish_entity_1 = require("../../dish/entities/dish.entity");
let OrderItem = class OrderItem {
};
exports.OrderItem = OrderItem;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID' }),
    (0, typeorm_1.PrimaryGeneratedColumn)({ comment: 'ID' }),
    __metadata("design:type", Number)
], OrderItem.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '订单ID' }),
    (0, typeorm_1.Column)({ type: 'int', comment: '订单ID' }),
    __metadata("design:type", Number)
], OrderItem.prototype, "orderId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '菜品ID' }),
    (0, typeorm_1.Column)({ type: 'int', comment: '菜品ID' }),
    __metadata("design:type", Number)
], OrderItem.prototype, "dishId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '数量' }),
    (0, typeorm_1.Column)({ type: 'int', default: 1, comment: '数量' }),
    __metadata("design:type", Number)
], OrderItem.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '单项备注' }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, comment: '单项备注' }),
    __metadata("design:type", String)
], OrderItem.prototype, "remark", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => order_entity_1.Order, (order) => order.items),
    (0, typeorm_1.JoinColumn)({ name: 'orderId' }),
    __metadata("design:type", order_entity_1.Order)
], OrderItem.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => dish_entity_1.Dish),
    (0, typeorm_1.JoinColumn)({ name: 'dishId' }),
    __metadata("design:type", dish_entity_1.Dish)
], OrderItem.prototype, "dish", void 0);
exports.OrderItem = OrderItem = __decorate([
    (0, typeorm_1.Entity)('order_items')
], OrderItem);
//# sourceMappingURL=order-item.entity.js.map