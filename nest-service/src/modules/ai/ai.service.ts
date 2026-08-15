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

@Injectable()
export class AiService {
  private readonly recipeChain: Runnable<{ name: string }, RecipePartial> | null;

  constructor(@Inject('CHAT_MODEL') model: ChatOpenAI | null) {
    if (!model) {
      this.recipeChain = null;
      return;
    }
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', SYSTEM_PROMPT],
      ['human', '菜名：{name}'],
    ]);
    // JsonOutputParser 是累积式解析器：流式时每个 chunk 都吐出"当前已补全"的对象，
    // 因此前端可以直接拿它做渐进渲染，无需等完整 JSON。
    this.recipeChain = prompt.pipe(model).pipe(new JsonOutputParser());
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
}
