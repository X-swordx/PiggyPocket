import { BadRequestException } from '@nestjs/common';

export type ShelfLifeUnit = 'day' | 'month';

const formatDate = (d: Date): string => {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * 到期日 = 生产日期 + 保质期。
 * - day：直接加天数；
 * - month：加到对应月份的同一天，目标月没有这一天（如 1 月 31 日加 1 个月）
 *   则取目标月最后一天。
 * 全程用 UTC 计算，避免 MySQL 会话时区影响结果。
 */
export const addShelfLife = (
  productionDate: string,
  value: number,
  unit: ShelfLifeUnit,
): string => {
  const [y, m, d] = productionDate.split('-').map(Number);
  if (unit === 'day') {
    return formatDate(new Date(Date.UTC(y, m - 1, d + value)));
  }
  const target = new Date(Date.UTC(y, m - 1 + value, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return formatDate(
    new Date(Date.UTC(y, m - 1 + value, Math.min(d, lastDay))),
  );
};

interface ShelfLifeFields {
  productionDate?: string | null;
  shelfLifeValue?: number | null;
  shelfLifeUnit?: string | null;
  expiryDate?: string;
}

/**
 * 部分更新时解析新到期日：生产日期三字段中任一出现在 patch 里就要整体重算，
 * 未出现的字段用库里的现值补；现值也为空（历史数据）则拒绝，
 * 避免把 NaN-NaN-NaN 写进 expiryDate。
 * 返回 null 表示这次更新没碰保质期。
 */
export const resolveExpiryDate = (
  current: ShelfLifeFields,
  patch: ShelfLifeFields,
): { expiryDate: string; changed: boolean } | null => {
  const touched =
    patch.productionDate !== undefined ||
    patch.shelfLifeValue !== undefined ||
    patch.shelfLifeUnit !== undefined;
  if (!touched) return null;

  const productionDate = patch.productionDate ?? current.productionDate;
  const shelfLifeValue = patch.shelfLifeValue ?? current.shelfLifeValue;
  const shelfLifeUnit = patch.shelfLifeUnit ?? current.shelfLifeUnit;
  if (!productionDate || !shelfLifeValue || !shelfLifeUnit) {
    throw new BadRequestException(
      '生产日期、保质期数值和单位必须一起提供',
    );
  }

  const expiryDate = addShelfLife(
    productionDate,
    shelfLifeValue,
    shelfLifeUnit as ShelfLifeUnit,
  );
  return { expiryDate, changed: expiryDate !== current.expiryDate };
};
