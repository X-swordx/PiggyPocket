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
              <view class="avatar-img" style="background: linear-gradient(135deg, #ffc2cc 0%, #f8a5b4 100%); display: flex; align-items: center; justify-content: center;">
                <uni-icons type="person-filled" size="40" color="#fff" />
              </view>
              <view class="avatar-badge">
                <uni-icons type="wallet-filled" size="12" color="#fff" />
              </view>
            </view>
          </view>
          <view class="profile-info">
            <text class="user-name">{{ userInfo.name }}</text>
            <text class="user-id">ID: {{ userInfo.id }}</text>
            <view class="wish-count">
              <uni-icons type="heart-filled" size="14" color="#ffc2cc" />
              <text>{{ userInfo.wishCount }} 个美食愿望</text>
            </view>
          </view>
        </view>
      </view>

      <!-- Quick Stats -->
      <view class="stats-grid">
        <view class="stat-card">
          <text class="stat-value">{{ stats.orders }}</text>
          <text class="stat-label">已下单</text>
        </view>
        <view class="stat-card">
          <text class="stat-value">{{ stats.recipes }}</text>
          <text class="stat-label">我的菜谱</text>
        </view>
        <view class="stat-card">
          <text class="stat-value">{{ stats.wishlist }}</text>
          <text class="stat-label">心愿单</text>
        </view>
      </view>

      <!-- Today's Orders Section -->
      <view class="orders-section">
        <view class="section-header">
          <uni-icons type="restaurant" size="24" color="#ffc2cc" />
          <text>今日订单</text>
          <view></view>
        </view>
        <view class="orders-list">
          <view v-for="(order, index) in todayOrders" :key="index" class="order-item" @click="goToDishDetail(order)">
            <view class="order-icon" v-if="index === 0" style="background: #f0b7a4;">
            </view>
            <view class="order-icon" v-else style="background: #a8d5ba;">
            </view>
            <view class="order-info">
              <text class="order-name">{{ order.name }}</text>
              <text class="order-time">已下单 · {{ order.time }}</text>
            </view>
            <view class="order-price">
              <text>¥{{ order.price }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- Spacer for Tab Bar -->
      <view style="height: 100px;"></view>
    </scroll-view>

    <!-- Tab Bar -->
    <TabBar :current-index="3" @change="handleTabChange" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TabBar from '@/components/TabBar.vue'
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue'

const userInfo = ref({
  name: '猪猪主人',
  id: '88886666',
  wishCount: 128
})

const stats = ref({
  orders: 12,
  recipes: 25,
  wishlist: 8
})

interface Order {
  name: string
  time: string
  price: string
}

const todayOrders = ref<Order[]>([
  {
    name: '番茄培根意面',
    time: '12:30',
    price: '32'
  },
  {
    name: '田园蔬果沙拉',
    time: '10:15',
    price: '28'
  }
])

const goToSettings = () => {
  uni.showToast({ title: '设置功能开发中', icon: 'none' })
}

const goToDishDetail = (order: any) => {
  // 跳转到菜品详情页，传递菜品名称
  uni.navigateTo({
    url: `/pages/dish-detail/index?name=${encodeURIComponent(order.name)}`
  })
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
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
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
  padding-bottom: 24px;
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
  transition: background-color 0.2s;
}

.order-item:active {
  background: rgba(255, 194, 204, 0.05);
  transform: scale(0.995);
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
