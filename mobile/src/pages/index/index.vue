<template>
  <view class="container" :style="themeStyle">
    <!-- Header -->
    <view class="header">
      <view class="header-right">
        <view class="icon-btn" @click="openNotificationDrawer">
          <uni-icons type="notification" size="24" color="#333" />
          <view v-if="hasUnread" class="red-dot"></view>
        </view>
      </view>
      <view class="header-center">
        <text class="title">猪猪生活本</text>
      </view>
    </view>

    <!-- Main Content -->
    <view class="content">
      <!-- Announcement Bar -->
      <!-- <view class="announcement">
        <view class="announcement-icon">
          <uni-icons type="sound-filled" size="20" color="#fff" />
        </view>
        <view class="announcement-text">
          <text>最新：食品追踪新技巧已更新！</text>
        </view>
        <view class="announcement-arrow">
          <uni-icons type="right" size="20" color="#999" />
        </view>
      </view> -->

      <!-- Featured Cards -->
      <view class="cards">
        <!-- Food Tracker Card -->
        <view class="card" @click="navigateTo('/pages/expiry/index')">
          <view class="card-image">
            <view class="card-gradient"></view>
            <image class="card-img" src="/static/milk.png" mode="aspectFill" />
            <view class="card-icon-overlay">
              <uni-icons type="list" size="24" color="var(--theme-primary)" />
            </view>
          </view>
          <view class="card-content">
            <text class="card-title">临期食品</text>
            <view class="card-footer">
              <text class="card-desc">不再让零食过期。节省开支，减少浪费。</text>
              <view class="card-btn">
                <text>打开</text>
              </view>
            </view>
          </view>
        </view>

        <!-- Bucket List Card -->
        <view class="card" @click="navigateTo('/pages/wishlist/index')">
          <view class="card-image">
            <view class="card-gradient"></view>
            <image class="card-img" src="/static/buddha.png" mode="aspectFill" />
            <view class="card-icon-overlay">
              <uni-icons type="heart-filled" size="24" color="var(--theme-primary)" />
            </view>
          </view>
          <view class="card-content">
            <text class="card-title">心愿清单</text>
            <view class="card-footer">
              <text class="card-desc">怀揣梦想，记录微小进步，庆祝你的成长。</text>
              <view class="card-btn">
                <text>查看</text>
              </view>
            </view>
          </view>
        </view>

        <!-- Daily Menu Card -->
        <view class="card" @click="navigateTo('/pages/food-menu/index')">
          <view class="card-image">
            <view class="card-gradient"></view>
            <image class="card-img" src="/static/pasta.png" mode="aspectFill" />
            <view class="card-icon-overlay">
              <uni-icons type="wallet" size="24" color="var(--theme-primary)" />
            </view>
          </view>
          <view class="card-content">
            <text class="card-title">美食菜单</text>
            <view class="card-footer">
              <text class="card-desc">今天吃什么？根据心情为你推荐精选菜谱。</text>
              <view class="card-btn">
                <text>探索</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- Notification Drawer -->
    <view class="drawer-overlay" v-if="showNotificationDrawer" @click="closeNotificationDrawer">
      <view class="drawer" @click.stop>
        <view class="drawer-header">
          <text class="drawer-title">消息通知</text>
          <view class="close-btn" @click="closeNotificationDrawer">
            <uni-icons type="clear" size="20" color="#999" />
          </view>
        </view>
        <scroll-view scroll-y class="drawer-content">
          <view v-for="item in notifications" :key="item.id" class="notification-item">
            <view class="notification-icon" :style="{ backgroundColor: item.bgColor }">
              <uni-icons :type="item.icon" size="20" color="#fff" />
            </view>
            <view class="notification-info">
              <view class="notification-title-row">
                <text class="notification-title">{{ item.title }}</text>
                <text class="notification-time">{{ relativeTime(item.createdAt) }}</text>
              </view>
              <text class="notification-content">{{ item.content }}</text>
            </view>
          </view>
          <view v-if="!notifications.length" class="notification-empty">
            <text>暂无消息</text>
          </view>
        </scroll-view>
        <view class="drawer-footer">
          <view class="clear-btn" @click="clearAllNotifications">
            <uni-icons type="trash" size="16" color="var(--theme-primary)" />
            <text>清空全部</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Tab Bar -->
    <TabBar :current-index="0" @change="handleTabChange" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShareAppMessage, onShow } from '@dcloudio/uni-app'
import TabBar from '@/components/TabBar.vue'
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue'
import { getMessages, markMessagesAsRead, type Message } from '@/services/notification'
import { themeStyle } from '@/utils/theme'

const handleTabChange = (index: number) => {
  if (index === 0) {
    // Stay on home
  } else if (index === 1) {
    uni.navigateTo({ url: '/pages/expiry/index' })
  } else if (index === 2) {
    uni.navigateTo({ url: '/pages/food-menu/index' })
  } else if (index === 3) {
    uni.navigateTo({ url: '/pages/profile/index' })
  }
}

