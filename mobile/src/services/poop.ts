import { request } from './request'
import { getCurrentUser } from './foodieBuddy'

export interface PoopRecord {
  id: number
  userId: number
  /** 东八区日历日 YYYY-MM-DD */
  recordDate: string
  /** UTC 时间字符串 */
  occurredAt: string
  /** 布里斯托分型 1-7 */
  bristolType: number
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface MonthDay {
  date: string
  count: number
  types: number[]
}

export type BristolTag = 'hard' | 'normal' | 'soft'

export interface BristolMeta {
  type: number
  emoji: string
  name: string
  desc: string
  tag: BristolTag
}

/** 布里斯托大便分型（Bristol Stool Scale） */
export const BRISTOL_TYPES: BristolMeta[] = [
  { type: 1, emoji: '🌰', name: '坚硬小球', desc: '一颗颗分开的硬块，很难排出', tag: 'hard' },
  { type: 2, emoji: '🪵', name: '干硬长条', desc: '像香肠，但表面凹凸结块', tag: 'hard' },
  { type: 3, emoji: '🟫', name: '裂纹长条', desc: '像香肠，但表面有裂纹', tag: 'normal' },
  { type: 4, emoji: '💩', name: '光滑长条', desc: '像香肠，表面光滑柔软，最理想', tag: 'normal' },
  { type: 5, emoji: '🍫', name: '柔软小块', desc: '边缘清晰的柔软小块', tag: 'normal' },
  { type: 6, emoji: '🥣', name: '蓬松糊状', desc: '边缘蓬松的绒片状，糊状', tag: 'soft' },
  { type: 7, emoji: '💧', name: '水状', desc: '完全液体，没有固体', tag: 'soft' },
]

export const BRISTOL_BY_TYPE: Record<number, BristolMeta> = Object.fromEntries(
  BRISTOL_TYPES.map((item) => [item.type, item]),
)

const getUserId = async () => {
  const user = await getCurrentUser()
  return user.id
}

export const getDayRecords = async (date: string) => {
  const userId = await getUserId()
  return request<PoopRecord[]>({ url: '/poop-records/day', query: { userId, date } })
}

export const getMonth = async (month: string) => {
  const userId = await getUserId()
  return request<MonthDay[]>({ url: '/poop-records/month', query: { userId, month } })
}

export const addPoop = async (data: {
  occurredAt?: string
  bristolType: number
  notes?: string
}) => {
  const userId = await getUserId()
  return request<PoopRecord>({
    url: '/poop-records',
    method: 'POST',
    data: { userId, ...data },
  })
}

export const updatePoop = async (
  id: number,
  data: { occurredAt?: string; bristolType?: number; notes?: string },
) => {
  const userId = await getUserId()
  return request<PoopRecord>({
    url: `/poop-records/${id}`,
    method: 'PUT',
    query: { userId },
    data,
  })
}

export const getPoopRecord = async (id: number) => {
  const userId = await getUserId()
  return request<PoopRecord>({ url: `/poop-records/${id}`, query: { userId } })
}

export const removePoop = async (id: number) => {
  const userId = await getUserId()
  return request<{ success: boolean }>({
    url: `/poop-records/${id}`,
    method: 'DELETE',
    query: { userId },
  })
}

export const getAdvice = async (days = 30) => {
  const userId = await getUserId()
  return request<{ advice: string }>({
    url: '/poop-records/advice',
    method: 'POST',
    data: { userId, days },
  })
}

// ============ 微信订阅消息 ============

export const getReminderConfig = async () => {
  const userId = await getUserId()
  return request<{ templateId: string; remaining: number }>({
    url: '/poop-records/reminder/config',
    query: { userId },
  })
}

/**
 * 拉一次排便提醒订阅授权并上报额度。
 * 微信规则：用户每授权一次只能收到一条消息。
 */
export const ensurePoopSubscribe = async () => {
  const { templateId, remaining } = await getReminderConfig()
  if (!templateId) {
    console.warn('ensurePoopSubscribe skip: 服务端未配置 WECHAT_POOP_TEMPLATE_ID')
    return 0
  }

  const accepted = await new Promise<boolean>((resolve) => {
    uni.requestSubscribeMessage({
      tmplIds: [templateId],
      success: (res: any) => resolve(res[templateId] === 'accept'),
      fail: (err: any) => {
        console.warn('requestSubscribeMessage fail', err?.errCode, err?.errMsg)
        resolve(false)
      },
    })
  })
  if (!accepted) return remaining

  const userId = await getUserId()
  await request<{ success: boolean }>({
    url: '/poop-records/reminder/subscribe',
    method: 'POST',
    data: { userId },
  })
  return remaining + 1
}
