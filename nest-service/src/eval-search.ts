import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { NestFactory } from "@nestjs/core";
import { ChatOpenAI } from "@langchain/openai";
import { AppModule } from "./app.module";
import { ItemVectorService } from "./modules/vector/item-vector.service";
import { buildSearchText } from "./modules/expiry/expiry-labels";
import {
  selectHits,
  SelectOptions,
} from "./modules/expiry/expiry-search-ranking";
import {
  RERANK_SYSTEM_PROMPT,
  RERANK_TOP_K,
  buildRerankInput,
  parseRerankIds,
} from "./modules/expiry/expiry-search-rerank";
import { ExpiryItem } from "./modules/expiry/entities/expiry-item.entity";

/**
 * 语义搜索评测集。改阈值/换 embedding 模型后跑一遍，用同一批 query 对比指标，
 * 避免在两三条真实数据上拟合噪音。
 *
 * 用法：
 *   npm run eval:search                联网跑：灌入物品 → 逐条检索 → 存分数矩阵 → 出指标
 *   npm run eval:search -- --offline    用上次存的矩阵重算，不调 API（改阈值时用这个）
 *   npm run eval:search -- --sweep      离线扫 outlierZ
 *   npm run eval:search -- --rerank     额外跑一遍大模型重排（可加 --topK=20 改候选数）
 *   npm run eval:search -- --cases      逐条打印明细
 *
 * 只走向量库，不写 MySQL：物品用一个虚拟 userId 临时灌进 Milvus，跑完删掉。
 */
const EVAL_USER_ID = 999001;
/** 与真实物品 id 隔开，避免误删用户数据 */
const ID_BASE = 900001;
const TOP_K = 10;
const DISTRIBUTION_LIMIT = 200;
const SCORE_FILE = path.join(__dirname, "..", "eval-search-scores.json");

interface Fixture {
  name: string;
  category: string;
  storage: string;
  notes: string;
}

