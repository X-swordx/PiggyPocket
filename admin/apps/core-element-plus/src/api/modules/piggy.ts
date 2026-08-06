import api from '../index'

/**
 * 与 fantastic-admin 默认 axios 拦截器约定一致：
 *   服务端响应 `{ status: 1, error: '', data }`，
 *   拦截器把整个响应体（不是 axios response）通过 resolve 返回。
 * 这里所有函数返回值都取的是 `response.data` 字段。
 */

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

interface RawResp<T> {
  status: number
  error: string
  data: T
}

async function unwrap<T>(promise: Promise<any>): Promise<T> {
  const res = (await promise) as RawResp<T>
  return res.data
}

// ============================ 用户下拉 ============================

export interface AdminUserOption {
  id: number
  nickname: string
  avatar?: string
  openidTail: string | null
}

export const searchAdminUsers = (keyword?: string) =>
  unwrap<AdminUserOption[]>(
    api.get('admin/users/options', { params: { keyword } }),
  )

// ============================ OSS ============================

export interface OssPolicy {
  host: string
  accessid: string
  policy: string
  signature: string
  expire: number
  dir: string
}

export const getOssUploadToken = (dir = 'admin') =>
  unwrap<OssPolicy>(api.get('admin/oss/upload-token', { params: { dir } }))

// ============================ 临期食品 ============================

export type ExpiryStatus = 'fresh' | 'expiring' | 'expired'

export interface AdminExpiryFood {
  id: number
  userId: number
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
  userNickname: string | null
  createdAt: string
  updatedAt: string
}

export interface ExpiryListQuery {
  page?: number
  pageSize?: number
  userId?: number
  keyword?: string
  status?: ExpiryStatus
}

export const listExpiryFoods = (query: ExpiryListQuery) =>
  unwrap<PageResult<AdminExpiryFood>>(
    api.get('admin/expiry-foods', { params: query }),
  )

export const getExpiryFood = (id: number) =>
  unwrap<AdminExpiryFood>(api.get(`admin/expiry-foods/${id}`))

export const createExpiryFood = (data: Partial<AdminExpiryFood>) =>
  unwrap<AdminExpiryFood>(api.post('admin/expiry-foods', data))

export const updateExpiryFood = (id: number, data: Partial<AdminExpiryFood>) =>
  unwrap<AdminExpiryFood>(api.put(`admin/expiry-foods/${id}`, data))

export const removeExpiryFood = (id: number) =>
  unwrap<{ success: boolean }>(api.delete(`admin/expiry-foods/${id}`))

export const removeExpiredFoods = (userId?: number) =>
  unwrap<{ success: boolean; affected: number }>(
    api.delete('admin/expiry-foods/expired/batch', {
      params: userId ? { userId } : undefined,
    }),
  )

// ============================ 心愿 ============================

export interface AdminWish {
  id: number
  userId: number
  title: string
  category: string
  tagClass: string
  filter: number
  completed: boolean
  userNickname: string | null
  createdAt: string
  updatedAt: string
}

export interface WishListQuery {
  page?: number
  pageSize?: number
  userId?: number
  keyword?: string
  completed?: boolean
  category?: string
}

export const listWishes = (query: WishListQuery) =>
  unwrap<PageResult<AdminWish>>(
    api.get('admin/wishes', {
      params: {
        ...query,
        completed:
          query.completed === undefined ? undefined : String(query.completed),
      },
    }),
  )

export const getWish = (id: number) =>
  unwrap<AdminWish>(api.get(`admin/wishes/${id}`))

export const createWish = (data: Partial<AdminWish>) =>
  unwrap<AdminWish>(api.post('admin/wishes', data))

export const updateWish = (id: number, data: Partial<AdminWish>) =>
  unwrap<AdminWish>(api.put(`admin/wishes/${id}`, data))

export const toggleWishCompleted = (id: number, completed: boolean) =>
  unwrap<AdminWish>(api.put(`admin/wishes/${id}/completed`, { completed }))

export const removeWish = (id: number) =>
  unwrap<{ success: boolean }>(api.delete(`admin/wishes/${id}`))

// ============================ 菜品 ============================

export interface DishIngredient {
  name: string
  amount: string
}

export interface AdminDish {
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
  userId: number
  groupId: number | null
  userNickname: string | null
  createdAt: string
  updatedAt: string
}

