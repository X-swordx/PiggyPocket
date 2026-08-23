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
import { AdminExpiryItemService } from './admin-expiry-item.service';
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
import { ExpiryItem } from '../expiry/entities/expiry-item.entity';
import { Wish } from '../wish/entities/wish.entity';
import { Dish } from '../foodie-buddy/dish/entities/dish.entity';
import { DishCategory } from '../foodie-buddy/dish/entities/dish-category.entity';
import { User } from '../foodie-buddy/user/entities/user.entity';
import { Order } from '../foodie-buddy/order/entities/order.entity';
import { OrderItem } from '../foodie-buddy/order/entities/order-item.entity';
import { DiningGroup } from '../foodie-buddy/dining-group/entities/dining-group.entity';
import { DiningGroupMember } from '../foodie-buddy/dining-group/entities/dining-group-member.entity';
import { Message } from '../foodie-buddy/message/entities/message.entity';
import { MessageRead } from '../foodie-buddy/message/entities/message-read.entity';
import { AdminMessageService } from './admin-message.service';
import { OssModule } from '../oss/oss.module';
import { VectorModule } from '../vector/vector.module';
import { ExpiryModule } from '../expiry/expiry.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminUser,
      AdminOperationLog,
      AdminRolePermission,
      ExpiryItem,
      Wish,
      Dish,
      DishCategory,
      User,
      Order,
      OrderItem,
      DiningGroup,
      DiningGroupMember,
      Message,
      MessageRead,
    ]),
    OssModule,
    // AdminExpiryItemService 依赖 ItemVectorService（重建索引）和 ExpiryReminderService（手动触发扫描）
    VectorModule,
    ExpiryModule,
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
    AdminExpiryItemService,
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
    AdminMessageService,
  ],
  exports: [AdminAuthService, AdminAuthGuard],
})
export class AdminModule {}
