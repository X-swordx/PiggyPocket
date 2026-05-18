import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/foodie-buddy/user/user.module';
import { DishModule } from './modules/foodie-buddy/dish/dish.module';
import { DiningGroupModule } from './modules/foodie-buddy/dining-group/dining-group.module';
import { OrderModule } from './modules/foodie-buddy/order/order.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 3306),
        username: configService.get('DB_USERNAME', 'root'),
        password: configService.get('DB_PASSWORD', ''),
        database: configService.get('DB_DATABASE', 'nest_demo'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // 开发环境自动同步表结构，生产环境设为 false
        logging: true,
        timezone: '+08:00',
      }),
      inject: [ConfigService],
    }),
    UserModule,
    DishModule,
    DiningGroupModule,
    OrderModule,
  ],
})
export class AppModule {}
