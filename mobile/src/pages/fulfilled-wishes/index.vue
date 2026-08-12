<template>
  <view class="container" :style="themeStyle">
    <!-- Header -->
    <view class="header">
      <view class="back-btn" @click="goBack">
        <uni-icons type="left" size="24" color="#333" />
      </view>
      <view class="title">
        <text>实现心愿</text>
      </view>
    </view>

    <scroll-view scroll-y class="content">
      <view v-if="items.length === 0" class="empty">还没有实现的心愿</view>
      <view class="items">
        <view v-for="item in items" :key="item.id" class="item">
          <view class="checkbox checked" @click="uncomplete(item)">
            <uni-icons type="checkmarkempty" size="16" color="#fff" />
          </view>
          <view class="item-content">
            <text class="item-title completed">{{ item.title }}</text>
            <view class="item-tag" :class="item.tagClass">
              <text>{{ item.category }}</text>
            </view>
          </view>
          <view class="item-badge">
            <uni-icons type="heart-filled" size="14" color="var(--theme-primary)" />
            <text>已实现</text>
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
import { getCompletedWishes, uncompleteWish, type Wish } from '@/services/wishlist'
import { themeStyle } from '@/utils/theme'

const items = ref<Wish[]>([])

const reload = async () => {
  try {
    items.value = await getCompletedWishes()
  } catch (err: any) {
    uni.showToast({ title: err.message || '心愿加载失败', icon: 'none' })
  }
}

const uncomplete = async (item: Wish) => {
  try {
    await uncompleteWish(item.id)
    await reload()
    uni.showToast({ title: '已移回心愿清单', icon: 'none' })
  } catch (err: any) {
    uni.showToast({ title: err.message || '操作失败', icon: 'none' })
  }
}

const goBack = () => {
  uni.navigateBack()
}

onShow(reload)
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

.empty {
  padding: 32px;
  text-align: center;
  color: #777;
}

.items {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  border: 1px solid rgba(243, 244, 246, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.checkbox {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox.checked {
  background: var(--theme-primary);
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-title {
  font-size: 16px;
  font-weight: 600;
  color: #111;
}

.item-title.completed {
  text-decoration: line-through;
  color: #999;
}

.item-tag {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  width: fit-content;
}

.item-tag.travel {
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
}

.item-tag.skill {
  background: rgba(249, 115, 22, 0.1);
  color: #ea580c;
}

.item-tag.health {
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.item-tag.growth {
  background: rgba(147, 51, 234, 0.1);
  color: #9333ea;
}

.item-badge {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--theme-primary-lighter);
  color: var(--theme-primary-dark);
  font-size: 12px;
  font-weight: 600;
}
</style>
