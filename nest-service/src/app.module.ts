import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodieBuddyModule } from './modules/foodie-buddy/foodie-buddy.module';
import { WishModule } from './modules/wish/wish.module';
import { ExpiryModule } from './modules/expiry/expiry.module';
import { OssModule } from './modules/oss/oss.module';
import { AdminModule } from './modules/admin/admin.module';
import { AiModule } from './modules/ai/ai.module';
import { OssSignInterceptor } from './common/interceptors/oss-sign.interceptor';
import { OssUrlMiddleware } from './common/middleware/oss-url.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // 到期提醒的每日定时任务
    ScheduleModule.forRoot(),
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
        synchronize: false,
        logging: true,
        // 全链路 UTC：MySQL 以 UTC 生成 CURRENT_TIMESTAMP，客户端也按 UTC 解析
        timezone: 'Z',
      }),
      inject: [ConfigService],
    }),
    FoodieBuddyModule,
    WishModule,
    ExpiryModule,
    OssModule,
    AdminModule,
    AiModule,
  ],
  providers: [
    // 私有 bucket：响应里的 OSS URL 统一加临时读取签名
    { provide: APP_INTERCEPTOR, useClass: OssSignInterceptor },
    OssUrlMiddleware,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 与上面的签名拦截器对称：入库前把签名剥回裸 URL
    consumer.apply(OssUrlMiddleware).forRoutes('*');
  }
}
