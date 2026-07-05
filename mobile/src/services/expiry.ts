import { request } from './request'
import { getCurrentUser, type PageResult } from './foodieBuddy'

export type ExpiryStatus = 'fresh' | 'expiring' | 'expired'

export interface ExpiryFood {
  id: number
  userId?: number
  name: string
  imageUrl?: string
  expiryDate: string
  quantity: number
  storage?: string
  category?: string
  notes?: string
  bgColor?: string
  status: ExpiryStatus
  statusText: string
  daysRemaining: number
  daysText: string
  createdAt?: string
  updatedAt?: string
}

/** 储存位置 code -> 展示文案 */
export const STORAGE_LABELS: Record<string, string> = {
  fridge: '冰箱 (冷藏室)',
  freezer: '冰箱 (冷冻室)',
  pantry: '常温储藏'
}

/** 食品分类 code -> 展示文案 */
export const CATEGORY_LABELS: Record<string, string> = {
  dairy: '乳制品',
  meat: '肉类',
  vegetable: '蔬菜',
  fruit: '水果',
  seafood: '海鲜',
  condiment: '调味品',
  snack: '零食',
  other: '其他'
}

export const STORAGE_LABEL_DEFAULT = '冰箱'

const LARGE_PAGE_SIZE = 100

export const getExpiryFoods = async (query: {
  userId: number
  status?: ExpiryStatus
  page?: number
  pageSize?: number
}) => {
  return request<PageResult<ExpiryFood>>({
    url: '/foodie-buddy/expiry-foods',
    query: { page: 1, pageSize: LARGE_PAGE_SIZE, ...query }
  })
}

export const getExpiryFood = (id: number) =>
  request<ExpiryFood>({ url: `/foodie-buddy/expiry-foods/${id}` })

export const createExpiryFood = (data: {
  userId: number
  name: string
  expiryDate: string
  quantity?: number
  storage?: string
  category?: string
  notes?: string
  imageUrl?: string
  bgColor?: string
}) =>
  request<ExpiryFood>({
    url: '/foodie-buddy/expiry-foods',
    method: 'POST',
    data
  })

export const updateExpiryFood = (id: number, data: Partial<Omit<ExpiryFood, 'id' | 'userId'>>) =>
  request<ExpiryFood>({
    url: `/foodie-buddy/expiry-foods/${id}`,
    method: 'PUT',
    data
  })

export const removeExpiryFood = (id: number) =>
  request<{ success: boolean }>({
    url: `/foodie-buddy/expiry-foods/${id}`,
    method: 'DELETE'
  })

const getUserId = async () => {
  const user = await getCurrentUser()
  return user.id
}

/** 全部食品 */
export const getAllFoods = async () => {
  const userId = await getUserId()
  const res = await getExpiryFoods({ userId })
  return res.list
}

/** 即将过期食品 */
export const getExpiringFoods = async () => {
  const userId = await getUserId()
  const res = await getExpiryFoods({ userId, status: 'expiring' })
  return res.list
}

/** 已过期食品 */
export const getExpiredFoods = async () => {
  const userId = await getUserId()
  const res = await getExpiryFoods({ userId, status: 'expired' })
  return res.list
}

/** 新增食品（自动注入 userId） */
export const addExpiryFood = async (data: {
  name: string
  expiryDate: string
  quantity?: number
  storage?: string
  category?: string
  notes?: string
  imageUrl?: string
  bgColor?: string
}) => {
  const userId = await getUserId()
  return createExpiryFood({ userId, ...data })
}

/** 编辑食品（自动注入 userId） */
export const editExpiryFood = async (
  id: number,
  data: Parameters<typeof updateExpiryFood>[1]
) => {
  return updateExpiryFood(id, data)
}
