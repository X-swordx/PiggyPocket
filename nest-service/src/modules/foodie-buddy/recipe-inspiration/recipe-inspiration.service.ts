import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import type { Runnable } from '@langchain/core/runnables';
import {
  RecipeOption,
  RecipeOptionType,
} from './entities/recipe-option.entity';
import { GenerateRecipesDto } from './dto/generate-recipes.dto';
import { SaveInspirationDto } from './dto/save-inspiration.dto';
import { Dish } from '../dish/entities/dish.entity';
import { DiningGroupMember } from '../dining-group/entities/dining-group-member.entity';

export interface InspiredDish {
  name: string;
  reason?: string;
  description?: string;
  cookingTime?: string;
  ingredients: Array<{ name: string; amount: string }>;
  steps: string[];
}

export interface RecipeOptionGroups {
  ingredient: string[];
  spicy: string[];
  preference: string[];
  taboo: string[];
}

const OPTION_TYPES: RecipeOptionType[] = [
  'ingredient',
  'spicy',
  'preference',
  'taboo',
];

// 小程序菜品卡片的同一套配色
const BG_COLORS = ['#a8d5ba', '#e67e22', '#27ae60', '#f0b7a4', '#8aa6cb', '#a88fca'];

// 提示词里的 JSON 花括号需写成 {{ }}，否则会被模板引擎当成变量占位符
const SYSTEM_PROMPT = `你是一位擅长家常菜搭配的中餐厨师。用户会告诉你手头现有的食材、用餐人数、辣度、口味偏好、忌口和备注，请推荐 3 道适合现在做的家常菜。

要求：
1. 正好推荐 3 道菜，优先使用用户手头的食材，允许补充常见的家常食材和调料，注意荤素和口感搭配。
2. 每道菜的用料按给出的用餐人数给具体、可称量的用量（如 300g、2 勺、3 片），不要写"适量"，用料 4-12 项。
3. 辣度必须符合用户选择；严格避开用户列出的所有忌口食材及相关菜品。
4. 步骤 4-8 步，每步一句话说清动作、火候和时间，不要写步骤序号。
5. reason 用一句话说明为什么推荐这道菜（点到用到的手头食材或偏好）。

只输出 JSON，不要 markdown 代码块，不要任何解释文字。格式：
{{
  "dishes": [
    {{
      "name": "番茄炒蛋",
      "reason": "番茄和鸡蛋手头都有，快手下饭",
      "description": "家常酸甜开胃菜",
      "cookingTime": "15分钟",
      "ingredients": [{{ "name": "番茄", "amount": "300g" }}],
      "steps": ["番茄切块、鸡蛋打散", "热油先把鸡蛋炒散盛出"]
    }}
  ]
}}`;

@Injectable()
export class RecipeInspirationService {
  private readonly chain: Runnable<Record<string, string>, unknown> | null;

