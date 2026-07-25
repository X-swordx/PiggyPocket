<template>
  <view class="container">
    <!-- Header -->
    <view class="header">
      <view class="back-btn" @click="goBack">
        <uni-icons type="left" size="24" color="#333" />
      </view>
      <view class="title">
        <text>关于</text>
      </view>
      <view class="placeholder"></view>
    </view>

    <scroll-view scroll-y class="content">
      <view class="info-card">
        <view class="info-row" @click="openBeian">
          <text class="info-label">ICP 备案号</text>
          <text class="info-value">粤ICP备2026061943号-2</text>
        </view>
      </view>
      <view class="tip">
        <text>点击备案号可复制工信部网址</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue'

const goBack = () => {
  uni.navigateBack()
}

const openBeian = () => {
  uni.setClipboardData({
    data: 'https://beian.miit.gov.cn/',
    success: () => {
      uni.showToast({ title: '工信部网址已复制，请在浏览器打开', icon: 'none' })
    }
  })
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

.placeholder {
  width: 48px;
}

.content {
  padding: 16px 0;
}

.info-card {
  margin: 0 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 194, 204, 0.1);
  padding: 4px 16px;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 0;
}

.info-label {
  flex-shrink: 0;
  font-size: 14px;
  color: #111;
  font-weight: 500;
}

.info-value {
  flex: 1;
  font-size: 13px;
  color: #777;
  text-align: right;
  word-break: break-all;
}

.tip {
  margin: 12px 16px 0;
  text-align: center;
}

.tip text {
  font-size: 12px;
  color: #999;
}
</style>
