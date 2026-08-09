import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository } from 'typeorm';
import { Dish } from '../foodie-buddy/dish/entities/dish.entity';
import { DishCategory } from '../foodie-buddy/dish/entities/dish-category.entity';
import { User } from '../foodie-buddy/user/entities/user.entity';
import { CreateDishDto } from '../foodie-buddy/dish/dto/create-dish.dto';
import { UpdateDishDto } from '../foodie-buddy/dish/dto/update-dish.dto';
import { AdminListQueryDto } from './dto/admin-list-query.dto';
import { AdminOperationLogService, LogContext } from './admin-operation-log.service';

/**
 * 后台菜品服务。
 * 与 mobile DishService 的关键差异：
 * - 允许跨用户/跨分组查询，不做 group membership 校验。
 * - list 附带 user.nickname、支持 status 与 categoryId 过滤。
 * - 单独提供 setStatus 用于上/下架。
 */
@Injectable()
export class AdminDishService {
  constructor(
    @InjectRepository(Dish)
    private readonly dishRepo: Repository<Dish>,
    @InjectRepository(DishCategory)
    private readonly categoryRepo: Repository<DishCategory>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly opLog: AdminOperationLogService,
  ) {}

  async findAll(
    query: AdminListQueryDto & {
      categoryId?: number;
      status?: number;
      groupId?: number;
    },
  ) {
    const { page, pageSize, userId, keyword, categoryId, status, groupId } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (userId) where.userId = userId;
    if (keyword) where.name = Like(`%${keyword}%`);
    if (categoryId) where.categoryId = categoryId;
    if (status !== undefined) where.status = status;
    if (groupId) where.groupId = groupId;

    const [rows, total] = await this.dishRepo.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    const users = await this.loadUserMap(rows.map((r) => r.userId));
    const categories = await this.loadCategoryMap(rows.map((r) => r.categoryId));

    return {
      list: rows.map((r) => ({
        ...r,
        userNickname: users.get(r.userId)?.nickname ?? users.get(r.userId)?.name ?? null,
        categoryName: r.categoryId ? categories.get(r.categoryId)?.name ?? null : null,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number) {
    const dish = await this.dishRepo.findOne({ where: { id } });
    if (!dish) throw new NotFoundException(`菜品 ID ${id} 不存在`);
    const user = await this.userRepo.findOne({ where: { id: dish.userId } });
    const category = dish.categoryId
      ? await this.categoryRepo.findOne({ where: { id: dish.categoryId } })
      : null;
    return {
      ...dish,
      userNickname: user?.nickname ?? user?.name ?? null,
      categoryName: category?.name ?? null,
    };
  }

  async create(ctx: LogContext, dto: CreateDishDto) {
    const saved = await this.dishRepo.save(this.dishRepo.create(dto));
    await this.opLog.record(ctx, 'create', 'dish', saved.id, { name: saved.name });
    return this.findOne(saved.id);
  }

  async update(ctx: LogContext, id: number, dto: UpdateDishDto) {
    const dish = await this.dishRepo.findOne({ where: { id } });
    if (!dish) throw new NotFoundException(`菜品 ID ${id} 不存在`);
    Object.assign(dish, dto);
    await this.dishRepo.save(dish);
    await this.opLog.record(ctx, 'update', 'dish', id, dto as any);
    return this.findOne(id);
  }

  async remove(ctx: LogContext, id: number) {
    const dish = await this.dishRepo.findOne({ where: { id } });
    if (!dish) throw new NotFoundException(`菜品 ID ${id} 不存在`);
    await this.dishRepo.remove(dish);
    await this.opLog.record(ctx, 'delete', 'dish', id, { name: dish.name });
    return { success: true };
  }

  async setStatus(ctx: LogContext, id: number, status: number) {
    const dish = await this.dishRepo.findOne({ where: { id } });
    if (!dish) throw new NotFoundException(`菜品 ID ${id} 不存在`);
    const before = dish.status;
    dish.status = status;
    await this.dishRepo.save(dish);
    await this.opLog.record(ctx, 'status', 'dish', id, { from: before, to: status });
    return this.findOne(id);
  }

  private async loadUserMap(userIds: number[]) {
    const uniq = Array.from(new Set(userIds)).filter(Boolean);
    if (uniq.length === 0) return new Map<number, User>();
    const users = await this.userRepo.find({ where: { id: In(uniq) } });
    return new Map(users.map((u) => [u.id, u]));
  }

  private async loadCategoryMap(categoryIds: Array<number | null>) {
    const uniq = Array.from(new Set(categoryIds)).filter(
      (id): id is number => !!id,
    );
    if (uniq.length === 0) return new Map<number, DishCategory>();
    const rows = await this.categoryRepo.find({ where: { id: In(uniq) } });
    return new Map(rows.map((c) => [c.id, c]));
  }
}