  constructor(
    @InjectRepository(RecipeOption)
    private readonly optionRepository: Repository<RecipeOption>,
    @InjectRepository(Dish)
    private readonly dishRepository: Repository<Dish>,
    @InjectRepository(DiningGroupMember)
    private readonly memberRepository: Repository<DiningGroupMember>,
    @Inject('INSPIRE_CHAT_MODEL')
    private readonly chatModel: ChatOpenAI | null,
  ) {
    if (!chatModel) {
      this.chain = null;
      return;
    }
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', SYSTEM_PROMPT],
      ['human', '{input}'],
    ]);
    this.chain = prompt.pipe(chatModel).pipe(new JsonOutputParser());
  }

  /** 小程序端只取启用中的选项，按类型分组返回名称列表。 */
  async findOptions(): Promise<RecipeOptionGroups> {
    const options = await this.optionRepository.find({
      where: { enabled: 1, type: In(OPTION_TYPES) },
      order: { sort: 'ASC', id: 'ASC' },
    });
    const groups: RecipeOptionGroups = {
      ingredient: [],
      spicy: [],
      preference: [],
      taboo: [],
    };
    for (const option of options) {
      groups[option.type]?.push(option.name);
    }
    return groups;
  }

  async generate(dto: GenerateRecipesDto): Promise<{ dishes: InspiredDish[] }> {
    if (!this.chain) {
      throw new BadRequestException('灵感菜谱暂时不可用，请稍后再试');
    }

    const result = await this.chain.invoke({ input: this.buildInput(dto) });
    const rawDishes = Array.isArray((result as any)?.dishes)
      ? (result as any).dishes
      : [];
    const dishes = rawDishes
      .map((raw) => this.normalizeDish(raw))
      .filter((dish): dish is InspiredDish => dish !== null)
      .slice(0, 3);

    if (dishes.length === 0) {
      throw new BadRequestException('没有生成合适的菜品，请调整食材后重试');
    }
    return { dishes };
  }

  /** 勾选的推荐菜批量加入指定饭搭子组的菜谱（菜品库）。 */
  async save(dto: SaveInspirationDto): Promise<{ count: number }> {
    const member = await this.memberRepository.findOne({
      where: { userId: dto.userId, groupId: dto.groupId },
    });
    if (!member) {
      throw new BadRequestException('用户不在该饭搭子组内，无法加入菜谱');
    }

    const entities = dto.dishes.map((dish, index) =>
      this.dishRepository.create({
        name: dish.name,
        description: dish.description ?? null,
        categoryId: null,
        image: null,
        status: 1,
        cookingTime: dish.cookingTime ?? null,
        ingredients: dish.ingredients?.length ? dish.ingredients : null,
        steps: dish.steps?.length ? dish.steps : null,
        bgColor: BG_COLORS[index % BG_COLORS.length],
        userId: dto.userId,
        groupId: dto.groupId,
      }),
    );
    await this.dishRepository.save(entities);
    return { count: entities.length };
  }

  private buildInput(dto: GenerateRecipesDto): string {
    const lines = [
      `手头食材：${dto.ingredients.join('、')}`,
      `用餐人数：${dto.people ?? 2} 人`,
    ];
    if (dto.spicy) lines.push(`辣度：${dto.spicy}`);
    if (dto.preferences?.length) lines.push(`口味偏好：${dto.preferences.join('、')}`);
    if (dto.taboos?.length) lines.push(`忌口（必须避开）：${dto.taboos.join('、')}`);
    if (dto.notes) lines.push(`备注：${dto.notes}`);
    return lines.join('\n');
  }

  /** 模型输出不可信，逐字段清洗；没有合法菜名的直接丢弃。 */
  private normalizeDish(raw: any): InspiredDish | null {
    if (!raw || typeof raw !== 'object') return null;
    const name = this.cleanString(raw.name, 100);
    if (!name) return null;

    const ingredients = Array.isArray(raw.ingredients)
      ? raw.ingredients
          .map((item: any) => {
            if (!item || typeof item !== 'object') return null;
            const ingName = this.cleanString(item.name, 50);
            if (!ingName) return null;
            return { name: ingName, amount: this.cleanString(item.amount, 50) || '适量' };
          })
          .filter((item): item is { name: string; amount: string } => item !== null)
          .slice(0, 12)
      : [];

    const steps = Array.isArray(raw.steps)
      ? raw.steps
          .map((step: unknown) => this.cleanString(step, 500))
          .filter((step): step is string => !!step)
          .slice(0, 8)
      : [];

    return {
      name,
      reason: this.cleanString(raw.reason, 200) || undefined,
      description: this.cleanString(raw.description, 200) || undefined,
      cookingTime: this.cleanString(raw.cookingTime, 50) || undefined,
      ingredients,
      steps,
    };
  }

  private cleanString(value: unknown, maxLength: number): string {
    if (typeof value !== 'string') return '';
    return value.trim().slice(0, maxLength);
  }
}