/** 一个「东西比较多」的家庭：63 件，覆盖全部分类，同类内部有近似项 */
const FIXTURES: Fixture[] = [
  { name: "蒙牛纯牛奶", category: "food", storage: "fridge", notes: "" },
  { name: "光明低脂牛奶", category: "food", storage: "fridge", notes: "" },
  { name: "安慕希酸奶", category: "food", storage: "fridge", notes: "" },
  { name: "芝士片", category: "food", storage: "fridge", notes: "" },
  { name: "鸡蛋", category: "food", storage: "fridge", notes: "" },
  { name: "双汇火腿肠", category: "food", storage: "fridge", notes: "" },
  { name: "生菜", category: "food", storage: "fridge", notes: "" },
  { name: "西红柿", category: "food", storage: "fridge", notes: "" },
  { name: "嫩豆腐", category: "food", storage: "fridge", notes: "" },
  {
    name: "剩饭剩菜",
    category: "food",
    storage: "fridge",
    notes: "昨天的红烧肉",
  },
  {
    name: "冷冻牛肉卷",
    category: "food",
    storage: "freezer",
    notes: "涮火锅用",
  },
  { name: "冷冻虾仁", category: "food", storage: "freezer", notes: "" },
  { name: "三全速冻饺子", category: "food", storage: "freezer", notes: "" },
  { name: "湾仔码头小笼包", category: "food", storage: "freezer", notes: "" },
  { name: "哈根达斯冰淇淋", category: "food", storage: "freezer", notes: "" },
  { name: "五常大米", category: "food", storage: "pantry", notes: "" },
  { name: "龙须挂面", category: "food", storage: "pantry", notes: "" },
  { name: "海天老抽酱油", category: "food", storage: "pantry", notes: "" },
  { name: "海天生抽", category: "food", storage: "pantry", notes: "" },
  { name: "李锦记蚝油", category: "food", storage: "pantry", notes: "" },
  { name: "米醋", category: "food", storage: "pantry", notes: "" },
  { name: "金龙鱼花生油", category: "food", storage: "pantry", notes: "" },
  { name: "白砂糖", category: "food", storage: "pantry", notes: "" },
  { name: "奥利奥饼干", category: "food", storage: "pantry", notes: "" },
  { name: "乐事薯片", category: "food", storage: "pantry", notes: "" },
  { name: "立顿红茶包", category: "food", storage: "pantry", notes: "" },
  { name: "雀巢咖啡粉", category: "food", storage: "pantry", notes: "" },
  { name: "土蜂蜜", category: "food", storage: "pantry", notes: "" },
  {
    name: "爱他美婴儿奶粉",
    category: "food",
    storage: "pantry",
    notes: "一段",
  },
  { name: "皇家猫粮", category: "pet", storage: "pantry", notes: "" },
  { name: "希宝猫罐头", category: "pet", storage: "pantry", notes: "" },
  { name: "猫用驱虫滴剂", category: "pet", storage: "other", notes: "" },
  {
    name: "布洛芬缓释胶囊",
    category: "medicine",
    storage: "cabinet",
    notes: "头痛发烧时吃",
  },
  { name: "感冒灵颗粒", category: "medicine", storage: "cabinet", notes: "" },
  {
    name: "蒙脱石散",
    category: "medicine",
    storage: "cabinet",
    notes: "拉肚子用",
  },
  {
    name: "阿莫西林胶囊",
    category: "medicine",
    storage: "cabinet",
    notes: "消炎",
  },
  {
    name: "云南白药气雾剂",
    category: "medicine",
    storage: "cabinet",
    notes: "跌打损伤",
  },
  { name: "创可贴", category: "medicine", storage: "cabinet", notes: "" },
  { name: "碘伏消毒液", category: "medicine", storage: "cabinet", notes: "" },
  { name: "维生素C片", category: "medicine", storage: "cabinet", notes: "" },
  { name: "开塞露", category: "medicine", storage: "cabinet", notes: "" },
  { name: "退热贴", category: "medicine", storage: "cabinet", notes: "" },
  {
    name: "珍视明眼药水",
    category: "medicine",
    storage: "cabinet",
    notes: "缓解干涩",
  },
  {
    name: "雅诗兰黛小棕瓶",
    category: "cosmetic",
    storage: "other",
    notes: "晚上用的精华",
  },
  {
    name: "安耐晒防晒霜",
    category: "cosmetic",
    storage: "other",
    notes: "SPF50",
  },
  { name: "补水面膜", category: "cosmetic", storage: "other", notes: "" },
  { name: "兰蔻粉水", category: "cosmetic", storage: "other", notes: "化妆水" },
  { name: "MAC口红", category: "cosmetic", storage: "other", notes: "" },
  { name: "卸妆水", category: "cosmetic", storage: "other", notes: "" },
  { name: "云南白药牙膏", category: "daily", storage: "other", notes: "" },
  { name: "海飞丝洗发水", category: "daily", storage: "other", notes: "" },
  { name: "多芬沐浴露", category: "daily", storage: "other", notes: "" },
  { name: "蓝月亮洗衣液", category: "daily", storage: "other", notes: "" },
  { name: "隐形眼镜护理液", category: "daily", storage: "other", notes: "" },
  { name: "维达湿纸巾", category: "daily", storage: "other", notes: "" },
  { name: "雷达蚊香液", category: "daily", storage: "other", notes: "" },
  { name: "医用酒精", category: "daily", storage: "other", notes: "消毒用" },
  { name: "净水器滤芯", category: "consumable", storage: "other", notes: "" },
  {
    name: "空气净化器滤网",
    category: "consumable",
    storage: "other",
    notes: "",
  },
  { name: "吸尘器滤芯", category: "consumable", storage: "other", notes: "" },
  { name: "健身房年卡", category: "card", storage: "other", notes: "" },
  { name: "视频网站会员", category: "card", storage: "other", notes: "" },
  { name: "港澳通行证", category: "document", storage: "other", notes: "" },
  { name: "车险保单", category: "document", storage: "other", notes: "" },
];

interface Case {
  query: string;
  /** 期望命中的物品名，空数组表示应该返回空 */
  expect: string[];
}

