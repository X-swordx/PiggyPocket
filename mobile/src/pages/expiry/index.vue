<template>
  <view class="container">
    <!-- Header -->
    <view class="header">
      <view class="back-btn" @click="goBack">
        <uni-icons type="left" size="24" color="#333" />
      </view>
      <view class="title">
        <text>临期食品</text>
      </view>
      <view class="search-btn">
        <uni-icons type="search" size="24" color="#333" />
      </view>
    </view>

    <!-- Tabs -->
    <view class="tabs">
      <view
        v-for="(tab, index) in tabs"
        :key="index"
        class="tab"
        :class="{ active: currentTab === index }"
        @click="currentTab = index"
      >
        <text>{{ tab }}</text>
      </view>
    </view>

    <!-- Content -->
    <view class="content">
      <view v-for="(item, index) in filteredItems" :key="index" class="item-card" @click="goToDetail(item)">
        <view class="item-image" :style="{ backgroundColor: item.bgColor }">
          <view class="status-dot" :class="item.status"></view>
        </view>
        <view class="item-info">
          <view class="item-header">
            <view class="status-badge" :class="item.status">
              <text>{{ item.statusText }}</text>
            </view>
            <text class="days-text">{{ item.daysText }}</text>
          </view>
          <text class="item-name">{{ item.name }}</text>
          <view class="item-date">
            <uni-icons type="calendar" size="14" color="#777" />
            <text>过期日期: {{ item.expiryDate }}</text>
          </view>
        </view>
      </view>

      <!-- Padding for bottom -->
      <view style="height: 120px;"></view>
    </view>

    <!-- Floating Add Button -->
    <view class="fab" @click="addItem">
      <uni-icons type="plus" size="32" color="#333" />
    </view>

    <!-- Tab Bar -->
    <TabBar :current-index="1" @change="handleTabChange" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TabBar from '@/components/TabBar.vue'
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue'

interface FoodItem {
  name: string
  expiryDate: string
  daysText: string
  status: 'fresh' | 'expiring' | 'expired'
  statusText: string
  tab: number
  bgColor: string
}

const tabs = ['全部', '即将过期', '已过期']
const currentTab = ref(0)

const items = ref<FoodItem[]>([
  {
    name: '全脂牛奶 (1L)',
    expiryDate: '2023-10-25',
    daysText: '2天后过期',
    status: 'expiring',
    statusText: '即将过期',
    tab: 1,
    bgColor: '#8aa6cb'
  },
  {
    name: '有机牛油果',
    expiryDate: '2023-11-05',
    daysText: '12天后过期',
    status: 'fresh',
    statusText: '新鲜',
    tab: 0,
    bgColor: '#a8d5ba'
  },
  {
    name: '酸种面包',
    expiryDate: '2023-10-28',
    daysText: '5天后过期',
    status: 'fresh',
    statusText: '新鲜',
    tab: 0,
    bgColor: '#d4a373'
  },
  {
    name: '蓝莓酸奶',
    expiryDate: '2023-10-24',
    daysText: '明天',
    status: 'expiring',
    statusText: '即将过期',
    tab: 1,
    bgColor: '#a88fca'
  }
])

const filteredItems = computed(() => {
  if (currentTab.value === 0) {
    return items.value
  }
  return items.value.filter(item => item.tab === currentTab.value)
})

const goBack = () => {
  uni.navigateBack()
}

const addItem = () => {
  uni.navigateTo({
    url: '/pages/add-food/index'
  })
}

const handleTabChange = (index: number) => {
  if (index === 0) {
    uni.reLaunch({ url: '/pages/index/index' })
  } else if (index === 1) {
    // Stay on current page
  } else if (index === 2) {
    uni.reLaunch({ url: '/pages/food-menu/index' })
  } else if (index === 3) {
    uni.reLaunch({ url: '/pages/profile/index' })
  }
}

const goToDetail = (item: FoodItem) => {
  uni.navigateTo({
    url: `/pages/dish-detail/index?name=${encodeURIComponent(item.name)}&expiryDate=${encodeURIComponent(item.expiryDate)}&status=${encodeURIComponent(item.status)}&statusText=${encodeURIComponent(item.statusText)}&daysText=${encodeURIComponent(item.daysText)}&bgColor=${encodeURIComponent(item.bgColor)}`
  })
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #F8F5F6;
}

.header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 16px;
  padding-top: calc(16px + var(--status-bar-height));
  background: rgba(248, 245, 246, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 194, 204, 0.2);
  z-index: 10;
}

.back-btn, .search-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.title {
  flex: 1;
  text-align: center;
}

.title text {
  font-size: 20px;
  font-weight: 700;
  color: #1f1a1b;
}

.tabs {
  flex-shrink: 0;
  display: flex;
  padding: 16px;
  background: rgba(248, 245, 246, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 194, 204, 0.2);
  gap: 24px;
  position: sticky;
  top: 0;
  z-index: 9;
}

.tab {
  padding-bottom: 12px;
  position: relative;
}

.tab text {
  font-size: 14px;
  color: #777;
  font-weight: 500;
}

.tab.active text {
  font-weight: 700;
  color: #1f1a1b;
}

.tab.active {
  border-bottom: 3px solid #ffc2cc;
}

.content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 140px;
}

.item-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 194, 204, 0.1);
}

.item-image {
  width: 80px;
  height: 80px;
  background: rgba(255, 194, 204, 0.1);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.food-img {
  width: 100%;
  height: 100%;
}

.status-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.fresh {
  background: #4ade80;
}

.status-dot.expiring {
  background: #fb923c;
}

.status-dot.expired {
  background: #f87171;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.status-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge.fresh {
  background: rgba(74, 222, 128, 0.1);
  color: #16a34a;
}

.status-badge.expiring {
  background: rgba(251, 146, 60, 0.1);
  color: #ea580c;
}

.status-badge.expired {
  background: rgba(248, 113, 113, 0.1);
  color: #dc2626;
}

.days-text {
  font-size: 12px;
  color: #999;
}

.item-name {
  font-size: 16px;
  font-weight: 700;
  color: #111;
}

.item-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #777;
}

.fab {
  position: fixed;
  bottom: 96px;
  right: 24px;
  width: 56px;
  height: 56px;
  background: #ffc2cc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(255, 194, 204, 0.4);
  z-index: 50;
}
</style>
