import { request } from './request'
import { getCurrentUser, type PageResult } from './foodieBuddy'

export type ExpiryStatus = 'fresh' | 'expiring' | 'expired'

export interface ExpiryItem {
  id: number
  userId?: number
  /** 共享到的搭伙小组ID；为空表示仅自己可见 */
  groupId?: number | null
  name: string
  imageUrl?: string
  /** 生产日期 */
  productionDate?: string | null
  /** 保质期数值，与 shelfLifeUnit 搭配；到期日由二者计算 */
  shelfLifeValue?: number | null
  /** 保质期单位：day=天，month=月 */
  shelfLifeUnit?: 'day' | 'month' | null
  /** 到期日期（生产日期 + 保质期，后端计算） */
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

export const getExpiryItem = async (id: number) => {
  const userId = await getUserId()
  return request<ExpiryItem>({ url: `/expiry-items/${id}`, query: { userId } })
}

export const createExpiryItem = (data: {
  userId: number
  groupId?: number | null
  name: string
  productionDate: string
  shelfLifeValue: number
  shelfLifeUnit: 'day' | 'month'
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

export const updateExpiryItem = async (
  id: number,
  data: Partial<Omit<ExpiryItem, 'id' | 'userId'>>
) => {
  const userId = await getUserId()
  return request<ExpiryItem>({
    url: `/expiry-items/${id}`,
    method: 'PUT',
    query: { userId },
    data
  })
}

export const removeExpiryItem = async (id: number) => {
  const userId = await getUserId()
  return request<{ success: boolean }>({
    url: `/expiry-items/${id}`,
    method: 'DELETE',
    query: { userId }
  })
}

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
  groupId?: number | null
  name: string
  productionDate: string
  shelfLifeValue: number
  shelfLifeUnit: 'day' | 'month'
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
  if (!templateId) {
    console.warn('ensureSubscribe skip: 服务端未配置 WECHAT_EXPIRY_TEMPLATE_ID')
    return false
  }

  const accepted = await new Promise<boolean>((resolve) => {
    uni.requestSubscribeMessage({
      tmplIds: [templateId],
      success: (res: any) => {
        // 拒绝时为 'reject'；勾过「总是保持以上选择」后不再弹窗，直接返回上次的选择
        if (res[templateId] !== 'accept') {
          console.warn('ensureSubscribe reject', templateId, res[templateId])
        }
        resolve(res[templateId] === 'accept')
      },
      // 常见 errCode：10001 模板不属于该小程序，20004 用户关闭了订阅消息主开关
      fail: (err: any) => {
        console.warn('requestSubscribeMessage fail', err?.errCode, err?.errMsg)
        resolve(false)
      }
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
