import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, Between, FindOperator } from 'typeorm';
import { ExpiryFood } from './entities/expiry-food.entity';
import { CreateExpiryFoodDto } from './dto/create-expiry-food.dto';
import { UpdateExpiryFoodDto } from './dto/update-expiry-food.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

export type ExpiryStatus = 'fresh' | 'expiring' | 'expired';

export interface ExpiryFoodResponse extends ExpiryFood {
  status: ExpiryStatus;
  statusText: string;
  daysRemaining: number;
  daysText: string;
}

@Injectable()
export class ExpiryService {
  constructor(
    @InjectRepository(ExpiryFood)
    private readonly foodRepository: Repository<ExpiryFood>,
  ) {}

  async create(createDto: CreateExpiryFoodDto) {
    const food = this.foodRepository.create(createDto);
    const saved = await this.foodRepository.save(food);
    return this.toResponse(saved);
  }

  async findAll(
    paginationDto: PaginationDto,
    userId: number,
    status?: ExpiryStatus,
  ) {
    const { page, pageSize } = paginationDto;
    const skip = (page - 1) * pageSize;

    const { today, soon } = this.dateBounds();
    let expiryDateOp: FindOperator<string> | undefined;
    if (status === 'expired') {
      expiryDateOp = LessThan(today);
    } else if (status === 'expiring') {
      expiryDateOp = Between(today, soon);
    } else if (status === 'fresh') {
      expiryDateOp = MoreThan(soon);
    }

    const where: any = { userId };
    if (expiryDateOp) {
      where.expiryDate = expiryDateOp;
    }

    const [list, total] = await this.foodRepository.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { expiryDate: 'ASC' },
    });

    return {
      list: list.map((f) => this.toResponse(f)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number) {
    const food = await this.foodRepository.findOne({ where: { id } });
    if (!food) {
      throw new NotFoundException(`食品 ID ${id} 不存在`);
    }
    return this.toResponse(food);
  }

  async update(id: number, updateDto: UpdateExpiryFoodDto) {
    const food = await this.foodRepository.findOne({ where: { id } });
    if (!food) {
      throw new NotFoundException(`食品 ID ${id} 不存在`);
    }
    Object.assign(food, updateDto);
    const saved = await this.foodRepository.save(food);
    return this.toResponse(saved);
  }

  async remove(id: number) {
    const food = await this.foodRepository.findOne({ where: { id } });
    if (!food) {
      throw new NotFoundException(`食品 ID ${id} 不存在`);
    }
    await this.foodRepository.remove(food);
    return { success: true };
  }

  /** 返回今天与"即将过期"上限（含）的日期字符串，用于按状态过滤。 */
  private dateBounds() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const soon = new Date(today);
    soon.setDate(soon.getDate() + 3);
    return { today: this.formatDate(today), soon: this.formatDate(soon) };
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private toResponse(food: ExpiryFood): ExpiryFoodResponse {
    const days = this.daysRemaining(food.expiryDate);
    let status: ExpiryStatus;
    let statusText: string;
    if (days < 0) {
      status = 'expired';
      statusText = '已过期';
    } else if (days <= 3) {
      status = 'expiring';
      statusText = '即将过期';
    } else {
      status = 'fresh';
      statusText = '新鲜';
    }

    const daysText =
      days < 0
        ? `${Math.abs(days)}天前过期`
        : days === 0
          ? '今天过期'
          : `${days}天后过期`;

    return {
      ...food,
      status,
      statusText,
      daysRemaining: days,
      daysText,
    };
  }

  private daysRemaining(expiryDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(`${expiryDate}T00:00:00`);
    const diffMs = expiry.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }
}
