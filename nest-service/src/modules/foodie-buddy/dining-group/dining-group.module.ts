import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiningGroupService } from './dining-group.service';
import { DiningGroupController } from './dining-group.controller';
import { DiningGroup } from './entities/dining-group.entity';
import { DiningGroupMember } from './entities/dining-group-member.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DiningGroup, DiningGroupMember]),
    UserModule,
  ],
  controllers: [DiningGroupController],
  providers: [DiningGroupService],
  exports: [DiningGroupService],
})
export class DiningGroupModule {}