export interface DishListQuery {
  page?: number
  pageSize?: number
  userId?: number
  keyword?: string
  category?: string
  status?: number
  groupId?: number
}

export const listDishes = (query: DishListQuery) =>
  unwrap<PageResult<AdminDish>>(api.get('admin/dishes', { params: query }))

export const getDish = (id: number) =>
  unwrap<AdminDish>(api.get(`admin/dishes/${id}`))

export const createDish = (data: Partial<AdminDish>) =>
  unwrap<AdminDish>(api.post('admin/dishes', data))

export const updateDish = (id: number, data: Partial<AdminDish>) =>
  unwrap<AdminDish>(api.put(`admin/dishes/${id}`, data))

export const setDishStatus = (id: number, status: number) =>
  unwrap<AdminDish>(api.put(`admin/dishes/${id}/status`, { status }))

export const removeDish = (id: number) =>
  unwrap<{ success: boolean }>(api.delete(`admin/dishes/${id}`))

// ============================ 订单 ============================

export type OrderStatus = 'pending' | 'confirming' | 'cooking' | 'completed'

export interface AdminOrderItem {
  id: number
  orderId: number
  dishId: number
  quantity: number
  remark?: string
  dish?: {
    id: number
    name: string
    image?: string
    category?: string
  }
}

export interface AdminOrder {
  id: number
  orderNo: string
  userId: number
  groupId: number | null
  status: OrderStatus
  remark?: string
  cookDate?: string | null
  items: AdminOrderItem[]
  itemCount: number
  userNickname: string | null
  groupName: string | null
  createdAt: string
  updatedAt: string
}

export interface OrderListQuery {
  page?: number
  pageSize?: number
  userId?: number
  keyword?: string
  status?: OrderStatus
  groupId?: number
  startDate?: string
  endDate?: string
  cookStartDate?: string
  cookEndDate?: string
}

export const listOrders = (query: OrderListQuery) =>
  unwrap<PageResult<AdminOrder>>(api.get('admin/orders', { params: query }))

export const getOrder = (id: number) =>
  unwrap<AdminOrder>(api.get(`admin/orders/${id}`))

export const setOrderStatus = (id: number, status: OrderStatus) =>
  unwrap<AdminOrder>(api.put(`admin/orders/${id}/status`, { status }))

export const updateOrderRemark = (id: number, remark: string) =>
  unwrap<AdminOrder>(api.put(`admin/orders/${id}/remark`, { remark }))

export const removeOrder = (id: number) =>
  unwrap<{ success: boolean }>(api.delete(`admin/orders/${id}`))

// ============================ 饭搭子分组 ============================

export interface AdminDiningGroup {
  id: number
  name: string
  creatorId: number
  creatorNickname: string | null
  memberCount: number
  createdAt: string
  updatedAt: string
}

export interface AdminGroupMember {
  id: number
  groupId: number
  userId: number
  nickname?: string
  joinedAt: string
  user: {
    id: number
    nickname: string | null
    avatar?: string
    openidTail: string | null
  } | null
}

export const listDiningGroups = (query: { page?: number; pageSize?: number; keyword?: string }) =>
  unwrap<PageResult<AdminDiningGroup>>(api.get('admin/dining-groups', { params: query }))

export const getDiningGroup = (id: number) =>
  unwrap<AdminDiningGroup>(api.get(`admin/dining-groups/${id}`))

export const createDiningGroup = (data: { name: string; creatorId: number }) =>
  unwrap<AdminDiningGroup>(api.post('admin/dining-groups', data))

export const updateDiningGroup = (id: number, data: { name?: string }) =>
  unwrap<AdminDiningGroup>(api.put(`admin/dining-groups/${id}`, data))

export const removeDiningGroup = (id: number) =>
  unwrap<{ success: boolean }>(api.delete(`admin/dining-groups/${id}`))

export const listGroupMembers = (id: number) =>
  unwrap<AdminGroupMember[]>(api.get(`admin/dining-groups/${id}/members`))

export const addGroupMember = (id: number, data: { userId: number; nickname?: string }) =>
  unwrap<AdminGroupMember[]>(api.post(`admin/dining-groups/${id}/members`, data))

export const updateGroupMember = (
  id: number,
  memberId: number,
  data: { nickname?: string },
) =>
  unwrap<AdminGroupMember[]>(
    api.put(`admin/dining-groups/${id}/members/${memberId}`, data),
  )

