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
exports.DishController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const dish_service_1 = require("./dish.service");
const create_dish_dto_1 = require("./dto/create-dish.dto");
const update_dish_dto_1 = require("./dto/update-dish.dto");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let DishController = class DishController {
    constructor(dishService) {
        this.dishService = dishService;
    }
    create(createDishDto) {
        return this.dishService.create(createDishDto);
    }
    findAll(paginationDto, category) {
        return this.dishService.findAll(paginationDto, category);
    }
    findOne(id) {
        return this.dishService.findOne(id);
    }
    update(id, updateDishDto) {
        return this.dishService.update(id, updateDishDto);
    }
    remove(id) {
        return this.dishService.remove(id);
    }
};
exports.DishController = DishController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建菜品' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_dish_dto_1.CreateDishDto]),
    __metadata("design:returntype", void 0)
], DishController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '获取菜品列表' }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false, description: '按分类筛选' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto, String]),
    __metadata("design:returntype", void 0)
], DishController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取单个菜品' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DishController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新菜品' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_dish_dto_1.UpdateDishDto]),
    __metadata("design:returntype", void 0)
], DishController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '删除菜品' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DishController.prototype, "remove", null);
exports.DishController = DishController = __decorate([
    (0, swagger_1.ApiTags)('菜品管理'),
    (0, common_1.Controller)('dishes'),
    __metadata("design:paramtypes", [dish_service_1.DishService])
], DishController);
//# sourceMappingURL=dish.controller.js.map