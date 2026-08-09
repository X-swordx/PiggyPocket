import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { DishCategory } from '../foodie-buddy/dish/entities/dish-category.entity';
import { Dish } from '../foodie-buddy/dish/entities/dish.entity';
import { AdminOperationLogService, LogContext } from './admin-operation-log.service';

/**
 * 后台菜品分类服务。
 * 与小程序端 DishService.findCategories 的差异：
 * - 列表包含已停用的分类，供后台管理。
 * - 提供增删改与启用/停用。
 */
@Injectable()
export class AdminDishCategoryService {
  constructor(
    @InjectRepository(DishCategory)
    private readonly categoryRepo: Repository<DishCategory>,
    @InjectRepository(Dish)
    private readonly dishRepo: Repository<Dish>,
    private readonly opLog: AdminOperationLogService,
  ) {}

  async findAll() {
    const list = await this.categoryRepo.find({
      order: { sort: 'ASC', id: 'ASC' },
    });
    return { list, total: list.length };
  }

  async findOne(id: number) {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException(`菜品分类 ID ${id} 不存在`);
    return category;
  }

  async create(
    ctx: LogContext,
    dto: { name: string; sort?: number; enabled?: number },
  ) {
    await this.ensureNameAvailable(dto.name);
    const saved = await this.categoryRepo.save(this.categoryRepo.create(dto));
    await this.opLog.record(ctx, 'create', 'dishCategory', saved.id, {
      name: saved.name,
    });
    return saved;
  }

  async update(
    ctx: LogContext,
    id: number,
    dto: { name?: string; sort?: number; enabled?: number },
  ) {
    const category = await this.findOne(id);
    if (dto.name && dto.name !== category.name) {
      await this.ensureNameAvailable(dto.name, id);
    }
    Object.assign(category, dto);
    await this.categoryRepo.save(category);
    await this.opLog.record(ctx, 'update', 'dishCategory', id, dto as any);
    return this.findOne(id);
  }

  async remove(ctx: LogContext, id: number) {
    const category = await this.findOne(id);
    const used = await this.dishRepo.count({ where: { categoryId: id } });
    if (used > 0) {
      throw new BadRequestException(
        `该分类下还有 ${used} 个菜品，无法删除，请改为停用`,
      );
    }
    await this.categoryRepo.remove(category);
    await this.opLog.record(ctx, 'delete', 'dishCategory', id, {
      name: category.name,
    });
    return { success: true };
  }

  async setEnabled(ctx: LogContext, id: number, enabled: number) {
    const category = await this.findOne(id);
    const before = category.enabled;
    category.enabled = enabled;
    await this.categoryRepo.save(category);
    await this.opLog.record(ctx, 'status', 'dishCategory', id, {
      from: before,
      to: enabled,
    });
    return this.findOne(id);
  }

  private async ensureNameAvailable(name: string, exceptId?: number) {
    const exists = await this.categoryRepo.findOne({
      where: exceptId ? { name, id: Not(exceptId) } : { name },
    });
    if (exists) throw new ConflictException(`分类「${name}」已存在`);
  }
}
