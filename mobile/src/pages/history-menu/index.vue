<template>
  <view class="container" :style="themeStyle">
    <!-- Header -->
    <view class="header">
      <view class="back-btn" @click="goBack">
        <uni-icons type="left" size="24" color="#333" />
      </view>
      <view class="title">
        <text>历史菜单</text>
      </view>
    </view>

    <scroll-view scroll-y class="content">
      <view v-if="groups.length === 0" style="padding: 32px; text-align: center; color: #777;">还没有已完成的历史菜单</view>
      <view v-for="group in groups" :key="group.date" class="date-group">
        <view class="date-header">
          <text>{{ group.label }}</text>
        </view>
        <view class="orders-list">
          <view v-for="order in group.orders" :key="order.id" class="order-card">
            <view class="order-card-header">
              <text class="order-meta">共 {{ order.dishes.length }} 个菜</text>
              <view class="order-rating-row">
                <view v-if="order.rating" class="stars-display">
                  <uni-icons
                    v-for="n in 5"
                    :key="n"
                    :type="n <= order.rating ? 'star-filled' : 'star'"
                    size="14"
                    color="#f59e0b"
                  />
                </view>
                <view v-else class="order-action rate" @click="openRating(order)">
                  <text>去评价</text>
                </view>
                <view class="order-action done">
                  <uni-icons type="checkmark-filled" size="14" color="#fff" />
                  <text>已完成</text>
                </view>
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
      <view style="height: 100px;"></view>
    </scroll-view>

    <!-- Rating Modal -->
    <view v-if="ratingOrder" class="rating-mask" @click="cancelRating">
      <view class="rating-sheet" @click.stop="">
        <view class="rating-title">
          <text>订单评价</text>
        </view>
        <view class="rating-stars">
          <uni-icons
            v-for="n in 5"
            :key="n"
            :type="n <= ratingValue ? 'star-filled' : 'star'"
            size="36"
            color="#f59e0b"
            @click="setRating(n)"
          />
        </view>
        <view class="rating-actions">
          <view class="rating-btn cancel" @click="cancelRating">
            <text>取消</text>
          </view>
          <view
            class="rating-btn confirm"
            :class="{ disabled: ratingValue < 1 || submittingRating }"
            @click="confirmRating"
          >
            <text>{{ submittingRating ? '提交中...' : '确认' }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue'
import { getCurrentUser, getMyDiningGroups, getGroupOrders, getOrders, updateOrderRating, type FoodieOrder } from '@/services/foodieBuddy'
import { themeStyle } from '@/utils/theme'

interface HistoryDish {
  itemId?: number
  dishId?: number
  name: string
  remark: string
  quantity: number
  image?: string
  bgColor?: string
}

interface HistoryOrder {
  id: number
  createdAt: string
  cookDate?: string
  rating?: number
  dishes: HistoryDish[]
}

interface DateGroup {
  date: string
  label: string
  orders: HistoryOrder[]
}

const groups = ref<DateGroup[]>([])

const formatDate = (dateText: string) => {
  const d = new Date(dateText)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const mapOrder = (order: FoodieOrder): HistoryOrder => {
  return {
    id: order.id,
    createdAt: order.createdAt,
    cookDate: order.cookDate,
    rating: order.rating,
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

const loadHistory = async () => {
  try {
    const user = await getCurrentUser()
    const diningGroups = await getMyDiningGroups(user.id)
    const groupId = diningGroups[0]?.id
    const [myOrders, groupOrders] = await Promise.all([
      getOrders({ userId: user.id, status: 'completed', page: 1, pageSize: 100 }),
      groupId
        ? getGroupOrders(groupId, { page: 1, pageSize: 100 })
        : Promise.resolve({ list: [] as FoodieOrder[] })
    ])
    const allOrders = [...myOrders.list, ...groupOrders.list]
    const uniqueOrders = Array.from(new Map(allOrders.map((order) => [order.id, order])).values())
    const orders = uniqueOrders.filter((order) => order.status === 'completed').map(mapOrder)
    const map = new Map<string, HistoryOrder[]>()
    orders.forEach((o) => {
      // 老订单没有 cookDate，回退用创建日期分组
      const date = o.cookDate || formatDate(o.createdAt)
      if (!map.has(date)) map.set(date, [])
      map.get(date)!.push(o)
    })
    // 做菜日期降序：最近做的排在上面
    groups.value = Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, list]) => ({
        date,
        label: date,
        orders: list
      }))
  } catch (err: any) {
    uni.showToast({ title: err.message || '加载失败', icon: 'none' })
  }
}

const goBack = () => {
  uni.navigateBack()
}

const ratingOrder = ref<HistoryOrder | null>(null)
const ratingValue = ref(0)
const submittingRating = ref(false)

const openRating = (order: HistoryOrder) => {
  ratingOrder.value = order
  ratingValue.value = order.rating || 0
}

const setRating = (n: number) => {
  ratingValue.value = n
}

const cancelRating = () => {
  ratingOrder.value = null
  ratingValue.value = 0
}

const confirmRating = async () => {
  if (!ratingOrder.value || ratingValue.value < 1) return
  submittingRating.value = true
  try {
    const user = await getCurrentUser()
    await updateOrderRating(ratingOrder.value.id, user.id, ratingValue.value)
    uni.showToast({ title: '评价已提交', icon: 'success' })
    ratingOrder.value = null
    ratingValue.value = 0
    await loadHistory()
  } catch (err: any) {
    uni.showToast({ title: err.message || '评价失败', icon: 'none' })
  } finally {
    submittingRating.value = false
  }
}

const goToDishDetail = (dish: HistoryDish) => {
  if (!dish.dishId) return
  uni.navigateTo({
    url: `/pages/dish-detail/index?id=${dish.dishId}&readonly=1`
  })
}

onShow(loadHistory)
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: var(--theme-bg);
}

.header {
  display: flex;
  align-items: center;
  padding: 16px;
  padding-top: calc(16px + var(--status-bar-height));
  background: rgba(248, 245, 246, 0.8);
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid var(--theme-primary-light);
}

.back-btn {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
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
  padding-bottom: 24px;
}

.date-group {
  padding: 16px 16px 0;
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
  border: 1px solid var(--theme-primary-lightest);
  opacity: 0.85;
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

.order-action {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 999px;
  background: #e5e7eb;
  color: #9ca3af;
  font-size: 12px;
  font-weight: 600;
}

.order-action.done {
  background: #e5e7eb;
  color: #9ca3af;
}

.order-rating-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stars-display {
  display: flex;
  align-items: center;
  gap: 2px;
}

.order-action.rate {
  background: var(--theme-primary);
  color: white;
}

.rating-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 200;
}

.rating-sheet {
  width: 100%;
  background: white;
  border-radius: 20px 20px 0 0;
  padding: 24px 16px calc(24px + env(safe-area-inset-bottom));
}

.rating-title {
  text-align: center;
  margin-bottom: 24px;
}

.rating-title text {
  font-size: 18px;
  font-weight: 700;
  color: #111;
}

.rating-stars {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 32px;
}

.rating-actions {
  display: flex;
  gap: 12px;
}

.rating-btn {
  flex: 1;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
}

.rating-btn.cancel {
  background: #f3f4f6;
  color: #6b7280;
}

.rating-btn.confirm {
  background: var(--theme-primary);
  color: white;
}

.rating-btn.confirm.disabled {
  opacity: 0.5;
}
</style>
