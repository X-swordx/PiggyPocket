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
exports.DishService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const dish_entity_1 = require("./entities/dish.entity");
let DishService = class DishService {
    constructor(dishRepository) {
        this.dishRepository = dishRepository;
    }
    async create(createDishDto) {
        const dish = this.dishRepository.create(createDishDto);
        return await this.dishRepository.save(dish);
    }
    async findAll(paginationDto, category) {
        const { page, pageSize } = paginationDto;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (category) {
            where.category = category;
        }
        const [list, total] = await this.dishRepository.findAndCount({
            where,
            skip,
            take: pageSize,
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
        const dish = await this.dishRepository.findOne({ where: { id } });
        if (!dish) {
            throw new common_1.NotFoundException(`菜品 ID ${id} 不存在`);
        }
        return dish;
    }
    async update(id, updateDishDto) {
        const dish = await this.findOne(id);
        Object.assign(dish, updateDishDto);
        return await this.dishRepository.save(dish);
    }
    async remove(id) {
        const dish = await this.findOne(id);
        await this.dishRepository.remove(dish);
        return { success: true };
    }
};
exports.DishService = DishService;
exports.DishService = DishService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(dish_entity_1.Dish)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], DishService);
//# sourceMappingURL=dish.service.js.map