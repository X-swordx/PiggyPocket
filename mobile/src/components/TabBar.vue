<template>
<view class="tab-bar">
  <view
    v-for="(tab, index) in tabs"
    :key="index"
    class="tab-item"
    :class="{ active: currentIndex === index }"
    @click="handleTabClick(index)"
  >
    <view class="tab-icon">
      <uni-icons :type="tab.icon" :size="24" :color="currentIndex === index ? '#333' : '#999'" />
    </view>
    <text class="tab-label">{{ tab.label }}</text>
  </view>
</view>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue'

interface Tab {
  label: string
  icon: string
}

const props = defineProps<{
  currentIndex: number
}>()

const emit = defineEmits<{
  (e: 'change', index: number): void
}>()

const tabs: Tab[] = [
  { label: '首页', icon: 'home' },
  { label: '记录', icon: 'list' },
  { label: '菜谱', icon: 'fire' },
  { label: '我的', icon: 'person' }
]

const handleTabClick = (index: number) => {
  emit('change', index)
}
</script>

<style scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 4px 16px 12px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 194, 204, 0.2);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 100;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex: 1;
}

.tab-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  transition: background 0.2s;
}

.tab-item.active .tab-icon {
  background: rgba(255, 194, 204, 0.2);
}

.tab-label {
  font-size: 10px;
  color: #999;
  font-weight: 500;
}

.tab-item.active .tab-label {
  color: #333;
  font-weight: 600;
}
</style>
