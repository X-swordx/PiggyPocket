import { normalizeRecognition } from './expiry-recognition.normalize';

const TODAY = '2026-10-31';

describe('normalizeRecognition', () => {
  it('名称、生产日期和保质期齐全时算出到期日', () => {
    const result = normalizeRecognition(
      {
        name: '伊利纯牛奶',
        productionDate: '2026-10-01',
        shelfLifeValue: 6,
        shelfLifeUnit: 'month',
        confidence: 'high',
      },
      TODAY,
    );

    expect(result).toMatchObject({
      recognized: true,
      name: '伊利纯牛奶',
      productionDate: '2026-10-01',
      shelfLifeValue: 6,
      shelfLifeUnit: 'month',
      expiryDate: '2027-04-01',
      confidence: 'high',
    });
    expect(result.warnings).toEqual([]);
  });

  it.each([
    ['2026/10/01', '2026-10-01'],
    ['20261001', '2026-10-01'],
    ['2026年10月1日', '2026-10-01'],
  ])('把 %s 归一成 %s', (input, expected) => {
    const result = normalizeRecognition(
      { productionDate: input, shelfLifeValue: 1, shelfLifeUnit: 'day' },
      TODAY,
    );
    expect(result.productionDate).toBe(expected);
  });

  it('只有生产日期和到期日时，按整月反推保质期', () => {
    const result = normalizeRecognition(
      { productionDate: '2026-10-01', expiryDate: '2027-04-01' },
      TODAY,
    );

    expect(result.shelfLifeValue).toBe(6);
    expect(result.shelfLifeUnit).toBe('month');
    expect(result.warnings).toContain('保质期由生产日期和到期日推算');
  });

  it('不是整月时按天反推保质期', () => {
    const result = normalizeRecognition(
      { productionDate: '2026-10-01', expiryDate: '2026-10-31' },
      TODAY,
    );

    expect(result.shelfLifeValue).toBe(30);
    expect(result.shelfLifeUnit).toBe('day');
  });

  it('月末加整月时按目标月最后一天反推', () => {
    const result = normalizeRecognition(
      { productionDate: '2026-01-31', expiryDate: '2026-02-28' },
      TODAY,
    );

    expect(result.shelfLifeValue).toBe(1);
    expect(result.shelfLifeUnit).toBe('month');
  });

  it('只有到期日和保质期时反推生产日期', () => {
    const result = normalizeRecognition(
      {
        expiryDate: '2027-04-01',
        shelfLifeValue: 6,
        shelfLifeUnit: 'month',
      },
      TODAY,
    );

    expect(result.productionDate).toBe('2026-10-01');
    expect(result.expiryDate).toBe('2027-04-01');
    expect(result.warnings).toContain('生产日期由到期日和保质期推算');
  });

  it('保质期与印刷日期冲突超过 3 天时按日期重算', () => {
    const result = normalizeRecognition(
      {
        productionDate: '2026-10-01',
        expiryDate: '2027-04-01',
        shelfLifeValue: 12,
        shelfLifeUnit: 'month',
      },
      TODAY,
    );

    expect(result.shelfLifeValue).toBe(6);
    expect(result.shelfLifeUnit).toBe('month');
    expect(result.warnings).toContain('包装上的保质期与日期不一致，已按日期重算保质期');
  });

  it('忽略晚于今天的生产日期', () => {
    const result = normalizeRecognition(
      { productionDate: '2027-01-01', shelfLifeValue: 1, shelfLifeUnit: 'month' },
      TODAY,
    );

    expect(result.productionDate).toBeNull();
    expect(result.warnings).toContain('生产日期晚于今天，已忽略');
  });

  it('忽略不晚于生产日期的到期日', () => {
    const result = normalizeRecognition(
      { productionDate: '2026-10-01', expiryDate: '2026-09-01' },
      TODAY,
    );

    expect(result.expiryDate).toBeNull();
    expect(result.warnings).toContain('到期日期不晚于生产日期，已忽略到期日');
  });

  it.each([
    ['2026-02-30'],
    ['2026-13-01'],
    ['2026-00-10'],
    ['not-a-date'],
  ])('忽略无效日期 %s', (input) => {
    const result = normalizeRecognition(
      { productionDate: input, shelfLifeValue: 1, shelfLifeUnit: 'month' },
      TODAY,
    );
    expect(result.productionDate).toBeNull();
  });

  it.each([
    [0, 'day'],
    [3651, 'day'],
    [121, 'month'],
    [1, 'year'],
  ])('忽略无效保质期 %s %s', (value, unit) => {
    const result = normalizeRecognition(
      { shelfLifeValue: value, shelfLifeUnit: unit },
      TODAY,
    );
    expect(result.shelfLifeValue).toBeNull();
    expect(result.shelfLifeUnit).toBeNull();
    expect(result.warnings).toContain('识别到的保质期无效，已忽略');
  });

  it('完全没识别出字段时返回 recognized=false', () => {
    const result = normalizeRecognition({}, TODAY);

    expect(result.recognized).toBe(false);
    expect(result.name).toBeNull();
    expect(result.productionDate).toBeNull();
    expect(result.warnings).toEqual(['未识别到可用的商品信息，请手动填写']);
  });

  it('只识别到名称时标出缺失的日期和保质期', () => {
    const result = normalizeRecognition({ name: '牛奶' }, TODAY);

    expect(result.recognized).toBe(true);
    expect(result.warnings).toContain('未识别到生产日期，请手动填写');
    expect(result.warnings).toContain('未识别到保质期，请手动填写');
  });

  it('商品名称超过 100 字时截断', () => {
    const result = normalizeRecognition({ name: '牛'.repeat(120) }, TODAY);

    expect(result.name).toHaveLength(100);
    expect(result.warnings).toContain('商品名称过长，已截断');
  });

  it('confidence 非法时降级为 low', () => {
    const result = normalizeRecognition({ name: '牛奶', confidence: 'sure' }, TODAY);
    expect(result.confidence).toBe('low');
  });
});
