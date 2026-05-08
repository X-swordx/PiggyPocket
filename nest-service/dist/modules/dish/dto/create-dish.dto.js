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
exports.CreateDishDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateDishDto {
}
exports.CreateDishDto = CreateDishDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '菜品名称' }),
    (0, class_validator_1.IsNotEmpty)({ message: '菜品名称不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDishDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '描述' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDishDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '分类：热菜/凉菜/主食/饮品' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['热菜', '凉菜', '主食', '饮品'], { message: '分类只能是：热菜、凉菜、主食、饮品' }),
    __metadata("design:type", String)
], CreateDishDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '图片URL' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDishDto.prototype, "image", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '状态：0=下架，1=上架', default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)([0, 1], { message: '状态只能是 0 或 1' }),
    __metadata("design:type", Number)
], CreateDishDto.prototype, "status", void 0);
//# sourceMappingURL=create-dish.dto.js.map