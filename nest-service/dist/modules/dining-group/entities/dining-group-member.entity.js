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
exports.DiningGroupMember = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
const dining_group_entity_1 = require("./dining-group.entity");
const user_entity_1 = require("../../user/entities/user.entity");
let DiningGroupMember = class DiningGroupMember {
};
exports.DiningGroupMember = DiningGroupMember;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID' }),
    (0, typeorm_1.PrimaryGeneratedColumn)({ comment: 'ID' }),
    __metadata("design:type", Number)
], DiningGroupMember.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '组ID' }),
    (0, typeorm_1.Column)({ type: 'int', comment: '组ID' }),
    __metadata("design:type", Number)
], DiningGroupMember.prototype, "groupId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户ID' }),
    (0, typeorm_1.Column)({ type: 'int', comment: '用户ID' }),
    __metadata("design:type", Number)
], DiningGroupMember.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '在组内的昵称' }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true, comment: '在组内的昵称' }),
    __metadata("design:type", String)
], DiningGroupMember.prototype, "nickname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '加入时间' }),
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime', comment: '加入时间' }),
    __metadata("design:type", Date)
], DiningGroupMember.prototype, "joinedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => dining_group_entity_1.DiningGroup, (group) => group.members),
    (0, typeorm_1.JoinColumn)({ name: 'groupId' }),
    __metadata("design:type", dining_group_entity_1.DiningGroup)
], DiningGroupMember.prototype, "group", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.groupMembers),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], DiningGroupMember.prototype, "user", void 0);
exports.DiningGroupMember = DiningGroupMember = __decorate([
    (0, typeorm_1.Entity)('dining_group_members')
], DiningGroupMember);
//# sourceMappingURL=dining-group-member.entity.js.map