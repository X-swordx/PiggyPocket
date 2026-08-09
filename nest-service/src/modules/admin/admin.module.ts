import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminUser } from './entities/admin-user.entity';
import { AdminOperationLog } from './entities/admin-operation-log.entity';
import { AdminRolePermission } from './entities/admin-role-permission.entity';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminRoleGuard } from './admin-role.guard';
import { AdminResourceController } from './admin-resource.controller';
import { AdminSystemController } from './admin-system.controller';
import { AdminExpiryFoodService } from './admin-expiry-food.service';
import { AdminWishService } from './admin-wish.service';
import { AdminDishService } from './admin-dish.service';
import { AdminDishCategoryService } from './admin-dish-category.service';
import { AdminUserService } from './admin-user.service';
import { AdminOrderService } from './admin-order.service';
import { AdminDiningGroupService } from './admin-dining-group.service';
import { AdminAccountService } from './admin-account.service';
import { AdminOperationLogService } from './admin-operation-log.service';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminRolePermissionService } from './admin-role-permission.service';
import { ExpiryFood } from '../expiry/entities/expiry-food.entity';
import { Wish } from '../wish/entities/wish.entity';
import { Dish } from '../foodie-buddy/dish/entities/dish.entity';
import { DishCategory } from '../foodie-buddy/dish/entities/dish-category.entity';
import { User } from '../foodie-buddy/user/entities/user.entity';
import { Order } from '../foodie-buddy/order/entities/order.entity';
import { OrderItem } from '../foodie-buddy/order/entities/order-item.entity';
import { DiningGroup } from '../foodie-buddy/dining-group/entities/dining-group.entity';
import { DiningGroupMember } from '../foodie-buddy/dining-group/entities/dining-group-member.entity';
import { OssModule } from '../oss/oss.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminUser,
      AdminOperationLog,
      AdminRolePermission,
      ExpiryFood,
      Wish,
      Dish,
      DishCategory,
      User,
      Order,
      OrderItem,
      DiningGroup,
      DiningGroupMember,
    ]),
    OssModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('ADMIN_JWT_SECRET', 'piggy-pocket-admin-secret'),
        signOptions: {
          expiresIn: config.get<string>('ADMIN_JWT_EXPIRES_IN', '2h') as any,
        },
      }),
    }),
  ],
  controllers: [AdminAuthController, AdminResourceController, AdminSystemController],
  providers: [
    AdminAuthService,
    AdminAuthGuard,
    AdminRoleGuard,
    AdminExpiryFoodService,
    AdminWishService,
    AdminDishService,
    AdminDishCategoryService,
    AdminUserService,
    AdminOrderService,
    AdminDiningGroupService,
    AdminAccountService,
    AdminOperationLogService,
    AdminDashboardService,
    AdminRolePermissionService,
  ],
  exports: [AdminAuthService, AdminAuthGuard],
})
export class AdminModule {}
