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
exports.Order = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
const user_entity_1 = require("../../user/entities/user.entity");
const dining_group_entity_1 = require("../../dining-group/entities/dining-group.entity");
const order_item_entity_1 = require("./order-item.entity");
let Order = class Order {
};
exports.Order = Order;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '订单ID' }),
    (0, typeorm_1.PrimaryGeneratedColumn)({ comment: '订单ID' }),
    __metadata("design:type", Number)
], Order.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '订单号' }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, unique: true, comment: '订单号' }),
    __metadata("design:type", String)
], Order.prototype, "orderNo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '下单用户ID' }),
    (0, typeorm_1.Column)({ type: 'int', comment: '下单用户ID' }),
    __metadata("design:type", Number)
], Order.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用餐组ID' }),
    (0, typeorm_1.Column)({ type: 'int', nullable: true, comment: '用餐组ID' }),
    __metadata("design:type", Number)
], Order.prototype, "groupId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '桌号' }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true, comment: '桌号' }),
    __metadata("design:type", String)
], Order.prototype, "tableNo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '状态：pending/confirming/cooking/completed' }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'pending', comment: '状态：pending/confirming/cooking/completed' }),
    __metadata("design:type", String)
], Order.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '订单备注' }),
    (0, typeorm_1.Column)({ type: 'text', nullable: true, comment: '订单备注' }),
    __metadata("design:type", String)
], Order.prototype, "remark", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '创建时间' }),
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime', comment: '创建时间' }),
    __metadata("design:type", Date)
], Order.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '更新时间' }),
    (0, typeorm_1.UpdateDateColumn)({ type: 'datetime', comment: '更新时间' }),
    __metadata("design:type", Date)
], Order.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.orders),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], Order.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => dining_group_entity_1.DiningGroup, (group) => group.orders),
    (0, typeorm_1.JoinColumn)({ name: 'groupId' }),
    __metadata("design:type", dining_group_entity_1.DiningGroup)
], Order.prototype, "group", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => order_item_entity_1.OrderItem, (item) => item.order, { cascade: true }),
    __metadata("design:type", Array)
], Order.prototype, "items", void 0);
exports.Order = Order = __decorate([
    (0, typeorm_1.Entity)('orders')
], Order);
//# sourceMappingURL=order.entity.js.map