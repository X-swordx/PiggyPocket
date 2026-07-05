import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Dish } from './entities/dish.entity';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { DiningGroupMember } from '../dining-group/entities/dining-group-member.entity';

@Injectable()
export class DishService {
  constructor(
    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>,
    @InjectRepository(DiningGroupMember)
    private readonly memberRepository: Repository<DiningGroupMember>,
  ) {}

  async create(createDishDto: CreateDishDto) {
    await this.ensureGroupMembership(
      createDishDto.userId,
      createDishDto.groupId,
    );
    const dish = this.dishRepository.create(createDishDto);
    return await this.dishRepository.save(dish);
  }

  async findAll(
    paginationDto: PaginationDto,
    userId: number,
    category?: string,
  ) {
    const { page, pageSize } = paginationDto;
    const skip = (page - 1) * pageSize;

    const groupIds = await this.findUserGroupIds(userId);
    if (groupIds.length === 0) {
      return {
        list: [],
        total: 0,
        page,
        pageSize,
      };
    }

    const where: any = { groupId: In(groupIds) };
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

  async findOne(id: number, userId: number) {
    const dish = await this.dishRepository.findOne({ where: { id } });
    if (!dish) {
      throw new NotFoundException(`菜品 ID ${id} 不存在`);
    }
    await this.ensureGroupMembership(userId, dish.groupId);
    return dish;
  }

  async update(id: number, userId: number, updateDishDto: UpdateDishDto) {
    const dish = await this.findOne(id, userId);
    if (updateDishDto.groupId && updateDishDto.groupId !== dish.groupId) {
      throw new ForbiddenException('禁止修改菜品所属饭搭子组');
    }
    Object.assign(dish, updateDishDto);
    return await this.dishRepository.save(dish);
  }

  async remove(id: number, userId: number) {
    const dish = await this.findOne(id, userId);
    await this.dishRepository.remove(dish);
    return { success: true };
  }

  private async findUserGroupIds(userId: number): Promise<number[]> {
    const members = await this.memberRepository.find({ where: { userId } });
    return members.map((m) => m.groupId);
  }

  private async ensureGroupMembership(userId: number, groupId: number) {
    const member = await this.memberRepository.findOne({
      where: { userId, groupId },
    });
    if (!member) {
      throw new ForbiddenException('用户不在该饭搭子组内，无权操作');
    }
  }
}
