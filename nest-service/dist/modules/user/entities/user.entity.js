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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
const order_entity_1 = require("../../order/entities/order.entity");
const dining_group_member_entity_1 = require("../../dining-group/entities/dining-group-member.entity");
let User = class User {
};
exports.User = User;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户ID' }),
    (0, typeorm_1.PrimaryGeneratedColumn)({ comment: '用户ID' }),
    __metadata("design:type", Number)
], User.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '微信 openid' }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true, nullable: true, comment: '微信 openid' }),
    __metadata("design:type", String)
], User.prototype, "openid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户名' }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true, comment: '用户名' }),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '手机号' }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true, comment: '手机号' }),
    __metadata("design:type", String)
], User.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '微信昵称' }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true, comment: '微信昵称' }),
    __metadata("design:type", String)
], User.prototype, "nickname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '微信头像URL' }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, comment: '微信头像URL' }),
    __metadata("design:type", String)
], User.prototype, "avatar", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '邮箱' }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true, comment: '邮箱' }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '地址' }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, comment: '地址' }),
    __metadata("design:type", String)
], User.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '创建时间' }),
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime', comment: '创建时间' }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '更新时间' }),
    (0, typeorm_1.UpdateDateColumn)({ type: 'datetime', comment: '更新时间' }),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => order_entity_1.Order, (order) => order.user),
    __metadata("design:type", Array)
], User.prototype, "orders", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => dining_group_member_entity_1.DiningGroupMember, (member) => member.user),
    __metadata("design:type", Array)
], User.prototype, "groupMembers", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
//# sourceMappingURL=user.entity.js.map