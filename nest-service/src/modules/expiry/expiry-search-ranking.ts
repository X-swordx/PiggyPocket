export interface RankedHit {
  id: number;
  score: number;
}

/**
 * 小样本兜底用的绝对/相对门槛。物品少于 MIN_SAMPLE 时统计量没有意义，
 * 只能退回这两个常量——它们是在 3 条数据上实测拟合的，并不可靠。
 */
const MIN_SCORE = 0.32;
const SCORE_RATIO = 0.85;
const MIN_SAMPLE = 5;

/**
 * 离群门槛：命中要比「一群陪跑的」高出 OUTLIER_Z 个稳健标准差。
 * 用 MAD（中位数绝对偏差）而不是 std，因为 std 会被真正的命中自己抬高；
 * MAD 在异常点少于半数时几乎不受影响，所以「搜药，家里 10 种药」也能全部返回。
 *
 * 3 是在 22 条评测 query × 24 件物品上扫出来的（`npm run eval:search -- --sweep`），
 * 2.75~3.25 是同一个平台期，取中值；再往上召回掉得很快。
 */
const OUTLIER_Z = 3;
/** MAD → σ 的换算系数，正态分布下 σ ≈ 1.4826 × MAD。 */
const MAD_SCALE = 1.4826;

const median = (sorted: number[]): number => {
  const mid = sorted.length >> 1;
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
};

/** 只给评测脚本扫参数用，线上一律走默认值。 */
export interface SelectOptions {
  outlierZ?: number;
  minScore?: number;
  scoreRatio?: number;
}

const absoluteCut = (
  sorted: RankedHit[],
  topK: number,
  options: SelectOptions,
): RankedHit[] => {
  const cutoff = Math.max(
    options.minScore ?? MIN_SCORE,
    sorted[0].score * (options.scoreRatio ?? SCORE_RATIO),
  );
  return sorted.filter((hit) => hit.score >= cutoff).slice(0, topK);
};

/**
 * 从向量检索结果里挑出真正算命中的部分。
 *
 * 不用绝对分数阈值，因为 doubao-embedding-vision 的相似度基线随 query 漂移
 * （无关的中文文本对也有 0.2~0.38），不存在一个跨 query 通用的数值：搜「感冒药」
 * 命中布洛芬只有 0.349，搜「房贷利率」牛奶却能到 0.377。所以改成在用户自己的
 * 物品分数分布里做离群检测——判断依据是「这一条比其他东西显著更像」，
 * 而不是「这一条的分数够高」。
 *
 * 已知局限（数字来自 `npm run eval:search`，22 条 query / 24 件物品，通过 12/22）：
 * - 传入的 hits 少于 MIN_SAMPLE 条时退回绝对阈值，此时假阳性依然存在。
 * - 「枢纽物品」会抢占第一名：名字短、没备注的物品（评测里是「鸡蛋」）跨 query 平均
 *   相似度 0.392，而「海天老抽酱油」只有 0.254，导致搜「调料」时鸡蛋反而排第一。
 *   实测减掉每个物品的背景均值后可以到 18/22，但那需要给物品存一列背景分。
 * - 整个分类都被命中时（搜「感冒药」，6 件药都在 0.455~0.499）分布本身被抬宽，
 *   MAD 变大、门槛跟着涨到 0.68，结果一条都不返回。
 * - 调用方给的检索宽度截断了分数分布时（物品数 > 检索宽度），中位数会偏高、召回偏保守。
 */
export const selectHits = (
  hits: RankedHit[],
  topK: number,
  options: SelectOptions = {},
): RankedHit[] => {
  if (!hits.length) return [];
  const sorted = [...hits].sort((a, b) => b.score - a.score);
  if (sorted.length < MIN_SAMPLE) return absoluteCut(sorted, topK, options);

  const ascending = sorted.map((hit) => hit.score).sort((a, b) => a - b);
  const med = median(ascending);
  const mad = median(
    ascending.map((score) => Math.abs(score - med)).sort((a, b) => a - b),
  );
  // 分数全都一样（MAD=0）说明分布退化，离群检测无从下手
  if (mad === 0) return absoluteCut(sorted, topK, options);

  const cutoff = med + (options.outlierZ ?? OUTLIER_Z) * MAD_SCALE * mad;
  return sorted.filter((hit) => hit.score >= cutoff).slice(0, topK);
};
