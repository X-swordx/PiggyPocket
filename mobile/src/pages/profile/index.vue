<template>
  <view class="container">
    <!-- Header -->
    <view class="header">
      <view class="placeholder"></view>
      <view class="title">
        <text>我的</text>
      </view>
      <view class="settings-btn" @click="goToSettings">
        <uni-icons type="gear-filled" size="24" color="#333" />
      </view>
    </view>

    <scroll-view scroll-y class="content">
      <!-- Profile Header Card -->
      <view class="profile-card">
        <view class="profile-header">
          <view class="avatar-section">
            <view class="avatar">
              <image v-if="userInfo.avatar" class="avatar-img" :src="userInfo.avatar" mode="aspectFill" />
              <view v-else class="avatar-img avatar-placeholder">
                <uni-icons type="person-filled" size="40" color="#fff" />
              </view>
            </view>
          </view>
          <view class="profile-info">
            <text class="user-name">{{ userInfo.name }}</text>
            <button class="sync-profile-btn" @click="openProfileEditor">同步微信资料</button>
          </view>
        </view>
        <view v-if="showProfileEditor" class="profile-editor">
          <button class="avatar-picker" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
            <image v-if="profileForm.avatar" class="editor-avatar" :src="profileForm.avatar" mode="aspectFill" />
            <text v-else>选择微信头像</text>
          </button>
          <input class="nickname-input" type="nickname" v-model="profileForm.nickname" placeholder="请输入微信昵称" />
          <view class="profile-actions">
            <button class="cancel-profile-btn" @click="showProfileEditor = false">取消</button>
            <button class="save-profile-btn" @click="saveWechatProfile">保存资料</button>
          </view>
        </view>
      </view>

      <!-- Quick Stats -->
      <view class="stats-grid">
        <view class="stat-card" @click="goToFoodieBuddy">
          <text class="stat-value">{{ stats.orders }}</text>
          <text class="stat-label">饭搭子</text>
        </view>
        <view class="stat-card" @click="goToHistoryMenu">
          <text class="stat-value">{{ stats.recipes }}</text>
          <text class="stat-label">历史菜单</text>
        </view>
        <view class="stat-card" @click="goToFulfilledWishes">
          <text class="stat-value">{{ stats.fulfilled }}</text>
          <text class="stat-label">实现心愿</text>
        </view>
      </view>

      <!-- Piggy Orders Section -->
      <view class="orders-section">
        <view class="section-header">
          <uni-icons type="restaurant" size="24" color="#ffc2cc" />
          <text>猪猪订单</text>
          <view></view>
        </view>
        <view v-if="orderGroups.length === 0" style="padding: 16px; color: #777; text-align: center;">还没有待做的订单</view>
        <view v-for="group in orderGroups" :key="group.date" class="date-group">
          <view class="date-header">
            <text>{{ group.label }}</text>
          </view>
          <view class="orders-list">
            <view v-for="order in group.orders" :key="order.id" class="order-card">
              <view class="order-card-header">
                <text class="order-meta">共 {{ order.dishes.length }} 个菜 · {{ formatTime(order.createdAt) }} 下单</text>
                <view class="order-action" @click="markCompleted(order)">
                  <text>已完成</text>
                </view>
              </view>
              <view class="order-dishes">
                <view v-for="dish in order.dishes" :key="dish.itemId" class="dish-row"
                  @click="goToDishDetail(dish)">
                  <view class="order-icon" :style="dish.image ? {} : (dish.bgColor ? { background: dish.bgColor } : {})">
                    <image v-if="dish.image" class="order-image" :src="dish.image" mode="aspectFill" />
                  </view>
                  <view class="order-info">
                    <text class="order-name">{{ dish.name }} x{{ dish.quantity }}</text>
                    <text class="order-time">{{ dish.remark }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- Tab Bar -->
    <TabBar :current-index="3" @change="handleTabChange" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import TabBar from '@/components/TabBar.vue'
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue'
import { getCurrentUser, getDiningGroup, getMyDiningGroups, getGroupOrders, getOrders, refreshCurrentUser, updateOrderStatus, type FoodieOrder } from '@/services/foodieBuddy'
import { uploadToOSS } from '@/services/oss'
import { getCompletedCount } from '@/services/wishlist'

const userInfo = ref({
  name: '猪猪主人',
  id: '',
  avatar: '',
  wishCount: 0
})

const stats = ref({
  orders: 0,
  recipes: 0,
  fulfilled: 0
})

interface OrderDish {
  itemId?: number
  dishId?: number
  name: string
  remark: string
  quantity: number
  image?: string
  bgColor?: string
}

interface Order {
  id: number
  createdAt: string
  status: FoodieOrder['status']
  dishes: OrderDish[]
}

interface OrderDateGroup {
  date: string
  label: string
  orders: Order[]
}

const orderGroups = ref<OrderDateGroup[]>([])
const showProfileEditor = ref(false)
const profileForm = ref({
  nickname: '',
  avatar: ''
})
let hasPromptedWechatProfile = false

const formatDate = (date: string | Date) => {
  const d = new Date(date)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

// 老订单没有 cookDate，回退用创建日期分组
const cookDateOf = (order: FoodieOrder) => order.cookDate || formatDate(order.createdAt)

const dateLabel = (date: string) => (date === formatDate(new Date()) ? '今天' : date)

const formatTime = (dateText: string) => {
  const date = new Date(dateText)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const mapOrder = (order: FoodieOrder): Order => {
  return {
    id: order.id,
    createdAt: order.createdAt,
    status: order.status,
    dishes: (order.items || []).map((item) => ({
      itemId: item.id,
      dishId: item.dishId,
      name: item.dish?.name || order.orderNo,
      remark: item.remark || '',
      quantity: item.quantity || 1,
      image: item.dish?.image || '',
      bgColor: item.dish?.bgColor || ''
    }))
  }
}

const loadProfile = async () => {
  try {
    const user = await getCurrentUser()
    userInfo.value = {
      name: user.nickname || user.name || '猪猪主人',
      id: String(user.id),
      avatar: user.avatar || '',
      wishCount: 0
    }

    if (!hasPromptedWechatProfile && (!user.nickname || !user.avatar)) {
      hasPromptedWechatProfile = true
      uni.showModal({
        title: '同步微信资料',
        content: '是否同步微信昵称和头像？',
        confirmText: '去同步',
        success: (res) => {
          if (res.confirm) openProfileEditor()
        }
      })
    }

    const groups = await getMyDiningGroups(user.id)
    let buddyCount = 0
    const groupId = groups[0]?.id
    if (groupId) {
      const group = await getDiningGroup(groupId)
      buddyCount = (group.members || []).filter((member) => member.userId !== user.id).length
    }

    const [groupOrders, myOrders, myCompletedOrders, fulfilledCount] = await Promise.all([
      groupId
        ? getGroupOrders(groupId, { page: 1, pageSize: 100 })
        : Promise.resolve({ list: [] as FoodieOrder[] }),
      getOrders({ userId: user.id, page: 1, pageSize: 50 }),
      getOrders({ userId: user.id, status: 'completed', page: 1, pageSize: 100 }),
      getCompletedCount()
    ])

    const allCompletedOrders = [...myCompletedOrders.list, ...groupOrders.list]
    const uniqueCompletedOrders = Array.from(new Map(allCompletedOrders.map((order) => [order.id, order])).values())
    const completedCount = uniqueCompletedOrders.filter((order) => order.status === 'completed').length

    stats.value = {
      orders: buddyCount,
      recipes: completedCount,
      fulfilled: fulfilledCount
    }

    const allOrders = [...groupOrders.list, ...myOrders.list]
    const uniqueOrders = Array.from(new Map(allOrders.map((order) => [order.id, order])).values())
    const pending = uniqueOrders.filter((order) => order.status !== 'completed')

    const map = new Map<string, Order[]>()
    pending.forEach((order) => {
      const date = cookDateOf(order)
      if (!map.has(date)) map.set(date, [])
      map.get(date)!.push(mapOrder(order))
    })
    // 做菜日期升序：快到的做菜日排在上面
    orderGroups.value = Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, orders]) => ({ date, label: dateLabel(date), orders }))
  } catch (err: any) {
    uni.showToast({ title: err.message || '资料加载失败', icon: 'none' })
  }
}

