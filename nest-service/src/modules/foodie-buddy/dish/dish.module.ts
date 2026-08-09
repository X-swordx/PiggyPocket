import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DishService } from './dish.service';
import { DishController } from './dish.controller';
import { Dish } from './entities/dish.entity';
import { DishCategory } from './entities/dish-category.entity';
import { DiningGroupMember } from '../dining-group/entities/dining-group-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Dish, DishCategory, DiningGroupMember])],
  controllers: [DishController],
  providers: [DishService],
  exports: [DishService],
})
export class DishModule {}