const CASES: Case[] = [
  { query: "感冒药", expect: ["感冒灵颗粒", "布洛芬缓释胶囊"] },
  { query: "退烧用什么", expect: ["布洛芬缓释胶囊", "退热贴"] },
  { query: "拉肚子", expect: ["蒙脱石散"] },
  { query: "消炎药", expect: ["阿莫西林胶囊"] },
  { query: "摔伤了用什么", expect: ["云南白药气雾剂", "创可贴", "碘伏消毒液"] },
  { query: "伤口消毒", expect: ["碘伏消毒液", "医用酒精"] },
  { query: "眼睛干涩", expect: ["珍视明眼药水"] },
  { query: "隐形眼镜", expect: ["隐形眼镜护理液"] },
  { query: "牛奶", expect: ["蒙牛纯牛奶", "光明低脂牛奶"] },
  {
    query: "乳制品",
    expect: ["蒙牛纯牛奶", "光明低脂牛奶", "安慕希酸奶", "芝士片"],
  },
  { query: "冰箱冷冻的海鲜和肉", expect: ["冷冻牛肉卷", "冷冻虾仁"] },
  { query: "速冻的面食", expect: ["三全速冻饺子", "湾仔码头小笼包"] },
  { query: "零食甜点", expect: ["哈根达斯冰淇淋", "奥利奥饼干", "乐事薯片"] },
  { query: "主食", expect: ["五常大米", "龙须挂面"] },
  {
    query: "炒菜的调料",
    expect: [
      "海天老抽酱油",
      "海天生抽",
      "李锦记蚝油",
      "米醋",
      "金龙鱼花生油",
      "白砂糖",
    ],
  },
  { query: "冲咖啡", expect: ["雀巢咖啡粉"] },
  { query: "蔬菜", expect: ["生菜", "西红柿"] },
  { query: "豆制品", expect: ["嫩豆腐"] },
  { query: "昨天的剩菜", expect: ["剩饭剩菜"] },
  { query: "宠物吃的", expect: ["皇家猫粮", "希宝猫罐头"] },
  { query: "猫用的", expect: ["皇家猫粮", "希宝猫罐头", "猫用驱虫滴剂"] },
  { query: "宝宝喝的", expect: ["爱他美婴儿奶粉"] },
  {
    query: "护肤品",
    expect: [
      "雅诗兰黛小棕瓶",
      "安耐晒防晒霜",
      "补水面膜",
      "兰蔻粉水",
      "卸妆水",
    ],
  },
  { query: "防晒", expect: ["安耐晒防晒霜"] },
  { query: "洗头发", expect: ["海飞丝洗发水"] },
  { query: "刷牙", expect: ["云南白药牙膏"] },
  { query: "洗衣服", expect: ["蓝月亮洗衣液"] },
  { query: "洗澡用的", expect: ["多芬沐浴露"] },
  { query: "驱蚊", expect: ["雷达蚊香液"] },
  {
    query: "该换的滤芯",
    expect: ["净水器滤芯", "空气净化器滤网", "吸尘器滤芯"],
  },
  { query: "会员卡", expect: ["健身房年卡", "视频网站会员"] },
  { query: "保险", expect: ["车险保单"] },
  { query: "出境需要的证件", expect: ["港澳通行证"] },
  { query: "房贷利率", expect: [] },
  { query: "明天天气怎么样", expect: [] },
  { query: "出差订机票", expect: [] },
  { query: "比特币行情", expect: [] },
  { query: "孩子的数学作业", expect: [] },
  { query: "附近有什么好吃的餐厅", expect: [] },
  { query: "微信怎么改昵称", expect: [] },
  { query: "世界杯什么时候开始", expect: [] },
  { query: "股票怎么开户", expect: [] },
];

