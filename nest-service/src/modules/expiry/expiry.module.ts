import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpiryController } from './expiry.controller';
import { ExpiryService } from './expiry.service';
import { ExpiryFood } from './entities/expiry-food.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExpiryFood])],
  controllers: [ExpiryController],
  providers: [ExpiryService],
})
export class ExpiryModule {}
