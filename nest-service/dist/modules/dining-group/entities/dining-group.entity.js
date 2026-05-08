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
exports.DiningGroup = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
const dining_group_member_entity_1 = require("./dining-group-member.entity");
const user_entity_1 = require("../../user/entities/user.entity");
const order_entity_1 = require("../../order/entities/order.entity");
let DiningGroup = class DiningGroup {
};
exports.DiningGroup = DiningGroup;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '组ID' }),
    (0, typeorm_1.PrimaryGeneratedColumn)({ comment: '组ID' }),
    __metadata("design:type", Number)
], DiningGroup.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '组名' }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, comment: '组名' }),
    __metadata("design:type", String)
], DiningGroup.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '创建者ID' }),
    (0, typeorm_1.Column)({ type: 'int', comment: '创建者ID' }),
    __metadata("design:type", Number)
], DiningGroup.prototype, "creatorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '创建时间' }),
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime', comment: '创建时间' }),
    __metadata("design:type", Date)
], DiningGroup.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '更新时间' }),
    (0, typeorm_1.UpdateDateColumn)({ type: 'datetime', comment: '更新时间' }),
    __metadata("design:type", Date)
], DiningGroup.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'creatorId' }),
    __metadata("design:type", user_entity_1.User)
], DiningGroup.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => dining_group_member_entity_1.DiningGroupMember, (member) => member.group),
    __metadata("design:type", Array)
], DiningGroup.prototype, "members", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => order_entity_1.Order, (order) => order.group),
    __metadata("design:type", Array)
], DiningGroup.prototype, "orders", void 0);
exports.DiningGroup = DiningGroup = __decorate([
    (0, typeorm_1.Entity)('dining_groups')
], DiningGroup);
//# sourceMappingURL=dining-group.entity.js.map