/** query -> 每个物品的相似度，联网跑一次存盘，之后离线复用 */
type ScoreMatrix = Array<{ query: string; scores: Array<[string, number]> }>;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const capture = async (): Promise<ScoreMatrix> => {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["warn", "error"],
  });
  const vectorService = app.get(ItemVectorService, { strict: false });

  if (!vectorService.enabled) {
    await app.close();
    throw new Error("向量检索不可用（未配置 Milvus / embedding），无法评测");
  }

  const nameById = new Map<number, string>();
  const items = FIXTURES.map((fixture, index) => {
    const id = ID_BASE + index;
    nameById.set(id, fixture.name);
    return {
      id,
      userId: EVAL_USER_ID,
      text: buildSearchText(fixture as ExpiryItem),
    };
  });

  try {
    console.log(`灌入 ${items.length} 条评测物品...`);
    const written = await vectorService.upsertMany(items);
    if (written !== items.length) throw new Error("评测物品写入失败");

    // Zilliz serverless 写入到可检索有延迟，轮询到全部可见再开始
    for (let attempt = 1; ; attempt += 1) {
      const probe = await vectorService.search(
        EVAL_USER_ID,
        "牛奶",
        DISTRIBUTION_LIMIT
      );
      if (probe && probe.length === items.length) break;
      if (attempt >= 20) {
        throw new Error(
          `等待索引可见超时，只看到 ${probe?.length ?? 0}/${items.length} 条`
        );
      }
      await sleep(2000);
    }

    const matrix: ScoreMatrix = [];
    for (const testCase of CASES) {
      const hits =
        (await vectorService.search(
          EVAL_USER_ID,
          testCase.query,
          DISTRIBUTION_LIMIT
        )) ?? [];
      matrix.push({
        query: testCase.query,
        scores: hits.map((hit) => [
          nameById.get(hit.id) ?? String(hit.id),
          hit.score,
        ]),
      });
      process.stdout.write(".");
    }
    process.stdout.write("\n");
    fs.writeFileSync(SCORE_FILE, JSON.stringify(matrix, null, 2));
    console.log(`分数矩阵已存到 ${SCORE_FILE}\n`);
    return matrix;
  } finally {
    console.log("清理评测数据...");
    for (const item of items) await vectorService.remove(item.id);
    await app.close();
  }
};

/**
 * 枢纽修正（诊断用）：减掉每个物品在其他 query 上的平均分。
 * 「鸡蛋」这类名字短、没备注的物品对所有 query 都给高分，会顶掉真正的命中。
 * 用留一法排除当前 query 自己的分数，但背景均值仍然取自评测集内部，
 * 所以结果偏乐观，只能当上限参考。
 */
const hubCorrect = (matrix: ScoreMatrix, query: string) => {
  const sums = new Map<string, { sum: number; n: number }>();
  for (const row of matrix) {
    if (row.query === query) continue;
    for (const [name, score] of row.scores) {
      const acc = sums.get(name) ?? { sum: 0, n: 0 };
      acc.sum += score;
      acc.n += 1;
      sums.set(name, acc);
    }
  }
  return (name: string, score: number) => {
    const acc = sums.get(name);
    return acc && acc.n ? score - acc.sum / acc.n : score;
  };
};

const rerankFile = (topK: number) =>
  path.join(__dirname, "..", `eval-search-rerank-${topK}.json`);

/**
 * 用大模型对 top-K 候选做筛选，结果存盘复用。
 * 走的是和生产代码同一份提示词与解析逻辑（expiry-search-rerank.ts）。
 */
const rerankAll = async (
  matrix: ScoreMatrix,
  topK = RERANK_TOP_K
): Promise<Map<string, string[]>> => {
  dotenv.config();
  const byName = new Map(FIXTURES.map((fixture) => [fixture.name, fixture]));
  const model = new ChatOpenAI({
    model: process.env.MODEL_NAME,
    apiKey: process.env.OPENAI_API_KEY,
    // 筛选是判断题，不需要发挥
    temperature: 0,
    configuration: { baseURL: process.env.OPENAI_BASE_URL },
  });

  const result = new Map<string, string[]>();
  let failed = 0;
  for (const row of matrix) {
    const candidates = row.scores
      .slice(0, topK)
      .map(([name]) => byName.get(name))
      .filter(Boolean) as Fixture[];
    const response = await model.invoke([
      ["system", RERANK_SYSTEM_PROMPT],
      ["human", buildRerankInput(row.query, candidates)],
    ]);
    const ids = parseRerankIds(String(response.content), candidates.length);
    if (!ids) {
      failed += 1;
      result.set(row.query, []);
    } else {
      result.set(
        row.query,
        ids.map((index) => candidates[index].name)
      );
    }
    process.stdout.write(".");
  }
  process.stdout.write("\n");
  if (failed) console.log(`${failed} 条解析失败（生产环境会回退到统计阈值）`);
  fs.writeFileSync(
    rerankFile(topK),
    JSON.stringify([...result.entries()], null, 2)
  );
  return result;
};