const navigateTo = (url: string) => {
  uni.navigateTo({ url })
}

onShareAppMessage(() => ({
  title: '猪猪生活本',
  path: '/pages/index/index',
  imageUrl: '/static/logo.png'
}))

// Notification Drawer
const showNotificationDrawer = ref(false)
const notifications = ref<Message[]>([])
const hasUnread = ref(false)
// 「清空全部」只清本地展示，标记后本次会话不再拉取，重新进入页面会恢复
const localCleared = ref(false)

const loadMessages = async () => {
  if (localCleared.value) return
  try {
    const list = await getMessages()
    notifications.value = list
    hasUnread.value = list.some((item) => !item.isRead)
  } catch (err) {
    console.error('加载消息失败', err)
  }
}

const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso.replace(' ', 'T')).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return iso.slice(0, 10)
}

onShow(() => {
  localCleared.value = false
  loadMessages()
})

const openNotificationDrawer = async () => {
  showNotificationDrawer.value = true
  if (!hasUnread.value) return
  try {
    await markMessagesAsRead()
    hasUnread.value = false
    notifications.value = notifications.value.map((item) => ({ ...item, isRead: true }))
  } catch (err) {
    console.error('标记已读失败', err)
  }
}

const closeNotificationDrawer = () => {
  showNotificationDrawer.value = false
}

const clearAllNotifications = () => {
  notifications.value = []
  hasUnread.value = false
  localCleared.value = true
  uni.showToast({ title: '已清空全部消息', icon: 'success' })
  closeNotificationDrawer()
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: var(--theme-bg);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  padding-top: calc(16px + var(--status-bar-height));
  background: var(--theme-bg);
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid var(--theme-primary-lighter);
}

.header-center {
  flex: 1;
  text-align: center;
  padding-right: 48px;
  box-sizing: border-box;
}

.title {
  font-size: 18px;
  font-weight: 700;
  color: #111;
}

.header-right {
  display: flex;
  width: 48px;
}

.icon-btn {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.red-dot {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  border: 1px solid var(--theme-bg);
}

.content {
  flex: 1;
  padding-bottom: 120px;
}

.announcement {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--theme-primary-lighter);
  margin: 16px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--theme-primary-light);
}

.announcement-icon {
  width: 40px;
  height: 40px;
  background: var(--theme-primary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.announcement-text {
  flex: 1;
  overflow: hidden;
}

.announcement-text text {
  font-size: 14px;
  color: #555;
  font-weight: 500;
}

.announcement-arrow {
  display: flex;
  align-items: center;
}

.cards {
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--theme-primary-lighter);
}

.card-image {
  width: 100%;
  height: 160px;
  position: relative;
  overflow: hidden;
  background: var(--theme-primary-light);
}

.card-img {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  mix-blend-mode: overlay;
}

.card-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(var(--theme-primary-rgb), 0.3) 0%, var(--theme-primary-lighter) 100%);
  z-index: 1;
}

.card-icon-overlay {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.card-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  color: #111;
}

.card-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.card-desc {
  font-size: 14px;
  color: #777;
  flex: 1;
}

.card-btn {
  min-width: 80px;
  height: 36px;
  background: var(--theme-primary);
  color: #111;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
}

/* Notification Drawer */
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0, 0.5);
  z-index: 200;
  display: flex;
  justify-content: flex-end;
  animation: fadeIn 0.3s ease;
}

.drawer {
  width: 85%;
  height: 100%;
  background: white;
  display: flex;
  flex-direction: column;
  animation: slideInRight 0.3s ease;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid rgba(243, 244, 246, 1);
}

.drawer-title {
  font-size: 18px;
  font-weight: 700;
  color: #111;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(243, 244, 246, 1);
}

.drawer-content {
  flex: 1;
  padding: 8px 16px;
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 16px 22px 16px 0;
  border-bottom: 1px solid rgba(248, 245, 246, 1);
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.notification-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
}

.notification-title {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
  color: #111;
}

.notification-time {
  flex-shrink: 0;
  font-size: 12px;
  color: #9ca3af;
  white-space: nowrap;
  padding-left: 8px;
}

.notification-content {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
}

.notification-empty {
  padding: 48px 0;
  text-align: center;
  font-size: 14px;
  color: #9ca3af;
}

.drawer-footer {
  padding: 16px;
  border-top: 1px solid rgba(243, 244, 246, 1);
}

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 44px;
  border-radius: 12px;
  background: var(--theme-primary-lighter);
  border: 1px solid rgba(var(--theme-primary-rgb), 0.3);
  font-size: 14px;
  font-weight: 600;
  color: var(--theme-primary);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }

  to {
    transform: translateX(0);
  }
}
</style>
