import { Inject, Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import type { Runnable } from '@langchain/core/runnables';
import { JsonOutputParser } from '@langchain/core/output_parsers';

export interface RecipeIngredient {
  name: string;
  amount: string;
}

/**
 * 流式过程中的中间结果：字段与数组元素都可能只补全了一半。
 * 最终帧才保证 ingredients / steps 齐全。
 */
export interface RecipePartial {
  ingredients?: Partial<RecipeIngredient>[];
  steps?: string[];
}

// 提示词里的 JSON 花括号需写成 {{ }}，否则会被模板引擎当成变量占位符
const SYSTEM_PROMPT = `你是一位经验丰富的中餐厨师，擅长把一道菜拆解成清晰、可执行的家常做法。

用户会给出一个菜名，你需要输出这道菜的用料清单和烹饪步骤。

要求：
1. 用料按家庭 2-3 人份给出，每项都要有具体、可称量的用量（如 500g、2勺、3片），不要写"适量"。
2. 用料数量控制在 4-12 项，主料在前、辅料调料在后。
3. 步骤 4-8 步，每步一句话说清动作、火候和时间（如"中火煎 3 分钟至两面金黄"），不要写步骤序号。
4. 只输出这道菜真实的做法。如果菜名无法辨认或不是一道菜，ingredients 和 steps 都返回空数组。

只输出 JSON，不要 markdown 代码块，不要任何解释文字。格式：
{{
  "ingredients": [{{ "name": "五花肉", "amount": "500g" }}],
  "steps": ["五花肉洗净切成 2cm 见方的块", "冷水下锅加姜片焯 3 分钟后捞出冲净"]
}}`;

const CALORIES_SYSTEM_PROMPT = `你是一位营养师，擅长根据菜名和用料清单估算这道菜的热量。

要求：
1. 用料清单是家庭 2-3 人份，先估算整道菜的总热量，再按 3 人份折算出**每人份**热量。
2. 只计算用料里出现的食材，注意烹饪方式带来的用油量。用量写「适量」「少许」的按家常做法的常见用量估。
3. 结果取整数，单位千卡。
4. 如果用料无法辨认，返回 0。

只输出 JSON，不要 markdown 代码块，不要任何解释文字。格式：
{{ "calories": 620 }}`;

@Injectable()
export class AiService {
  private readonly recipeChain: Runnable<{ name: string }, RecipePartial> | null;
  private readonly caloriesChain: Runnable<
    { name: string; ingredients: string },
    { calories?: unknown }
  > | null;

  constructor(@Inject('CHAT_MODEL') model: ChatOpenAI | null) {
    if (!model) {
      this.recipeChain = null;
      this.caloriesChain = null;
      return;
    }
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', SYSTEM_PROMPT],
      ['human', '菜名：{name}'],
    ]);
    // JsonOutputParser 是累积式解析器：流式时每个 chunk 都吐出"当前已补全"的对象，
    // 因此前端可以直接拿它做渐进渲染，无需等完整 JSON。
    this.recipeChain = prompt.pipe(model).pipe(new JsonOutputParser());

    const caloriesPrompt = ChatPromptTemplate.fromMessages([
      ['system', CALORIES_SYSTEM_PROMPT],
      ['human', '菜名：{name}\n用料：{ingredients}'],
    ]);
    this.caloriesChain = caloriesPrompt.pipe(model).pipe(new JsonOutputParser());
  }

  async *streamRecipe(name: string): AsyncGenerator<RecipePartial> {
    if (!this.recipeChain) {
      throw new Error('AI 模型未配置，请检查 OPENAI_API_KEY');
    }
    const stream = await this.recipeChain.stream({ name });
    for await (const partial of stream) {
      yield partial;
    }
  }

  /** 估算每人份热量（千卡）。返回 0 表示估不出来，由调用方决定是否落库。 */
  async estimateCalories(
    name: string,
    ingredients: Array<{ name: string; amount?: string }>,
  ): Promise<number> {
    if (!this.caloriesChain) {
      throw new Error('AI 模型未配置，请检查 OPENAI_API_KEY');
    }
    const result = await this.caloriesChain.invoke({
      name,
      ingredients: ingredients
        .map((item) => `${item.name} ${item.amount || ''}`.trim())
        .join('、'),
    });
    // 模型偶尔会返回 "620 千卡" 这类字符串，parseFloat 能取到前缀数字
    const calories = Math.round(parseFloat(String(result?.calories)));
    return Number.isFinite(calories) && calories > 0 ? calories : 0;
  }
}