/** 每条 query 单独取最优阈值能达到的 F1，即任何分数阈值规则的天花板 */ const oracle =
  (scores: Array<[string, number]>, expect: Set<string>) => {
    let best = 0;
    // 候选阈值取每个分数本身，外加「全都不要」
    for (let cut = 0; cut <= scores.length; cut += 1) {
      const got = scores.slice(0, cut).map(([name]) => name);
      const tp = got.filter((name) => expect.has(name)).length;
      const precision = got.length ? tp / got.length : 1;
      const recall = expect.size ? tp / expect.size : 1;
      const f1 =
        precision + recall
          ? (2 * precision * recall) / (precision + recall)
          : 0;
      best = Math.max(best, f1);
    }
    return best;
  };

interface Report {
  strict: number;
  precision: number;
  recall: number;
  f1: number;
  top1: number;
  recall5: number;
  recall10: number;
  rejected: number;
  falsePositives: number;
  oracleF1: number;
  prefix: number;
  failures: string[];
}

const evaluate = (
  matrix: ScoreMatrix,
  options: SelectOptions = {},
  useHub = false,
  override?: Map<string, string[]>
): Report => {
  const positives = CASES.filter((c) => c.expect.length);
  const negatives = CASES.filter((c) => !c.expect.length);
  const byQuery = new Map(matrix.map((row) => [row.query, row.scores]));
  const report: Report = {
    strict: 0,
    precision: 0,
    recall: 0,
    f1: 0,
    top1: 0,
    recall5: 0,
    recall10: 0,
    rejected: 0,
    falsePositives: 0,
    oracleF1: 0,
    prefix: 0,
    failures: [],
  };

  for (const testCase of CASES) {
    const raw = byQuery.get(testCase.query);
    if (!raw) continue;
    const adjust = useHub ? hubCorrect(matrix, testCase.query) : null;
    const scores = (
      adjust ? raw.map(([n, s]) => [n, adjust(n, s)] as [string, number]) : raw
    )
      .slice()
      .sort((a, b) => b[1] - a[1]);
    const expected = new Set(testCase.expect);
    const index = new Map(scores.map(([name], i) => [i, name]));

    const got = override?.has(testCase.query)
      ? (override.get(testCase.query) as string[])
      : selectHits(
          scores.map(([, score], i) => ({ id: i, score })),
          TOP_K,
          options
        ).map((hit) => index.get(hit.id) as string);

    const tp = got.filter((name) => expected.has(name)).length;
    const ok = got.length === expected.size && tp === expected.size;
    if (ok) report.strict += 1;
    else {
      report.failures.push(
        `${testCase.query}\n      期望: ${
          testCase.expect.join("、") || "(空)"
        }` +
          `\n      实际: ${got.join("、") || "(空)"}` +
          `\n      排名: ${scores
            .slice(0, 6)
            .map(([n, s]) => `${n}=${s.toFixed(3)}`)
            .join(" ")}`
      );
    }

    if (expected.size) {
      report.precision += got.length ? tp / got.length : 0;
      report.recall += tp / expected.size;
      if (scores.length && expected.has(scores[0][0])) report.top1 += 1;
      report.oracleF1 += oracle(scores, expected);
      // 相关项是否在 top-K 里（不论精确位置）
      const top5 = scores.slice(0, 5).map(([n]) => n);
      const top10 = scores.slice(0, 10).map(([n]) => n);
      const tp5 = top5.filter((n) => expected.has(n)).length;
      const tp10 = top10.filter((n) => expected.has(n)).length;
      report.recall5 += tp5 / expected.size;
      report.recall10 += tp10 / expected.size;
      // relevant 是否正好占据排名前缀——不成立的话任何阈值都不可能全对
      const head = scores.slice(0, expected.size).map(([n]) => n);
      if (head.every((name) => expected.has(name))) report.prefix += 1;
    } else {
      if (!got.length) report.rejected += 1;
      report.falsePositives += got.length;
    }
  }

  report.precision /= positives.length;
  report.recall /= positives.length;
  report.f1 =
    report.precision + report.recall
      ? (2 * report.precision * report.recall) /
        (report.precision + report.recall)
      : 0;
  report.top1 /= positives.length;
  report.recall5 /= positives.length;
  report.recall10 /= positives.length;
  report.oracleF1 /= positives.length;
  report.prefix /= positives.length;
  report.falsePositives /= negatives.length;
  return report;
};

