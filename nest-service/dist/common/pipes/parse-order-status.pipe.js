"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseOrderStatusPipe = void 0;
const common_1 = require("@nestjs/common");
const VALID_STATUSES = ['pending', 'confirming', 'cooking', 'completed'];
let ParseOrderStatusPipe = class ParseOrderStatusPipe {
    transform(value) {
        if (!VALID_STATUSES.includes(value)) {
            throw new common_1.BadRequestException(`无效的订单状态: ${value}，有效值为: ${VALID_STATUSES.join(', ')}`);
        }
        return value;
    }
};
exports.ParseOrderStatusPipe = ParseOrderStatusPipe;
exports.ParseOrderStatusPipe = ParseOrderStatusPipe = __decorate([
    (0, common_1.Injectable)()
], ParseOrderStatusPipe);
//# sourceMappingURL=parse-order-status.pipe.js.map