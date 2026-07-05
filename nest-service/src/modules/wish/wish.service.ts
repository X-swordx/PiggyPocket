import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wish } from './entities/wish.entity';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class WishService {
  constructor(
    @InjectRepository(Wish)
    private readonly wishRepository: Repository<Wish>,
  ) {}

  async create(createWishDto: CreateWishDto) {
    const wish = this.wishRepository.create({
      filter: 0,
      ...createWishDto,
    });
    return await this.wishRepository.save(wish);
  }

  async findAll(
    paginationDto: PaginationDto,
    userId: number,
    completed?: boolean,
  ) {
    const { page, pageSize } = paginationDto;
    const skip = (page - 1) * pageSize;

    const where: any = { userId };
    if (completed !== undefined) {
      where.completed = completed;
    }

    const [list, total] = await this.wishRepository.findAndCount({
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

  async countCompleted(userId: number) {
    return await this.wishRepository.count({
      where: { userId, completed: true },
    });
  }

  async findOne(id: number) {
    const wish = await this.wishRepository.findOne({ where: { id } });
    if (!wish) {
      throw new NotFoundException(`心愿 ID ${id} 不存在`);
    }
    return wish;
  }

  async update(id: number, updateWishDto: UpdateWishDto) {
    const wish = await this.findOne(id);
    Object.assign(wish, updateWishDto);
    return await this.wishRepository.save(wish);
  }

  async remove(id: number) {
    const wish = await this.findOne(id);
    await this.wishRepository.remove(wish);
    return { success: true };
  }
}
