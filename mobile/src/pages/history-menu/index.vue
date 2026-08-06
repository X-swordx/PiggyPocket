<template>
  <view class="container">
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
              <view class="order-action done">
                <uni-icons type="checkmark-filled" size="14" color="#fff" />
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
      <view style="height: 100px;"></view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue'
import { getCurrentUser, getOrders, type FoodieOrder } from '@/services/foodieBuddy'

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
    const res = await getOrders({ userId: user.id, status: 'completed', page: 1, pageSize: 100 })
    const orders = res.list.map(mapOrder)
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
  background: #F8F5F6;
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
  border-bottom: 1px solid rgba(255, 194, 204, 0.2);
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
  border: 1px solid rgba(255, 194, 204, 0.05);
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
</style>
