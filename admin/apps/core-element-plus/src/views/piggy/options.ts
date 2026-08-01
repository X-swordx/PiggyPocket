/** 前后端约定的选项字典，展示层用；提交时用 code。 */

export const STORAGE_OPTIONS = [
  { label: '冰箱 (冷藏室)', value: 'fridge' },
  { label: '冰箱 (冷冻室)', value: 'freezer' },
  { label: '常温储藏', value: 'pantry' },
]

export const FOOD_CATEGORY_OPTIONS = [
  { label: '乳制品', value: 'dairy' },
  { label: '肉类', value: 'meat' },
  { label: '蔬菜', value: 'vegetable' },
  { label: '水果', value: 'fruit' },
  { label: '海鲜', value: 'seafood' },
  { label: '调味品', value: 'condiment' },
  { label: '零食', value: 'snack' },
  { label: '其他', value: 'other' },
]

export const EXPIRY_STATUS_OPTIONS = [
  { label: '新鲜', value: 'fresh' },
  { label: '即将过期', value: 'expiring' },
  { label: '已过期', value: 'expired' },
] as const

export const EXPIRY_STATUS_TAG_TYPE: Record<string, 'success' | 'warning' | 'danger'> = {
  fresh: 'success',
  expiring: 'warning',
  expired: 'danger',
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

export const DISH_CATEGORY_OPTIONS = [
  { label: '热菜', value: '热菜' },
  { label: '凉菜', value: '凉菜' },
  { label: '主食', value: '主食' },
  { label: '饮品', value: '饮品' },
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
