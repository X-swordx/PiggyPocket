import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatOpenAI } from '@langchain/openai';

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

// Recipe Inspiration
import { RecipeInspirationController } from './recipe-inspiration/recipe-inspiration.controller';
import { RecipeInspirationService } from './recipe-inspiration/recipe-inspiration.service';
import { RecipeOption } from './recipe-inspiration/entities/recipe-option.entity';

@Module({
  imports: [
    ConfigModule,
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
      RecipeOption,
    ]),
  ],
  controllers: [
    UserController,
    DishController,
    DiningGroupController,
    OrderController,
    MessageController,
    RecipeInspirationController,
  ],
  providers: [
    UserService,
    DishService,
    DiningGroupService,
    OrderService,
    MessageService,
    RecipeInspirationService,
    {
      provide: 'INSPIRE_CHAT_MODEL',
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>('OPENAI_API_KEY');
        if (!apiKey) {
          // 缺配置只让灵感推荐失效，不阻断启动
          new Logger('FoodieBuddyModule').warn(
            '未配置 OPENAI_API_KEY，灵感菜谱生成接口将返回错误',
          );
          return null;
        }
        return new ChatOpenAI({
          model: configService.get('MODEL_NAME'),
          apiKey,
          // 略高的温度让"换一批"能产出不同的搭配
          temperature: 0.8,
          timeout: 60000,
          maxRetries: 1,
          configuration: {
            baseURL: configService.get('OPENAI_BASE_URL'),
          },
        });
      },
      inject: [ConfigService],
    },
  ],
})
export class FoodieBuddyModule {}
