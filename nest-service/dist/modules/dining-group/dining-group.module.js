"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiningGroupModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const dining_group_service_1 = require("./dining-group.service");
const dining_group_controller_1 = require("./dining-group.controller");
const dining_group_entity_1 = require("./entities/dining-group.entity");
const dining_group_member_entity_1 = require("./entities/dining-group-member.entity");
const user_module_1 = require("../user/user.module");
let DiningGroupModule = class DiningGroupModule {
};
exports.DiningGroupModule = DiningGroupModule;
exports.DiningGroupModule = DiningGroupModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([dining_group_entity_1.DiningGroup, dining_group_member_entity_1.DiningGroupMember]),
            user_module_1.UserModule,
        ],
        controllers: [dining_group_controller_1.DiningGroupController],
        providers: [dining_group_service_1.DiningGroupService],
        exports: [dining_group_service_1.DiningGroupService],
    })
], DiningGroupModule);
//# sourceMappingURL=dining-group.module.js.map