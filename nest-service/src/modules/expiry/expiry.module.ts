import { Logger, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatOpenAI } from "@langchain/openai";
import { ExpiryController } from "./expiry.controller";
import { ExpiryService } from "./expiry.service";
import { ExpiryReminderService } from "./expiry-reminder.service";
import { ExpiryItem } from "./entities/expiry-item.entity";
import { User } from "../foodie-buddy/user/entities/user.entity";
import { VectorModule } from "../vector/vector.module";
import { WechatModule } from "../wechat/wechat.module";
import { RERANK_MODEL } from "./expiry-search-rerank";

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ExpiryItem, User]),
    VectorModule,
    WechatModule,
  ],
  controllers: [ExpiryController],
  providers: [
    ExpiryService,
    ExpiryReminderService,
    {
      provide: RERANK_MODEL,
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>("OPENAI_API_KEY");
        if (!apiKey) {
          // 缺配置只让重排失效，搜索回退到统计阈值，不阻断启动
          new Logger("ExpiryModule").warn(
            "未配置 OPENAI_API_KEY，语义搜索将只用统计阈值筛选"
          );
          return null;
        }
        return new ChatOpenAI({
          model: configService.get("MODEL_NAME"),
          apiKey,
          // 筛选是判断题，不需要发挥
          temperature: 0,
          // 搜索是同步交互，宁可超时回退也不能让用户干等
          timeout: 10000,
          maxRetries: 0,
          configuration: {
            baseURL: configService.get("OPENAI_BASE_URL"),
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [ExpiryReminderService],
})
export class ExpiryModule {}
