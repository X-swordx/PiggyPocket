import { parseRerankIds } from "./expiry-search-rerank";

describe("parseRerankIds", () => {
  it("解析纯 JSON", () => {
    expect(parseRerankIds('{"ids": [1, 3]}', 5)).toEqual([0, 2]);
  });

  it("容忍 markdown 围栏和多余文字", () => {
    const raw = '好的，筛选结果如下：\n```json\n{"ids": [2]}\n```';
    expect(parseRerankIds(raw, 5)).toEqual([1]);
  });

  it("空数组表示都不相关", () => {
    expect(parseRerankIds('{"ids": []}', 5)).toEqual([]);
  });

  it("丢掉越界编号，避免取到不存在的候选", () => {
    expect(parseRerankIds('{"ids": [0, 1, 6, 3]}', 5)).toEqual([0, 2]);
  });

  it("不是 JSON 时返回 null，让调用方回退", () => {
    expect(parseRerankIds("我觉得第 1 条和第 3 条相关", 5)).toBeNull();
  });

  it("JSON 里没有 ids 字段时返回 null", () => {
    expect(parseRerankIds('{"result": [1]}', 5)).toBeNull();
  });

  it("JSON 残缺时返回 null", () => {
    expect(parseRerankIds('{"ids": [1, ', 5)).toBeNull();
  });
});
