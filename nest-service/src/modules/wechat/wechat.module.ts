import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WechatService } from './wechat.service';
import { WechatSubscribeQuota } from './entities/wechat-subscribe-quota.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([WechatSubscribeQuota]),
  ],
  providers: [WechatService],
  exports: [WechatService],
})
export class WechatModule {}
