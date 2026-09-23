/** 前后端约定的选项字典，展示层用；提交时用 code。 */

export const STORAGE_OPTIONS = [
  { label: '冰箱冷藏', value: 'fridge' },
  { label: '冰箱冷冻', value: 'freezer' },
  { label: '常温橱柜', value: 'pantry' },
  { label: '药箱收纳柜', value: 'cabinet' },
  { label: '其他', value: 'other' },
]

export const ITEM_CATEGORY_OPTIONS = [
  { label: '食品饮料', value: 'food' },
  { label: '药品', value: 'medicine' },
  { label: '美妆护肤', value: 'cosmetic' },
  { label: '日用品', value: 'daily' },
  { label: '宠物用品', value: 'pet' },
  { label: '滤芯耗材', value: 'consumable' },
  { label: '卡券会员', value: 'card' },
  { label: '证件保险', value: 'document' },
  { label: '其他', value: 'other' },
]

export const EXPIRY_STATUS_OPTIONS = [
  { label: '充足', value: 'fresh' },
  { label: '即将到期', value: 'expiring' },
  { label: '已过期', value: 'expired' },
] as const

export const EXPIRY_STATUS_TAG_TYPE: Record<string, 'success' | 'warning' | 'danger'> = {
  fresh: 'success',
  expiring: 'warning',
  expired: 'danger',
}

export const BRISTOL_OPTIONS = [
  { label: '1型 坚硬小球', value: 1 },
  { label: '2型 干硬长条', value: 2 },
  { label: '3型 裂纹长条', value: 3 },
  { label: '4型 光滑长条', value: 4 },
  { label: '5型 柔软小块', value: 5 },
  { label: '6型 蓬松糊状', value: 6 },
  { label: '7型 水状', value: 7 },
]

export const BRISTOL_EMOJI: Record<number, string> = {
  1: '🌰',
  2: '🪵',
  3: '🟫',
  4: '💩',
  5: '🍫',
  6: '🥣',
  7: '💧',
}

/** 1-2 偏硬（warning），3-5 正常（success），6-7 偏稀（danger） */
export const BRISTOL_TAG_TYPE: Record<number, 'warning' | 'success' | 'danger'> = {
  1: 'warning',
  2: 'warning',
  3: 'success',
  4: 'success',
  5: 'success',
  6: 'danger',
  7: 'danger',
}

export const WISH_CATEGORY_OPTIONS = [
  { label: '旅行', value: '旅行' },
  { label: '技能', value: '技能' },
  { label: '健康', value: '健康' },
  { label: '成长', value: '成长' },
]

export const WISH_TAG_CLASS_OPTIONS = [
  { label: '旅行 (Travel)', value: 'travel' },
  { label: '技能 (Skill)', value: 'skill' },
  { label: '健康 (Health)', value: 'health' },
  { label: '成长 (Grow)', value: 'grow' },
]

export const DISH_STATUS_OPTIONS = [
  { label: '上架', value: 1 },
  { label: '下架', value: 0 },
]

export const ORDER_STATUS_OPTIONS = [
  { label: '待处理', value: 'pending' },
  { label: '确认中', value: 'confirming' },
  { label: '烹饪中', value: 'cooking' },
  { label: '已完成', value: 'completed' },
] as const

export const ORDER_STATUS_TAG_TYPE: Record<string, 'info' | 'warning' | 'primary' | 'success'> = {
  pending: 'info',
  confirming: 'warning',
  cooking: 'primary',
  completed: 'success',
}

/** 状态单向流转下一档；已完成没有下一档 */
export const ORDER_NEXT_STATUS: Record<string, 'pending' | 'confirming' | 'cooking' | 'completed' | null> = {
  pending: 'confirming',
  confirming: 'cooking',
  cooking: 'completed',
  completed: null,
}

export function labelOf(
  options: Array<{ label: string; value: string | number }>,
  value: string | number | null | undefined,
) {
  if (value === null || value === undefined || value === '') return '-'
  return options.find((o) => o.value === value)?.label ?? String(value)
}
