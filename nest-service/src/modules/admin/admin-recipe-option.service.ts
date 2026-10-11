import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import {
  RecipeOption,
  RecipeOptionType,
} from '../foodie-buddy/recipe-inspiration/entities/recipe-option.entity';
import { AdminOperationLogService, LogContext } from './admin-operation-log.service';

const VALID_TYPES: RecipeOptionType[] = [
  'ingredient',
  'spicy',
  'preference',
  'taboo',
];

/**
 * 后台「灵感菜谱选项」服务。选项不被菜品引用，删除不做占用校验；
 * 同类型下名称唯一，类型创建后不可修改（避免选项在 Tab 间串位）。
 */
@Injectable()
export class AdminRecipeOptionService {
  constructor(
    @InjectRepository(RecipeOption)
    private readonly optionRepo: Repository<RecipeOption>,
    private readonly opLog: AdminOperationLogService,
  ) {}

  async findAll(type?: string) {
    const list = await this.optionRepo.find({
      where: type ? { type: type as RecipeOptionType } : {},
      order: { type: 'ASC', sort: 'ASC', id: 'ASC' },
    });
    return { list, total: list.length };
  }

  private async findOneOrFail(id: number) {
    const option = await this.optionRepo.findOne({ where: { id } });
    if (!option) throw new NotFoundException(`选项 ID ${id} 不存在`);
    return option;
  }

  async create(
    ctx: LogContext,
    dto: { type: RecipeOptionType; name: string; sort?: number; enabled?: number },
  ) {
    if (!VALID_TYPES.includes(dto.type)) {
      throw new ConflictException('选项类型不合法');
    }
    await this.ensureNameAvailable(dto.type, dto.name);
    const saved = await this.optionRepo.save(this.optionRepo.create(dto));
    await this.opLog.record(ctx, 'create', 'recipeOption', saved.id, {
      type: saved.type,
      name: saved.name,
    });
    return saved;
  }

  async update(
    ctx: LogContext,
    id: number,
    dto: { name?: string; sort?: number; enabled?: number },
  ) {
    const option = await this.findOneOrFail(id);
    if (dto.name && dto.name !== option.name) {
      await this.ensureNameAvailable(option.type, dto.name, id);
    }
    Object.assign(option, dto);
    await this.optionRepo.save(option);
    await this.opLog.record(ctx, 'update', 'recipeOption', id, dto as any);
    return this.findOneOrFail(id);
  }

  async remove(ctx: LogContext, id: number) {
    const option = await this.findOneOrFail(id);
    await this.optionRepo.remove(option);
    await this.opLog.record(ctx, 'delete', 'recipeOption', id, {
      type: option.type,
      name: option.name,
    });
    return { success: true };
  }

  async setEnabled(ctx: LogContext, id: number, enabled: number) {
    const option = await this.findOneOrFail(id);
    const before = option.enabled;
    option.enabled = enabled;
    await this.optionRepo.save(option);
    await this.opLog.record(ctx, 'status', 'recipeOption', id, {
      from: before,
      to: enabled,
    });
    return this.findOneOrFail(id);
  }

  private async ensureNameAvailable(
    type: RecipeOptionType,
    name: string,
    exceptId?: number,
  ) {
    const exists = await this.optionRepo.findOne({
      where: exceptId
        ? { type, name, id: Not(exceptId) }
        : { type, name },
    });
    if (exists) {
      throw new ConflictException(`该类型下已存在选项「${name}」`);
    }
  }
}
