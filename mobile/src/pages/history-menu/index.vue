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
          <view v-for="order in group.orders" :key="order.id" class="order-item" @click="goToDishDetail(order)">
            <view class="order-icon" :style="order.image ? {} : (order.bgColor ? { background: order.bgColor } : {})">
              <image v-if="order.image" class="order-image" :src="order.image" mode="aspectFill" />
            </view>
            <view class="order-info">
              <text class="order-name">{{ order.name }} x{{ order.quantity }}</text>
              <text class="order-time">{{ order.remark || '已完成' }}</text>
            </view>
            <view class="order-action done">
              <uni-icons type="checkmark-filled" size="14" color="#fff" />
              <text>已完成</text>
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

interface HistoryOrder {
  id: number
  dishId?: number
  name: string
  remark: string
  quantity: number
  image?: string
  bgColor?: string
  createdAt: string
  cookDate?: string
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
  const firstItem = order.items?.[0]
  return {
    id: order.id,
    dishId: firstItem?.dishId,
    name: firstItem?.dish?.name || order.orderNo,
    remark: firstItem?.remark || '',
    quantity: firstItem?.quantity || 1,
    image: firstItem?.dish?.image || '',
    bgColor: firstItem?.dish?.bgColor || '',
    createdAt: order.createdAt,
    cookDate: order.cookDate
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

const goToDishDetail = (order: HistoryOrder) => {
  if (!order.dishId) return
  uni.navigateTo({
    url: `/pages/dish-detail/index?id=${order.dishId}`
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

.order-item {
  background: white;
  padding: 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 194, 204, 0.05);
  opacity: 0.85;
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
