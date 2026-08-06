<template>
  <view class="container">
    <!-- Header -->
    <view class="header">
      <view class="back-btn" @click="goBack">
        <uni-icons type="left" size="24" color="#333" />
      </view>
      <view class="title">
        <text>我的订单</text>
      </view>
    </view>

    <!-- Order Items -->
    <scroll-view scroll-y class="content">
      <view class="section-header">
        <text>做菜日期</text>
      </view>
      <view class="cook-date">
        <picker mode="date" :value="cookDate" @change="onCookDateChange" class="picker-wrapper">
          <view class="picker-display">
            <uni-icons type="calendar" size="20" color="#ffc2cc" />
            <text>{{ cookDate }}</text>
          </view>
        </picker>
      </view>

      <view class="section-header">
        <text>已选菜品</text>
      </view>
      <view class="order-list">
        <view v-if="orderItems.length === 0" style="padding: 24px; text-align: center; color: #777;">暂无已选菜品</view>
        <view v-for="(item, index) in orderItems" :key="item.dishId" class="order-item">
          <view class="item-image" :style="item.image ? {} : { background: item.bgColor }">
            <image v-if="item.image" class="item-img" :src="item.image" mode="aspectFill" />
          </view>
          <view class="item-info">
            <text class="item-name">{{ item.name }}</text>
            <input class="remark-input" v-model="item.remark" placeholder="添加备注..." />
          </view>
          <view class="quantity-control">
            <view class="qty-btn qty-minus" @click="decreaseQty(index)">
              <uni-icons type="minus" size="24" color="#333" />
            </view>
            <text class="qty-number">{{ item.quantity }}</text>
            <view class="qty-btn qty-plus" @click="increaseQty(index)">
              <uni-icons type="plus" size="24" color="#333" />
            </view>
          </view>
        </view>
      </view>

      <!-- Spacer for fixed footer -->
      <view style="height: 120px;"></view>
    </scroll-view>

    <!-- Footer Summary -->
    <view class="footer">
      <view class="footer-content">
        <view class="summary">
          <text class="summary-label">合计</text>
          <text class="summary-value">共 {{ totalItems }} 道菜</text>
        </view>
        <view class="confirm-btn" @click="confirmOrder">
          <uni-icons type="shopping-cart-filled" size="20" color="#fff" />
          <text>确认下单</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue'
import {
  createOrder,
  getCurrentUser,
  getMyDiningGroups,
  SELECTED_DISHES_KEY,
  type SelectedDish
} from '@/services/foodieBuddy'

interface OrderItem {
  dishId: number
  name: string
  remark: string
  quantity: number
  bgColor: string
  image?: string
}

const orderItems = ref<OrderItem[]>([])
const submitting = ref(false)

const todayString = () => {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

const cookDate = ref(todayString())

const totalItems = computed(() => orderItems.value.reduce((sum, item) => sum + item.quantity, 0))

onLoad(() => {
  const selectedDishes = (uni.getStorageSync(SELECTED_DISHES_KEY) || []) as SelectedDish[]
  orderItems.value = selectedDishes.map((dish) => ({
    dishId: dish.id,
    name: dish.name,
    remark: '',
    quantity: 1,
    bgColor: dish.bgColor,
    image: dish.image
  }))
})

const goBack = () => {
  uni.navigateBack()
}

const onCookDateChange = (event: any) => {
  cookDate.value = event.detail.value
}

const decreaseQty = (index: number) => {
  if (orderItems.value[index].quantity > 1) {
    orderItems.value[index].quantity--
  } else {
    orderItems.value.splice(index, 1)
  }
}

const increaseQty = (index: number) => {
  orderItems.value[index].quantity++
}

const confirmOrder = async () => {
  if (submitting.value) return
  if (orderItems.value.length === 0) {
    uni.showToast({ title: '请先选择菜品', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    const user = await getCurrentUser()
    const groups = await getMyDiningGroups(user.id)
    await createOrder({
      userId: user.id,
      groupId: groups[0]?.id,
      cookDate: cookDate.value,
      items: orderItems.value.map((item) => ({
        dishId: item.dishId,
        quantity: item.quantity,
        remark: item.remark
      }))
    })
    uni.removeStorageSync(SELECTED_DISHES_KEY)
    uni.showToast({ title: '订单已提交', icon: 'success' })
    setTimeout(() => uni.reLaunch({ url: '/pages/profile/index' }), 800)
  } catch (err: any) {
    uni.showToast({ title: err.message || '下单失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
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
  flex: 1;
  padding-bottom: 16px;
}

.section-header {
  padding: 16px;
}

.section-header text {
  font-size: 20px;
  font-weight: 700;
  color: #111;
}

.order-list {
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cook-date {
  padding: 0 16px;
}

.picker-wrapper {
  display: block;
  width: 100%;
}

.picker-display {
  width: 100%;
  padding: 16px;
  min-height: 56px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1px solid rgba(255, 194, 204, 0.2);
  border-radius: 12px;
  box-sizing: border-box;
}

.picker-display text {
  font-size: 16px;
  color: #111;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 194, 204, 0.05);
}

.item-image {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  border: 1px solid rgba(255, 194, 204, 0.1);
  overflow: hidden;
  flex-shrink: 0;
}

.item-img {
  width: 100%;
  height: 100%;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.item-name {
  font-size: 16px;
  font-weight: 600;
  color: #111;
}

.remark-input {
  flex: 1;
  font-size: 14px;
  color: #333;
  padding: 4px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  min-width: 100px;
  margin-top: 2px;
}

.remark-input:focus {
  outline: none;
  border-color: #ffc2cc;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qty-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qty-minus {
  background: rgba(255, 194, 204, 0.2);
}

.qty-plus {
  background: #ffc2cc;
}

.qty-number {
  font-size: 16px;
  font-weight: 600;
  color: #111;
  width: 16px;
  text-align: center;
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);
}

.footer-content {
  padding: 16px;
  background: rgba(255, 255, 255, 0.9);
  border-top: 1px solid rgba(255, 194, 204, 0.1);
}

.summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.summary-label {
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
}

.summary-value {
  font-size: 18px;
  font-weight: 600;
  color: #111;
}

.confirm-btn {
  width: 100%;
  height: 56px;
  background: #ffc2cc;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
  color: white;
  box-shadow: 0 4px 12px rgba(255, 194, 204, 0.3);
}
</style>
