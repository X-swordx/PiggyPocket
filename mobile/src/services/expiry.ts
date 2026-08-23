import { request } from './request'
import { getCurrentUser, type PageResult } from './foodieBuddy'

export type ExpiryStatus = 'fresh' | 'expiring' | 'expired'

export interface ExpiryItem {
  id: number
  userId?: number
  name: string
  imageUrl?: string
  expiryDate: string
  quantity: number
  remindDays: number
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

/** 存放位置 code -> 展示文案 */
export const STORAGE_LABELS: Record<string, string> = {
  fridge: '冰箱冷藏',
  freezer: '冰箱冷冻',
  pantry: '常温橱柜',
  cabinet: '药箱收纳柜',
  other: '其他'
}

/** 物品分类 code -> 展示文案 */
export const CATEGORY_LABELS: Record<string, string> = {
  food: '食品饮料',
  medicine: '药品',
  cosmetic: '美妆护肤',
  daily: '日用品',
  pet: '宠物用品',
  consumable: '滤芯耗材',
  card: '卡券会员',
  document: '证件保险',
  other: '其他'
}

export const STORAGE_LABEL_DEFAULT = '未指定'

const LARGE_PAGE_SIZE = 100

export const getExpiryItems = async (query: {
  userId: number
  status?: ExpiryStatus
  page?: number
  pageSize?: number
}) => {
  return request<PageResult<ExpiryItem>>({
    url: '/expiry-items',
    query: { page: 1, pageSize: LARGE_PAGE_SIZE, ...query }
  })
}

export const getExpiryItem = (id: number) =>
  request<ExpiryItem>({ url: `/expiry-items/${id}` })

export const createExpiryItem = (data: {
  userId: number
  name: string
  expiryDate: string
  quantity?: number
  remindDays?: number
  storage?: string
  category?: string
  notes?: string
  imageUrl?: string
  bgColor?: string
}) =>
  request<ExpiryItem>({
    url: '/expiry-items',
    method: 'POST',
    data
  })

export const updateExpiryItem = (id: number, data: Partial<Omit<ExpiryItem, 'id' | 'userId'>>) =>
  request<ExpiryItem>({
    url: `/expiry-items/${id}`,
    method: 'PUT',
    data
  })

export const removeExpiryItem = (id: number) =>
  request<{ success: boolean }>({
    url: `/expiry-items/${id}`,
    method: 'DELETE'
  })

const getUserId = async () => {
  const user = await getCurrentUser()
  return user.id
}

/** 全部物品 */
export const getAllItems = async () => {
  const userId = await getUserId()
  const res = await getExpiryItems({ userId })
  return res.list
}

/** 即将到期物品 */
export const getExpiringItems = async () => {
  const userId = await getUserId()
  const res = await getExpiryItems({ userId, status: 'expiring' })
  return res.list
}

/** 已过期物品 */
export const getExpiredItems = async () => {
  const userId = await getUserId()
  const res = await getExpiryItems({ userId, status: 'expired' })
  return res.list
}

/** 新增物品（自动注入 userId） */
export const addExpiryItem = async (data: {
  name: string
  expiryDate: string
  quantity?: number
  remindDays?: number
  storage?: string
  category?: string
  notes?: string
  imageUrl?: string
  bgColor?: string
}) => {
  const userId = await getUserId()
  return createExpiryItem({ userId, ...data })
}

/** 编辑物品 */
export const editExpiryItem = async (
  id: number,
  data: Parameters<typeof updateExpiryItem>[1]
) => {
  return updateExpiryItem(id, data)
}

/** 语义搜索。semantic 为 false 说明向量库不可用，已降级为关键词匹配 */
export const searchItems = async (keyword: string, topK = 20) => {
  const userId = await getUserId()
  return request<{ list: ExpiryItem[]; semantic: boolean }>({
    url: '/expiry-items/search',
    query: { userId, keyword, topK }
  })
}

// ============ 微信订阅消息 ============

/** 剩余推送额度，为 0 时列表页提示用户去授权。 */
export const getReminderQuota = async () => {
  const userId = await getUserId()
  const { remaining } = await request<{ templateId: string; remaining: number }>({
    url: '/expiry-items/reminder/config',
    query: { userId }
  })
  return remaining
}

/**
 * 微信规则：用户每授权一次只能收到一条消息。
 * 所以每次保存物品后都拉一次授权，把次数累加到后端配额里。
 */
export const ensureSubscribe = async () => {
  const { templateId } = await request<{ templateId: string }>({
    url: '/expiry-items/reminder/config'
  })
  if (!templateId) return false

  const accepted = await new Promise<boolean>((resolve) => {
    uni.requestSubscribeMessage({
      tmplIds: [templateId],
      success: (res: any) => resolve(res[templateId] === 'accept'),
      fail: () => resolve(false)
    })
  })
  if (!accepted) return false

  const userId = await getUserId()
  await request<{ success: boolean }>({
    url: '/expiry-items/reminder/subscribe',
    method: 'POST',
    data: { userId }
  })
  return true
}
