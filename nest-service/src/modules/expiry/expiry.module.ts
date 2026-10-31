import { Logger, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatOpenAI } from "@langchain/openai";
import { ExpiryController } from "./expiry.controller";
import { ExpiryService } from "./expiry.service";
import { ExpiryReminderService } from "./expiry-reminder.service";
import { ExpiryRecognitionService } from "./expiry-recognition.service";
import { ExpiryItem } from "./entities/expiry-item.entity";
import { ExpiryItemNotification } from "./entities/expiry-item-notification.entity";
import { DiningGroupMember } from "../foodie-buddy/dining-group/entities/dining-group-member.entity";
import { User } from "../foodie-buddy/user/entities/user.entity";
import { VectorModule } from "../vector/vector.module";
import { WechatModule } from "../wechat/wechat.module";
import { RERANK_MODEL } from "./expiry-search-rerank";
import { VISION_MODEL } from "./expiry-recognition.model";

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      ExpiryItem,
      ExpiryItemNotification,
      DiningGroupMember,
      User,
    ]),
    VectorModule,
    WechatModule,
  ],
  controllers: [ExpiryController],
  providers: [
    ExpiryService,
    ExpiryReminderService,
    ExpiryRecognitionService,
    {
      provide: VISION_MODEL,
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>("OPENAI_API_KEY");
        const modelName = configService.get<string>("VISION_MODEL_NAME");
        if (!apiKey || !modelName) {
          // 只让拍照识别降级，不影响应用启动和其他 AI 功能
          new Logger("ExpiryModule").warn(
            "未配置 VISION_MODEL_NAME 或 OPENAI_API_KEY，拍照识别将返回 503"
          );
          return null;
        }
        return new ChatOpenAI({
          model: modelName,
          apiKey,
          // 抽取字段是确定性任务，不要发挥
          temperature: 0,
          // 同步交互，超时就回退让用户手填
          timeout: 20000,
          maxRetries: 0,
          // 方舟默认可能开启深度思考，关闭后单图约 1-2 秒
          modelKwargs: { thinking: { type: "disabled" } },
          configuration: {
            baseURL: configService.get("OPENAI_BASE_URL"),
          },
        });
      },
      inject: [ConfigService],
    },
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
