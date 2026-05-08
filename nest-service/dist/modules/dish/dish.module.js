"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DishModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const dish_service_1 = require("./dish.service");
const dish_controller_1 = require("./dish.controller");
const dish_entity_1 = require("./entities/dish.entity");
let DishModule = class DishModule {
};
exports.DishModule = DishModule;
exports.DishModule = DishModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([dish_entity_1.Dish])],
        controllers: [dish_controller_1.DishController],
        providers: [dish_service_1.DishService],
        exports: [dish_service_1.DishService],
    })
], DishModule);
//# sourceMappingURL=dish.module.js.map