import { request } from './request'
import { getCurrentUser, type PageResult } from './foodieBuddy'

export interface Wish {
  id: number
  userId?: number
  title: string
  category: string
  tagClass: string
  filter: number
  completed: boolean
  createdAt?: string
  updatedAt?: string
}

const LARGE_PAGE_SIZE = 100

export const getWishes = async (query: {
  userId: number
  completed?: boolean
  page?: number
  pageSize?: number
}) => {
  return request<PageResult<Wish>>({
    url: '/foodie-buddy/wishes',
    query: { page: 1, pageSize: LARGE_PAGE_SIZE, ...query }
  })
}

export const getWishCount = (userId: number) =>
  request<number>({
    url: '/foodie-buddy/wishes/count',
    query: { userId }
  })

export const createWish = (data: {
  userId: number
  title: string
  category: string
  tagClass: string
  filter: number
}) =>
  request<Wish>({
    url: '/foodie-buddy/wishes',
    method: 'POST',
    data
  })

export const updateWish = (id: number, data: Partial<Omit<Wish, 'id'>>) =>
  request<Wish>({
    url: `/foodie-buddy/wishes/${id}`,
    method: 'PUT',
    data
  })

export const removeWish = (id: number) =>
  request<{ success: boolean }>({
    url: `/foodie-buddy/wishes/${id}`,
    method: 'DELETE'
  })

const getUserId = async () => {
  const user = await getCurrentUser()
  return user.id
}

/** 未完成心愿列表 */
export const getActiveWishes = async () => {
  const userId = await getUserId()
  const res = await getWishes({ userId, completed: false })
  return res.list
}

/** 已完成心愿列表 */
export const getCompletedWishes = async () => {
  const userId = await getUserId()
  const res = await getWishes({ userId, completed: true })
  return res.list
}

/** 已完成心愿数量 */
export const getCompletedCount = async () => {
  const userId = await getUserId()
  return getWishCount(userId)
}

/** 全部心愿数量 */
export const getTotalCount = async () => {
  const userId = await getUserId()
  const res = await getWishes({ userId, pageSize: 1 })
  return res.total
}

export const completeWish = (id: number) =>
  updateWish(id, { completed: true })

export const uncompleteWish = (id: number) =>
  updateWish(id, { completed: false })

export const addWish = async (data: {
  title: string
  category: string
  tagClass: string
  filter: number
}) => {
  const userId = await getUserId()
  return createWish({ userId, ...data })
}