const openProfileEditor = () => {
  profileForm.value = {
    nickname: userInfo.value.name === '猪猪主人' ? '' : userInfo.value.name,
    avatar: userInfo.value.avatar
  }
  showProfileEditor.value = true
}

const onChooseAvatar = async (event: any) => {
  const localAvatar = event.detail?.avatarUrl
  if (!localAvatar) return

  try {
    uni.showLoading({ title: '上传头像...' })
    profileForm.value.avatar = await uploadToOSS(localAvatar, 'avatars')
  } catch (err: any) {
    uni.showToast({ title: err.message || '头像上传失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const saveWechatProfile = async () => {
  const nickname = profileForm.value.nickname.trim()
  if (!nickname) {
    uni.showToast({ title: '请输入微信昵称', icon: 'none' })
    return
  }

  try {
    const user = await refreshCurrentUser({
      nickname,
      avatar: profileForm.value.avatar
    })
    userInfo.value = {
      name: user.nickname || user.name || '猪猪主人',
      id: String(user.id),
      avatar: user.avatar || '',
      wishCount: userInfo.value.wishCount
    }
    showProfileEditor.value = false
    uni.showToast({ title: '微信资料已保存', icon: 'success' })
  } catch (err: any) {
    uni.showToast({ title: err.message || '保存失败', icon: 'none' })
  }
}

const goToSettings = () => {
  uni.navigateTo({ url: '/pages/about/index' })
}

const goToDishDetail = (dish: OrderDish) => {
  if (!dish.dishId) return
  uni.navigateTo({
    url: `/pages/dish-detail/index?id=${dish.dishId}`
  })
}

const markCompleted = async (order: Order) => {
  if (order.status === 'completed') return
  try {
    await updateOrderStatus(order.id, 'completed')
    uni.showToast({ title: '已标记完成', icon: 'success' })
    // 猪猪订单只展示未完成订单，重新拉取让该单移入历史菜单
    await loadProfile()
  } catch (err: any) {
    uni.showToast({ title: err.message || '操作失败', icon: 'none' })
  }
}

const goToHistoryMenu = () => {
  uni.navigateTo({ url: '/pages/history-menu/index' })
}

const goToFulfilledWishes = () => {
  uni.navigateTo({ url: '/pages/fulfilled-wishes/index' })
}

onShow(loadProfile)

const goToFoodieBuddy = () => {
  uni.navigateTo({ url: '/pages/foodie-buddy/index' })
}

const handleTabChange = (index: number) => {
  if (index === 0) {
    uni.reLaunch({ url: '/pages/index/index' })
  } else if (index === 1) {
    uni.reLaunch({ url: '/pages/expiry/index' })
  } else if (index === 2) {
    uni.reLaunch({ url: '/pages/food-menu/index' })
  } else if (index === 3) {
    // Stay on current page
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #F8F5F6;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  padding-top: calc(16px + var(--status-bar-height));
  background: rgba(248, 245, 246, 0.8);
  position: sticky;
  top: 0;
  z-index: 10;
}

.placeholder {
  width: 40px;
}

.settings-btn {
  width: 40px;
  height: 40px;
  background: rgba(255, 194, 204, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title {
  flex: 1;
  text-align: center;
}

.title text {
  font-size: 18px;
  font-weight: 700;
}

.content {
  flex: 1;
  padding-bottom: calc(88px + env(safe-area-inset-bottom));
}

.profile-card {
  padding: 24px 16px;
}

.profile-header {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 194, 204, 0.1);
  display: flex;
  align-items: center;
}

.avatar-section {
  display: flex;
  align-items: center;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 2px solid #ffc2cc;
  overflow: hidden;
  position: relative;
}

.avatar-img {
  width: 100%;
  height: 100%;
}

.avatar-placeholder {
  background: linear-gradient(135deg, #ffc2cc 0%, #f8a5b4 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 28px;
  height: 28px;
  background: #ffc2cc;
  border-radius: 50%;
  border: 2px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 16px;
}

.user-name {
  font-size: 20px;
  font-weight: 700;
  color: #111;
}

.user-id {
  font-size: 14px;
  color: #777;
}

.wish-count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(255, 194, 204, 0.1);
  border-radius: 999px;
  margin-top: 8px;
}

.wish-count text:last-child {
  font-size: 12px;
  font-weight: 500;
  color: #ffc2cc;
}

.sync-profile-btn {
  width: fit-content;
  margin: 8px 0 0;
  padding: 0 12px;
  height: 28px;
  line-height: 28px;
  border-radius: 999px;
  background: rgba(255, 194, 204, 0.16);
  color: #f08da0;
  font-size: 12px;
}

.sync-profile-btn::after {
  border: none;
}

.profile-editor {
  margin: 0 16px 24px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 194, 204, 0.1);
}

.avatar-picker {
  height: 48px;
  line-height: 48px;
  margin: 0 0 12px;
  border-radius: 8px;
  background: rgba(255, 194, 204, 0.12);
  color: #f08da0;
  font-size: 14px;
}

.avatar-picker::after {
  border: none;
}

.editor-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  vertical-align: middle;
}

.nickname-input {
  height: 44px;
  padding: 0 12px;
  border-radius: 8px;
  background: #F8F5F6;
  font-size: 14px;
}

.profile-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.cancel-profile-btn,
.save-profile-btn {
  flex: 1;
  height: 36px;
  line-height: 36px;
  border-radius: 999px;
  font-size: 14px;
}

.cancel-profile-btn {
  background: #F8F5F6;
  color: #777;
}

.save-profile-btn {
  background: #ffc2cc;
  color: white;
}

.cancel-profile-btn::after,
.save-profile-btn::after {
  border: none;
}

.stats-grid {
  padding: 0 16px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-card {
  background: white;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 194, 204, 0.05);
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #111;
  display: block;
}

.stat-label {
  font-size: 12px;
  color: #777;
}

.orders-section {
  padding: 24px 16px 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 8px;
}

.section-header text:nth-child(2) {
  font-size: 18px;
  font-weight: 700;
  color: #111;
}

.view-all {
  font-size: 14px;
  color: #ffc2cc;
  font-weight: 500;
}

.date-group {
  margin-bottom: 16px;
}

.date-header {
  margin-bottom: 12px;
}

.date-header text {
  font-size: 14px;
  font-weight: 600;
  color: #777;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-card {
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 194, 204, 0.05);
}

.order-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.order-meta {
  font-size: 12px;
  color: #777;
}

.order-dishes {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dish-row {
  display: flex;
  align-items: center;
  gap: 16px;
  transition: background-color 0.2s;
}

.dish-row:active {
  background: rgba(255, 194, 204, 0.05);
}

.order-action {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 999px;
  background: #ffc2cc;
  color: white;
  font-size: 12px;
  font-weight: 600;
}

.order-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.order-image {
  width: 100%;
  height: 100%;
}

.order-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.order-name {
  font-size: 14px;
  font-weight: 600;
  color: #111;
}

.order-time {
  font-size: 12px;
  color: #777;
}

.order-price text {
  font-size: 16px;
  font-weight: 700;
  color: #ffc2cc;
}
</style>
