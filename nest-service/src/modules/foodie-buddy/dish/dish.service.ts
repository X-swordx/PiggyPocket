import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dish } from './entities/dish.entity';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';

@Injectable()
export class DishService {
  constructor(
    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>,
  ) {}

  async create(createDishDto: CreateDishDto) {
    const dish = this.dishRepository.create(createDishDto);
    return await this.dishRepository.save(dish);
  }

  async findAll(paginationDto: PaginationDto, category?: string) {
    const { page, pageSize } = paginationDto;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (category) {
      where.category = category;
    }

    const [list, total] = await this.dishRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number) {
    const dish = await this.dishRepository.findOne({ where: { id } });
    if (!dish) {
      throw new NotFoundException(`菜品 ID ${id} 不存在`);
    }
    return dish;
  }

  async update(id: number, updateDishDto: UpdateDishDto) {
    const dish = await this.findOne(id);
    Object.assign(dish, updateDishDto);
    return await this.dishRepository.save(dish);
  }

  async remove(id: number) {
    const dish = await this.findOne(id);
    await this.dishRepository.remove(dish);
    return { success: true };
  }
}