const print = (label: string, report: Report) => {
  const positives = CASES.filter((c) => c.expect.length).length;
  const negatives = CASES.length - positives;
  const pct = (value: number) => `${(value * 100).toFixed(1)}%`;
  console.log(`\n=== ${label} ===`);
  console.log(`严格全对          ${report.strict}/${CASES.length}`);
  console.log(
    `正例 精确率 ${pct(report.precision)}  召回率 ${pct(
      report.recall
    )}  F1 ${pct(report.f1)}   (${positives} 条)`
  );
  console.log(
    `Top-1 命中率      ${pct(
      report.top1
    )}   ← 排名第一是否正确，衡量 embedding 本身`
  );
  console.log(
    `召回@5 / @10      ${pct(report.recall5)} / ${pct(
      report.recall10
    )}   ← 相关项是否落在候选里，决定「取前 K 交给大模型筛」可不可行`
  );
  console.log(
    `相关项占前缀      ${pct(
      report.prefix
    )}   ← 不成立则任何分数阈值都做不到全对`
  );
  console.log(
    `阈值天花板 F1     ${pct(report.oracleF1)}   ← 每条 query 单独取最优阈值`
  );
  console.log(
    `无关 query 拒绝   ${
      report.rejected
    }/${negatives}，平均误报 ${report.falsePositives.toFixed(1)} 条`
  );
};

const loadMatrix = (): ScoreMatrix => {
  if (!fs.existsSync(SCORE_FILE)) {
    throw new Error("没有分数矩阵，先跑一次 npm run eval:search");
  }
  return JSON.parse(fs.readFileSync(SCORE_FILE, "utf8")) as ScoreMatrix;
};

const bootstrap = async () => {
  const args = process.argv.slice(2);

  if (args.includes("--sweep")) {
    const matrix = loadMatrix();
    console.log("outlierZ\t严格全对\t正例F1\t无关拒绝\t(枢纽修正后)");
    for (const outlierZ of [2, 2.5, 3, 3.5, 4, 4.5, 5]) {
      const plain = evaluate(matrix, { outlierZ });
      const hub = evaluate(matrix, { outlierZ }, true);
      console.log(
        `${outlierZ}\t\t${plain.strict}\t\t${(plain.f1 * 100).toFixed(1)}%\t${
          plain.rejected
        }\t\t` +
          `${hub.strict} / F1 ${(hub.f1 * 100).toFixed(1)}% / 拒绝 ${
            hub.rejected
          }`
      );
    }
    return;
  }

  const zArg = args.find((arg) => arg.startsWith("--z="));
  const options: SelectOptions = zArg
    ? { outlierZ: Number(zArg.slice(4)) }
    : {};
  const matrix = args.includes("--offline") ? loadMatrix() : await capture();

  const current = evaluate(matrix, options);
  print("当前规则（MAD 离群检测）", current);

  if (args.includes("--rerank")) {
    const topK = Number(
      args.find((arg) => arg.startsWith("--topK="))?.slice(7) ?? RERANK_TOP_K
    );
    const file = rerankFile(topK);
    const cached =
      args.includes("--offline") && fs.existsSync(file)
        ? new Map<string, string[]>(
            JSON.parse(fs.readFileSync(file, "utf8")) as Array<
              [string, string[]]
            >
          )
        : await rerankAll(matrix, topK);
    print(`大模型重排 top-${topK}`, evaluate(matrix, options, false, cached));
  } else {
    print(
      "枢纽修正后（诊断，留一法，偏乐观）",
      evaluate(matrix, options, true)
    );
  }

  if (args.includes("--cases")) {
    console.log(`\n=== 当前规则失败明细 (${current.failures.length} 条) ===`);
    current.failures.forEach((line) => console.log(`FAIL  ${line}`));
  }
};

void bootstrap();
