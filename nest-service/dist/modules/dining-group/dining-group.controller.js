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
exports.DiningGroupController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const dining_group_service_1 = require("./dining-group.service");
const create_dining_group_dto_1 = require("./dto/create-dining-group.dto");
const add_member_dto_1 = require("./dto/add-member.dto");
const update_nickname_dto_1 = require("./dto/update-nickname.dto");
let DiningGroupController = class DiningGroupController {
    constructor(diningGroupService) {
        this.diningGroupService = diningGroupService;
    }
    create(createDiningGroupDto) {
        return this.diningGroupService.create(createDiningGroupDto);
    }
    findMyGroups(userId) {
        return this.diningGroupService.findMyGroups(userId);
    }
    findOne(id) {
        return this.diningGroupService.findOne(id);
    }
    addMember(groupId, addMemberDto) {
        return this.diningGroupService.addMember(groupId, addMemberDto);
    }
    updateNickname(groupId, updateNicknameDto) {
        return this.diningGroupService.updateNickname(groupId, updateNicknameDto);
    }
    removeMember(groupId, userId) {
        return this.diningGroupService.removeMember(groupId, userId);
    }
    leaveGroup(groupId, userId) {
        return this.diningGroupService.leaveGroup(groupId, userId);
    }
};
exports.DiningGroupController = DiningGroupController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建新的饭搭子组' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_dining_group_dto_1.CreateDiningGroupDto]),
    __metadata("design:returntype", void 0)
], DiningGroupController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, swagger_1.ApiOperation)({ summary: '获取我加入的所有组' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', description: '用户ID' }),
    __param(0, (0, common_1.Query)('userId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DiningGroupController.prototype, "findMyGroups", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取组详情（含成员列表）' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DiningGroupController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/members'),
    (0, swagger_1.ApiOperation)({ summary: '通过 openid 添加成员' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, add_member_dto_1.AddMemberDto]),
    __metadata("design:returntype", void 0)
], DiningGroupController.prototype, "addMember", null);
__decorate([
    (0, common_1.Put)(':id/nickname'),
    (0, swagger_1.ApiOperation)({ summary: '修改在组里的昵称' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_nickname_dto_1.UpdateNicknameDto]),
    __metadata("design:returntype", void 0)
], DiningGroupController.prototype, "updateNickname", null);
__decorate([
    (0, common_1.Delete)(':id/members/:userId'),
    (0, swagger_1.ApiOperation)({ summary: '移除成员' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('userId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], DiningGroupController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Delete)(':id/leave'),
    (0, swagger_1.ApiOperation)({ summary: '退出组' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', description: '退出的用户ID' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('userId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], DiningGroupController.prototype, "leaveGroup", null);
exports.DiningGroupController = DiningGroupController = __decorate([
    (0, swagger_1.ApiTags)('饭搭子组'),
    (0, common_1.Controller)('dining-groups'),
    __metadata("design:paramtypes", [dining_group_service_1.DiningGroupService])
], DiningGroupController);
//# sourceMappingURL=dining-group.controller.js.map