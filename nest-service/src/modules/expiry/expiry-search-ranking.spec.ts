import { selectHits } from './expiry-search-ranking';

const hits = (...scores: number[]) =>
  scores.map((score, index) => ({ id: index + 1, score }));

describe('selectHits', () => {
  it('样本足够时挑出显著高于其他物品的命中', () => {
    // 一条 0.52 明显高于一群 0.30 左右的陪跑
    const result = selectHits(
      hits(0.52, 0.34, 0.33, 0.32, 0.31, 0.3, 0.29, 0.28),
      10,
    );
    expect(result.map((hit) => hit.id)).toEqual([1]);
  });

  it('分数挤成一团时返回空（跟家里的东西都不沾边）', () => {
    // 最高分 0.377 绝对值不低，但相对整个分布并不突出
    const result = selectHits(
      hits(0.377, 0.36, 0.35, 0.34, 0.34, 0.33, 0.32, 0.31),
      10,
    );
    expect(result).toEqual([]);
  });

  it('多条同时相关时全部返回，不被 std 抬高门槛压掉', () => {
    // MAD 的意义：4 条 0.5 左右的命中不会把自己的门槛抬上去
    const result = selectHits(
      hits(0.55, 0.53, 0.51, 0.5, 0.3, 0.29, 0.28, 0.27, 0.26, 0.25),
      10,
    );
    expect(result.map((hit) => hit.id)).toEqual([1, 2, 3, 4]);
  });

  it('受 topK 截断', () => {
    const result = selectHits(
      hits(0.55, 0.53, 0.51, 0.5, 0.3, 0.29, 0.28, 0.27, 0.26, 0.25),
      2,
    );
    expect(result.map((hit) => hit.id)).toEqual([1, 2]);
  });

  it('样本不足 5 条时退回绝对阈值', () => {
    expect(selectHits(hits(0.5, 0.3), 10).map((hit) => hit.id)).toEqual([1]);
    // 绝对阈值 0.32 以下一律不算命中
    expect(selectHits(hits(0.31, 0.3), 10)).toEqual([]);
  });

  it('分数全部相同时退回绝对阈值，不因 MAD=0 崩掉', () => {
    const result = selectHits(hits(0.4, 0.4, 0.4, 0.4, 0.4, 0.4), 10);
    expect(result).toHaveLength(6);
  });

  it('空输入返回空', () => {
    expect(selectHits([], 10)).toEqual([]);
  });

  it('输入未排序也能正确处理', () => {
    const result = selectHits(
      hits(0.3, 0.31, 0.52, 0.29, 0.32, 0.28, 0.33, 0.34),
      10,
    );
    expect(result.map((hit) => hit.score)).toEqual([0.52]);
  });
});
