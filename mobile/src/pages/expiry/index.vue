<template>
  <view class="container" :style="themeStyle">
    <!-- Header -->
    <view class="header">
      <view class="back-btn" @click="goBack">
        <uni-icons type="left" size="24" color="#333" />
      </view>
      <view class="title">
        <text>到期管家</text>
      </view>
      <view class="header-placeholder"></view>
    </view>

    <!-- 提醒授权提示：额度为 0 时出现。微信一次授权只能推一条，
         推送消耗掉额度后这条会自动回来，提示用户续授权 -->
    <view v-if="showSubscribeTip" class="subscribe-tip">
      <uni-icons type="notification" size="18" color="#333" />
      <text class="subscribe-text">开启微信提醒，物品到期前通知你</text>
      <view class="subscribe-btn" @click="openSubscribe">
        <text>开启</text>
      </view>
      <view class="subscribe-close" @click="tipDismissed = true">
        <uni-icons type="closeempty" size="16" color="#999" />
      </view>
    </view>

    <!-- Search -->
    <view v-if="searchVisible" class="search-bar">
      <uni-icons type="search" size="18" color="#999" />
      <input
        v-model="keyword"
        class="search-input"
        placeholder="试试「快过期的感冒药」"
        confirm-type="search"
        @confirm="runSearch"
      />
    </view>

    <!-- Tabs -->
    <view v-if="!searching" class="tabs">
      <view
        v-for="(tab, index) in tabs"
        :key="index"
        class="tab"
        :class="{ active: currentTab === index }"
        @click="currentTab = index"
      >
        <text>{{ tab }}</text>
      </view>
      <view class="tab-search-btn" @click="toggleSearch">
        <uni-icons type="search" size="20" color="#333" />
      </view>
    </view>

    <!-- Content -->
    <view class="content">
      <view v-if="loading" class="state-text">
        <text>加载中...</text>
      </view>
      <view v-else-if="!filteredItems.length" class="state-text">
        <text>{{ searching ? '没有搜到相关物品' : '暂无物品记录' }}</text>
      </view>
      <view v-for="item in filteredItems" :key="item.id" class="item-card" @click="goToDetail(item)">
        <view class="item-image" :style="{ backgroundColor: item.bgColor || '#ffc2cc' }">
          <image v-if="item.imageUrl" class="food-img" :src="item.imageUrl" mode="aspectFill" />
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
            <text>到期日期: {{ item.expiryDate }}</text>
          </view>
          <view class="item-date">
            <uni-icons type="notification" size="14" color="#777" />
            <text>{{ remindText(item) }}</text>
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
import { ref, computed, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import TabBar from '@/components/TabBar.vue'
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue'
import {
  getAllItems,
  getExpiringItems,
  getExpiredItems,
  searchItems,
  ensureSubscribe,
  getReminderQuota,
  type ExpiryItem
} from '@/services/expiry'
import { themeStyle } from '@/utils/theme'

const tabs = ['全部', '即将到期', '已过期']
const currentTab = ref(0)

const items = ref<ExpiryItem[]>([])
const loading = ref(false)

/** 剩余推送额度，0 表示没授权过或额度已被推送消耗完 */
const quota = ref(0)
/** 用户手动关掉提示条后，本次进入页面不再打扰 */
const tipDismissed = ref(false)
const showSubscribeTip = computed(() => quota.value === 0 && !tipDismissed.value)

const searchVisible = ref(false)
const keyword = ref('')
/** 搜索态：搜索框有内容时列表展示搜索结果而不是分页列表 */
const searching = computed(() => searchVisible.value && !!keyword.value.trim())

const filteredItems = items

const loadList = async () => {
  loading.value = true
  try {
    if (currentTab.value === 1) {
      items.value = await getExpiringItems()
    } else if (currentTab.value === 2) {
      items.value = await getExpiredItems()
    } else {
      items.value = await getAllItems()
    }
  } catch (err: any) {
    uni.showToast({ title: err.message || '物品加载失败', icon: 'none' })
    items.value = []
  } finally {
    loading.value = false
  }
}

const runSearch = async () => {
  const text = keyword.value.trim()
  if (!text) {
    await loadList()
    return
  }
  loading.value = true
  try {
    const res = await searchItems(text)
    items.value = res.list
  } catch (err: any) {
    uni.showToast({ title: err.message || '搜索失败', icon: 'none' })
    items.value = []
  } finally {
    loading.value = false
  }
}

const toggleSearch = () => {
  searchVisible.value = !searchVisible.value
  if (!searchVisible.value && keyword.value) {
    keyword.value = ''
    loadList()
  }
}

const openSubscribe = async () => {
  try {
    const ok = await ensureSubscribe()
    uni.showToast({
      title: ok ? '已开启到期提醒' : '未开启提醒',
      icon: 'none'
    })
    if (ok) quota.value = await getReminderQuota()
  } catch (err: any) {
    uni.showToast({ title: err.message || '开启失败', icon: 'none' })
  }
}

const remindText = (item: ExpiryItem) =>
  item.remindDays > 0 ? `提前 ${item.remindDays} 天提醒` : '到期当天提醒'

watch(currentTab, loadList)
onShow(() => {
  if (!searching.value) loadList()
  // 额度可能被后台推送消耗掉，每次进页面都重新取一次
  getReminderQuota()
    .then((remaining) => (quota.value = remaining))
    .catch(() => {})
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

const goToDetail = (item: ExpiryItem) => {
  uni.navigateTo({
    url: `/pages/dish-detail/index?id=${item.id}&mode=expiry`
  })
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--theme-bg);
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
  border-bottom: 1px solid var(--theme-primary-light);
  z-index: 10;
}

.back-btn {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.header-placeholder {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
}

.tab-search-btn {
  margin-left: auto;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 16px 0;
  padding: 0 12px;
  height: 40px;
  background: white;
  border-radius: 999px;
  border: 1px solid var(--theme-primary-lighter);
}

.subscribe-tip {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 16px 0;
  padding: 0 12px;
  height: 40px;
  background: white;
  border-radius: 999px;
  border: 1px solid var(--theme-primary-lighter);
}

.subscribe-text {
  flex: 1;
  font-size: 13px;
  color: #1f1a1b;
}

.subscribe-btn {
  padding: 0 12px;
  height: 26px;
  display: flex;
  align-items: center;
  border-radius: 999px;
  background: var(--theme-primary);
}

.subscribe-btn text {
  font-size: 12px;
  font-weight: 600;
  color: #1f1a1b;
}

.subscribe-close {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-input {
  flex: 1;
  height: 40px;
  font-size: 14px;
  color: #1f1a1b;
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
  border-bottom: 1px solid var(--theme-primary-light);
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
  border-bottom: 3px solid var(--theme-primary);
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

.state-text {
  padding: 48px 0;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.item-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--theme-primary-lighter);
}

.item-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.food-img {
  position: absolute;
  top: 0;
  left: 0;
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
  z-index: 1;
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
  background: var(--theme-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(var(--theme-primary-rgb), 0.4);
  z-index: 50;
}
</style>
