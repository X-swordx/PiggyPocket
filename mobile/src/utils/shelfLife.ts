export type ShelfLifeUnit = 'day' | 'month'

const pad2 = (n: number) => String(n).padStart(2, '0')

const formatDate = (d: Date): string =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

/**
 * 到期日 = 生产日期 + 保质期。
 * - day：直接加天数；
 * - month：加到对应月份的同一天，目标月没有这一天（如 1 月 31 日加 1 个月）
 *   则取目标月最后一天。
 */
export const addShelfLife = (
  productionDate: string,
  value: number,
  unit: ShelfLifeUnit
): string => {
  const [y, m, d] = productionDate.split('-').map(Number)
  if (unit === 'day') {
    const date = new Date(y, m - 1, d + value)
    return formatDate(date)
  }
  const targetMonth = m - 1 + value
  const target = new Date(y, targetMonth, 1)
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0
  ).getDate()
  return formatDate(new Date(y, targetMonth, Math.min(d, lastDay)))
}
