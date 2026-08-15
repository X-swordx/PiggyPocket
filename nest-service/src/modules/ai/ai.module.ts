import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';

@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [
    AiService,
    {
      provide: 'CHAT_MODEL',
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>('OPENAI_API_KEY');
        if (!apiKey) {
          // 返回 null 而不是抛错：缺配置只让 AI 接口失效，不阻断整个应用启动
          new Logger('AiModule').warn(
            '未配置 OPENAI_API_KEY，AI 菜谱生成接口将返回错误',
          );
          return null;
        }
        return new ChatOpenAI({
          model: configService.get('MODEL_NAME'),
          apiKey,
          // 略高的温度让"重新生成"能产出不同的做法
          temperature: 0.8,
          configuration: {
            baseURL: configService.get('OPENAI_BASE_URL'),
          },
        });
      },
      inject: [ConfigService],
    },
  ],
})
export class AiModule {}
