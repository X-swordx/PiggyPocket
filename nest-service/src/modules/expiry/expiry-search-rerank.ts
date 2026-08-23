import { ExpiryItem } from "./entities/expiry-item.entity";
import { buildSearchText } from "./expiry-labels";

/** 重排用的模型注入 token，温度 0，与生成菜谱的 CHAT_MODEL 分开 */
export const RERANK_MODEL = "RERANK_MODEL";

/** 交给模型筛选的候选条数。保持 top-10，靠优化召回文本把真命中顶进前 10。 */
export const RERANK_TOP_K = 10;

/**
 * 语义搜索的重排提示词。向量检索负责召回（评测集上召回@10 = 99%），
 * 由模型负责决定「取哪几条」——正确的结果条数随 query 变化（搜「防晒」是 1 条，
 * 搜「炒菜的调料」是 6 条），这个信息不在相似度分布里，统计阈值拿不到。
 */
export const RERANK_SYSTEM_PROMPT = `你是家庭物品搜索的筛选器。用户在自己家的物品清单里搜索，我会给你按相似度排好序的候选物品，你要判断哪些是用户真正想找的。

判断标准：
1. 只看物品名称和备注是否与查询直接相关，不要只因为「同一大类」就选。
2. 必须排除：
   - 搜「防晒」不要给面膜、卸妆水；
   - 搜「洗头发」不要给沐浴露；
   - 搜「护肤品」不要给口红、粉底等彩妆；
   - 搜「保险」不要给证件、会员卡；
   - 搜「会员卡」不要给保险、证件。
3. 用户想找一类东西时，把这一类里所有直接符合的都选上（搜「炒菜的调料」要给酱油、醋、蚝油、油、糖、酱）。
4. 候选是按相似度排序的，排在前面不代表相关。如果用户查的东西跟这些物品都不沾边（比如查天气、查房贷利率、查机票），返回空数组。
5. 不要凑数，不确定就排除。

只输出 JSON，不要 markdown 代码块，不要解释文字。格式：{"ids": [1, 3]}`;

export type RerankCandidate = Pick<
  ExpiryItem,
  "name" | "category" | "storage" | "notes"
>;

/** 候选清单用和入库时相同的文本，避免两边描述不一致。 */
export const buildRerankInput = (
  keyword: string,
  candidates: RerankCandidate[]
): string =>
  `查询：${keyword}\n候选：\n` +
  candidates
    .map(
      (item, index) => `${index + 1}. ${buildSearchText(item as ExpiryItem)}`
    )
    .join("\n");

/**
 * 解析模型返回的编号。模型可能带 markdown 围栏或多余文字，
 * 解析失败返回 null，调用方据此回退到统计阈值。
 */
export const parseRerankIds = (raw: string, count: number): number[] | null => {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as { ids?: unknown };
    if (!Array.isArray(parsed.ids)) return null;
    return parsed.ids
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id >= 1 && id <= count)
      .map((id) => id - 1);
  } catch {
    return null;
  }
};
