import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatOpenAI } from '@langchain/openai';
import { PoopController } from './poop.controller';
import { PoopService } from './poop.service';
import { PoopReminderService } from './poop-reminder.service';
import { PoopRecord } from './entities/poop-record.entity';
import { PoopReminderNotification } from './entities/poop-reminder-notification.entity';
import { WechatSubscribeQuota } from '../wechat/entities/wechat-subscribe-quota.entity';
import { User } from '../foodie-buddy/user/entities/user.entity';
import { WechatModule } from '../wechat/wechat.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      PoopRecord,
      PoopReminderNotification,
      WechatSubscribeQuota,
      User,
    ]),
    WechatModule,
  ],
  controllers: [PoopController],
  providers: [
    PoopService,
    PoopReminderService,
    {
      provide: 'POOP_CHAT_MODEL',
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>('OPENAI_API_KEY');
        if (!apiKey) {
          // 缺配置只让 AI 建议失效，不阻断启动
          new Logger('PoopModule').warn(
            '未配置 OPENAI_API_KEY，AI 健康建议接口将返回错误',
          );
          return null;
        }
        return new ChatOpenAI({
          model: configService.get('MODEL_NAME'),
          apiKey,
          // 健康建议以事实解读为主，低温度保持稳定
          temperature: 0.3,
          timeout: 30000,
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
export class PoopModule {}
