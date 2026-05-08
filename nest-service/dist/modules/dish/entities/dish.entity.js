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
exports.Dish = void 0;
const typeorm_1 = require("typeorm");
const swagger_1 = require("@nestjs/swagger");
let Dish = class Dish {
};
exports.Dish = Dish;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '菜品ID' }),
    (0, typeorm_1.PrimaryGeneratedColumn)({ comment: '菜品ID' }),
    __metadata("design:type", Number)
], Dish.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '菜品名称' }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, comment: '菜品名称' }),
    __metadata("design:type", String)
], Dish.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '描述' }),
    (0, typeorm_1.Column)({ type: 'text', nullable: true, comment: '描述' }),
    __metadata("design:type", String)
], Dish.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '分类：热菜/凉菜/主食/饮品' }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true, comment: '分类：热菜/凉菜/主食/饮品' }),
    __metadata("design:type", String)
], Dish.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '图片URL' }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, comment: '图片URL' }),
    __metadata("design:type", String)
], Dish.prototype, "image", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '状态：0=下架，1=上架' }),
    (0, typeorm_1.Column)({ type: 'tinyint', default: 1, comment: '状态：0=下架，1=上架' }),
    __metadata("design:type", Number)
], Dish.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '创建时间' }),
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime', comment: '创建时间' }),
    __metadata("design:type", Date)
], Dish.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '更新时间' }),
    (0, typeorm_1.UpdateDateColumn)({ type: 'datetime', comment: '更新时间' }),
    __metadata("design:type", Date)
], Dish.prototype, "updatedAt", void 0);
exports.Dish = Dish = __decorate([
    (0, typeorm_1.Entity)('dishes')
], Dish);
//# sourceMappingURL=dish.entity.js.map