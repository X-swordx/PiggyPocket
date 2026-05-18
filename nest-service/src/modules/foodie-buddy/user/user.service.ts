import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // 检查 openid 是否已存在
    const existing = await this.userRepository.findOne({
      where: { openid: createUserDto.openid },
    });
    if (existing) {
      return existing;
    }

    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, pageSize } = paginationDto;
    const skip = (page - 1) * pageSize;

    const [list, total] = await this.userRepository.findAndCount({
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
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`用户 ID ${id} 不存在`);
    }
    return user;
  }

  async findByOpenid(openid: string) {
    return await this.userRepository.findOne({ where: { openid } });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
    return { success: true };
  }
}
