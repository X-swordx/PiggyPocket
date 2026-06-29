import { request } from './request'

const CURRENT_USER_KEY = 'foodie_current_user'
export const SELECTED_DISHES_KEY = 'foodie_selected_dishes'

export interface FoodieUser {
  id: number
  openid: string
  name?: string
  nickname?: string
  avatar?: string
  createdAt?: string
  updatedAt?: string
}

export interface DishIngredient {
  name: string
  amount: string
}

export interface FoodieDish {
  id: number
  name: string
  description?: string
  category?: string
  image?: string
  status: number
  calories?: number
  cookingTime?: string
  ingredients?: DishIngredient[]
  steps?: string[]
  tags?: string[]
  bgColor?: string
  createdAt?: string
  updatedAt?: string
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface FoodieOrderItem {
  id: number
  orderId: number
  dishId: number
  quantity: number
  remark?: string
  dish?: FoodieDish
}

export interface FoodieOrder {
  id: number
  orderNo: string
  userId: number
  groupId?: number
  status: 'pending' | 'confirming' | 'cooking' | 'completed'
  remark?: string
  items: FoodieOrderItem[]
  user?: FoodieUser
  createdAt: string
  updatedAt: string
}

export interface DiningGroupMember {
  id: number
  groupId: number
  userId: number
  nickname?: string
  joinedAt?: string
  user?: FoodieUser
}

export interface DiningGroup {
  id: number
  name: string
  creatorId: number
  creator?: FoodieUser
  members?: DiningGroupMember[]
  myNickname?: string
  joinedAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface SelectedDish {
  id: number
  name: string
  calories: string
  time: string
  bgColor: string
  image?: string
}

interface LoginResult {
  code: string
}

interface WechatProfile {
  nickname?: string
  avatar?: string
}

let currentUserPromise: Promise<FoodieUser> | null = null

const login = () => {
  return new Promise<LoginResult>((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: (res) => {
        // #ifdef MP-WEIXIN
        console.log('account info:', (uni as any).getAccountInfoSync?.())
        // #endif
        console.log('login res:', res)

        if (!res.code || res.code === 'the code is a mock one') {
          reject(new Error('微信登录返回 mock code，请使用真实 AppID 或真机预览测试'))
          return
        }
        resolve({ code: res.code })
      },
      fail: (error) => reject(new Error(error.errMsg || '微信登录失败'))
    })
  })
}

export const wechatLogin = (data: { code: string; nickname?: string; avatar?: string }) => {
  return request<FoodieUser>({
    url: '/foodie-buddy/users/wechat-login',
    method: 'POST',
    data
  })
}

export const refreshCurrentUser = async (profile?: WechatProfile) => {
  const { code } = await login()
  const user = await wechatLogin({ code, ...profile })
  uni.setStorageSync(CURRENT_USER_KEY, user)
  return user
}

export const getCurrentUser = async () => {
  const cached = uni.getStorageSync(CURRENT_USER_KEY) as FoodieUser | ''
  if (cached && cached.id) {
    return cached
  }

  if (!currentUserPromise) {
    currentUserPromise = refreshCurrentUser().finally(() => {
      currentUserPromise = null
    })
  }
  return currentUserPromise
}

export const getDishes = (query?: { page?: number; pageSize?: number; category?: string }) => {
  return request<PageResult<FoodieDish>>({
    url: '/foodie-buddy/dishes',
    query
  })
}

export const getDish = (id: number) => {
  return request<FoodieDish>({ url: `/foodie-buddy/dishes/${id}` })
}

export const createDish = (data: Partial<FoodieDish>) => {
  return request<FoodieDish>({
    url: '/foodie-buddy/dishes',
    method: 'POST',
    data
  })
}

export const updateDish = (id: number, data: Partial<FoodieDish>) => {
  return request<FoodieDish>({
    url: `/foodie-buddy/dishes/${id}`,
    method: 'PUT',
    data
  })
}

export const createOrder = (data: {
  userId: number
  groupId?: number
  remark?: string
  items: Array<{ dishId: number; quantity: number; remark?: string }>
}) => {
  return request<FoodieOrder>({
    url: '/foodie-buddy/orders',
    method: 'POST',
    data
  })
}

export const getOrders = (query?: {
  page?: number
  pageSize?: number
  status?: FoodieOrder['status']
  userId?: number
}) => {
  return request<PageResult<FoodieOrder>>({
    url: '/foodie-buddy/orders',
    query
  })
}

export const updateOrderStatus = (id: number, status: FoodieOrder['status']) => {
  return request<FoodieOrder>({
    url: `/foodie-buddy/orders/${id}/status`,
    method: 'PUT',
    data: { status }
  })
}

export const getMyDiningGroups = (userId: number) => {
  return request<DiningGroup[]>({
    url: '/foodie-buddy/dining-groups/my',
    query: { userId }
  })
}

export const getDiningGroup = (id: number) => {
  return request<DiningGroup>({ url: `/foodie-buddy/dining-groups/${id}` })
}

export const createDiningGroup = (data: { name: string; creatorId: number }) => {
  return request<DiningGroup>({
    url: '/foodie-buddy/dining-groups',
    method: 'POST',
    data
  })
}

export const addDiningGroupMember = (groupId: number, data: { openid: string; nickname?: string }) => {
  return request<DiningGroupMember>({
    url: `/foodie-buddy/dining-groups/${groupId}/members`,
    method: 'POST',
    data
  })
}

export const removeDiningGroupMember = (groupId: number, userId: number) => {
  return request<{ success: boolean }>({
    url: `/foodie-buddy/dining-groups/${groupId}/members/${userId}`,
    method: 'DELETE'
  })
}

export const leaveDiningGroup = (groupId: number, userId: number) => {
  return request<{ success: boolean }>({
    url: `/foodie-buddy/dining-groups/${groupId}/leave`,
    method: 'DELETE',
    query: { userId }
  })
}
