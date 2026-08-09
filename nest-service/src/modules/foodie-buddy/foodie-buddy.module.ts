import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// User
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { User } from './user/entities/user.entity';

// Dish
import { DishController } from './dish/dish.controller';
import { DishService } from './dish/dish.service';
import { Dish } from './dish/entities/dish.entity';
import { DishCategory } from './dish/entities/dish-category.entity';

// Dining Group
import { DiningGroupController } from './dining-group/dining-group.controller';
import { DiningGroupService } from './dining-group/dining-group.service';
import { DiningGroup } from './dining-group/entities/dining-group.entity';
import { DiningGroupMember } from './dining-group/entities/dining-group-member.entity';

// Order
import { OrderController } from './order/order.controller';
import { OrderService } from './order/order.service';
import { Order } from './order/entities/order.entity';
import { OrderItem } from './order/entities/order-item.entity';
import { Message } from './message/entities/message.entity';
import { MessageRead } from './message/entities/message-read.entity';
import { MessageController } from './message/message.controller';
import { MessageService } from './message/message.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Dish,
      DishCategory,
      DiningGroup,
      DiningGroupMember,
      Order,
      OrderItem,
      Message,
      MessageRead,
    ]),
  ],
  controllers: [
    UserController,
    DishController,
    DiningGroupController,
    OrderController,
    MessageController,
  ],
  providers: [
    UserService,
    DishService,
    DiningGroupService,
    OrderService,
    MessageService,
  ],
})
export class FoodieBuddyModule {}
