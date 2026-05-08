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
exports.UpdateNicknameDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdateNicknameDto {
}
exports.UpdateNicknameDto = UpdateNicknameDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '用户ID' }),
    (0, class_validator_1.IsNotEmpty)({ message: '用户ID不能为空' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateNicknameDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '新昵称' }),
    (0, class_validator_1.IsNotEmpty)({ message: '昵称不能为空' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateNicknameDto.prototype, "nickname", void 0);
//# sourceMappingURL=update-nickname.dto.js.map