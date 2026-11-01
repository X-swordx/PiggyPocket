import { addShelfLife, type ShelfLifeUnit } from './shelf-life';

export type RecognitionConfidence = 'high' | 'medium' | 'low';

export interface RawRecognition {
  name?: unknown;
  productionDate?: unknown;
  expiryDate?: unknown;
  shelfLifeValue?: unknown;
  shelfLifeUnit?: unknown;
  confidence?: unknown;
}

export interface NormalizedRecognition {
  recognized: boolean;
  name: string | null;
  productionDate: string | null;
  shelfLifeValue: number | null;
  shelfLifeUnit: ShelfLifeUnit | null;
  expiryDate: string | null;
  confidence: RecognitionConfidence;
  warnings: string[];
}

const DAY_MS = 24 * 3600 * 1000;
const MAX_DAY_SHELF_LIFE = 3650;
const MAX_MONTH_SHELF_LIFE = 120;
const MAX_NAME_LENGTH = 100;

const pad2 = (n: number) => String(n).padStart(2, '0');

/** 东八区当天，避免服务器时区把「今天」算错。 */
const todayInChina = (): string => {
  const d = new Date(Date.now() + 8 * 3600 * 1000);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(
    d.getUTCDate(),
  )}`;
};

const toUtc = (date: string): number => {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

/** 接受 2026-10-01 / 2026/10/01 / 20261001 / 2026年10月1日，统一成 YYYY-MM-DD。 */
const parseDate = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  let match = text.match(/^(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})日?$/);
  if (!match) match = text.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${pad2(month)}-${pad2(day)}`;
};

const parseShelfLife = (
  value: unknown,
  unit: unknown,
): { value: number; unit: ShelfLifeUnit } | null => {
  const numeric =
    typeof value === 'string' && value.trim() ? Number(value.trim()) : value;
  if (
    typeof numeric !== 'number' ||
    !Number.isInteger(numeric) ||
    numeric < 1
  ) {
    return null;
  }

  const text = typeof unit === 'string' ? unit.trim().toLowerCase() : '';
  const normalizedUnit: ShelfLifeUnit | null =
    text === 'day' || text === 'days' || text === '天'
      ? 'day'
      : text === 'month' || text === 'months' || text === '月'
        ? 'month'
        : null;
  if (!normalizedUnit) return null;

  const max =
    normalizedUnit === 'day' ? MAX_DAY_SHELF_LIFE : MAX_MONTH_SHELF_LIFE;
  return numeric > max ? null : { value: numeric, unit: normalizedUnit };
};

/** 从两个日期反推保质期：优先整月，不是整月再按天。 */
const diffShelfLife = (
  start: string,
  end: string,
): { value: number; unit: ShelfLifeUnit } | null => {
  const days = Math.round((toUtc(end) - toUtc(start)) / DAY_MS);
  if (days <= 0) return null;

  const [startYear, startMonth] = start.split('-').map(Number);
  const [endYear, endMonth] = end.split('-').map(Number);
  const months = (endYear - startYear) * 12 + (endMonth - startMonth);
  if (months >= 1 && addShelfLife(start, months, 'month') === end) {
    return { value: months, unit: 'month' };
  }
  if (days <= MAX_DAY_SHELF_LIFE) return { value: days, unit: 'day' };
  return null;
};

const parseName = (value: unknown, warnings: string[]): string | null => {
  if (typeof value !== 'string') return null;
  const name = value.trim().replace(/\s+/g, ' ');
  if (!name) return null;
  if (name.length > MAX_NAME_LENGTH) {
    warnings.push('商品名称过长，已截断');
    return name.slice(0, MAX_NAME_LENGTH);
  }
  return name;
};

const parseConfidence = (value: unknown): RecognitionConfidence =>
  value === 'high' || value === 'medium' || value === 'low' ? value : 'low';

/**
 * 把模型输出归一成可预填表单的字段：
 * - 日期统一格式、校验合法性；
 * - 缺生产日期/到期日/保质期时按规则互补；
 * - 所有推算和冲突都写进 warnings，交给用户核对。
 */
export const normalizeRecognition = (
  raw: RawRecognition,
  today = todayInChina(),
): NormalizedRecognition => {
  const warnings: string[] = [];
  const name = parseName(raw.name, warnings);
  let productionDate = parseDate(raw.productionDate);
  let expiryDate = parseDate(raw.expiryDate);
  let shelfLife = parseShelfLife(raw.shelfLifeValue, raw.shelfLifeUnit);

  if (
    (raw.shelfLifeValue !== undefined && raw.shelfLifeValue !== null) ||
    (raw.shelfLifeUnit !== undefined && raw.shelfLifeUnit !== null)
  ) {
    if (!shelfLife) warnings.push('识别到的保质期无效，已忽略');
  }

  if (productionDate && productionDate > today) {
    warnings.push('生产日期晚于今天，已忽略');
    productionDate = null;
  }

  if (productionDate && expiryDate && expiryDate <= productionDate) {
    warnings.push('到期日期不晚于生产日期，已忽略到期日');
    expiryDate = null;
  }

  // 三个字段都有但互相矛盾：以印刷的日期为准，重算保质期。
  if (productionDate && expiryDate && shelfLife) {
    const computed = addShelfLife(
      productionDate,
      shelfLife.value,
      shelfLife.unit,
    );
    if (Math.abs(toUtc(computed) - toUtc(expiryDate)) > 3 * DAY_MS) {
      const derived = diffShelfLife(productionDate, expiryDate);
      if (derived) {
        shelfLife = derived;
        warnings.push('包装上的保质期与日期不一致，已按日期重算保质期');
      } else {
        shelfLife = null;
        warnings.push('包装上的保质期与日期不一致，请核对');
      }
    }
  }

  if (productionDate && expiryDate && !shelfLife) {
    const derived = diffShelfLife(productionDate, expiryDate);
    if (derived) {
      shelfLife = derived;
      warnings.push('保质期由生产日期和到期日推算');
    }
  }

  if (!productionDate && expiryDate && shelfLife) {
    const derived = addShelfLife(expiryDate, -shelfLife.value, shelfLife.unit);
    if (derived < today) {
      productionDate = derived;
      warnings.push('生产日期由到期日和保质期推算');
    } else {
      warnings.push('无法从到期日反推生产日期，请手动填写');
    }
  }

  // 保存时服务端会按这两个字段重算，预览必须用同一个算法。
  if (productionDate && shelfLife) {
    expiryDate = addShelfLife(
      productionDate,
      shelfLife.value,
      shelfLife.unit,
    );
  }

  const recognized = Boolean(name || productionDate || expiryDate);
  if (recognized) {
    if (!name) warnings.push('未识别到商品名称，请手动填写');
    if (!productionDate) warnings.push('未识别到生产日期，请手动填写');
    if (!shelfLife) warnings.push('未识别到保质期，请手动填写');
  }

  const uniqueWarnings = [...new Set(warnings)];

  return {
    recognized,
    name,
    productionDate,
    shelfLifeValue: shelfLife?.value ?? null,
    shelfLifeUnit: shelfLife?.unit ?? null,
    expiryDate,
    confidence: parseConfidence(raw.confidence),
    warnings:
      recognized || uniqueWarnings.length
        ? uniqueWarnings
        : ['未识别到可用的商品信息，请手动填写'],
  };
};