export const removeGroupMember = (id: number, memberId: number) =>
  unwrap<{ success: boolean }>(api.delete(`admin/dining-groups/${id}/members/${memberId}`))

// ============================ 用户管理 ============================

export interface AdminUserRow {
  id: number
  nickname: string | null
  avatar?: string
  openidTail: string | null
  status: number
  createdAt: string
  foodCount: number
  wishCount: number
  dishCount: number
  orderCount: number
}

export interface AdminUserDetail extends AdminUserRow {
  openid?: string
  name?: string | null
  updatedAt: string
}

export const listUsers = (query: { page?: number; pageSize?: number; keyword?: string }) =>
  unwrap<PageResult<AdminUserRow>>(api.get('admin/users', { params: query }))

export const getAdminUser = (id: number) =>
  unwrap<AdminUserDetail>(api.get(`admin/users/${id}`))

export const updateAdminUser = (
  id: number,
  data: { nickname?: string; avatar?: string },
) => unwrap<AdminUserDetail>(api.put(`admin/users/${id}`, data))

export const setUserStatus = (id: number, status: 0 | 1) =>
  unwrap<AdminUserDetail>(api.put(`admin/users/${id}/status`, { status }))

// ============================ Dashboard ============================

export interface DashboardCards {
  userTotal: number
  foodTotal: number
  wishTotal: number
  orderTotal: number
  newUsersToday: number
  newOrdersToday: number
  expiringSoon: number
  pendingOrders: number
  completedOrders: number
}

export const getDashboardOverview = () =>
  unwrap<{ cards: DashboardCards }>(api.get('admin/dashboard/overview'))

export const getOrderStatusDistribution = () =>
  unwrap<Array<{ status: string; count: number }>>(
    api.get('admin/dashboard/order-status'),
  )

export const getOrderTrend = (days = 7) =>
  unwrap<Array<{ date: string; count: number }>>(
    api.get('admin/dashboard/order-trend', { params: { days } }),
  )

// ============================ 管理员账号 ============================

export type AdminRole = 'superadmin' | 'operator' | 'viewer'

export interface AdminAccount {
  id: number
  username: string
  nickname?: string
  avatar?: string
  role: AdminRole
  status: number
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export const listAdmins = (query: { page?: number; pageSize?: number; keyword?: string }) =>
  unwrap<PageResult<AdminAccount>>(api.get('admin/admins', { params: query }))

export const createAdmin = (data: {
  username: string
  password: string
  nickname?: string
  role: AdminRole
}) => unwrap<AdminAccount>(api.post('admin/admins', data))

export const updateAdmin = (
  id: number,
  data: { nickname?: string; role?: AdminRole },
) => unwrap<AdminAccount>(api.put(`admin/admins/${id}`, data))

export const setAdminStatus = (id: number, status: 0 | 1) =>
  unwrap<AdminAccount>(api.put(`admin/admins/${id}/status`, { status }))

export const resetAdminPassword = (id: number, newPassword: string) =>
  unwrap<{ success: boolean }>(api.put(`admin/admins/${id}/password`, { newPassword }))

export const removeAdmin = (id: number) =>
  unwrap<{ success: boolean }>(api.delete(`admin/admins/${id}`))

// ============================ 操作日志 ============================

export interface AdminOpLog {
  id: number
  adminId: number
  adminUsername: string
  action: string
  resource: string | null
  target: string | null
  payload: string | null
  ip: string | null
  createdAt: string
}

export const listOpLogs = (query: {
  page?: number
  pageSize?: number
  action?: string
  resource?: string
  adminId?: number
  startDate?: string
  endDate?: string
}) => unwrap<PageResult<AdminOpLog>>(api.get('admin/oplogs', { params: query }))

// ============================ 角色权限配置 ============================

export interface PermissionGroup {
  group: string
  items: Array<{ code: string, label: string }>
}

export interface RolePermissionConfig {
  allPermissions: PermissionGroup[]
  roles: Array<{ role: AdminRole, permissions: string[] }>
}

export const getRolePermissions = () =>
  unwrap<RolePermissionConfig>(api.get('admin/role-permissions'))

export const saveRolePermissions = (role: AdminRole, permissions: string[]) =>
  unwrap<{ role: AdminRole, permissions: string[] }>(
    api.put('admin/role-permissions', { role, permissions }),
  )
