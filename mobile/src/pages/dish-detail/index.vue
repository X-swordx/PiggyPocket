<template>
  <view class="container">
    <!-- Header - Glassmorphism style per Blush Velvet -->
    <view class="header">
      <view class="back-btn" @click="goBack">
        <uni-icons type="left" size="24" color="#ffc2cc" />
      </view>
      <view class="title">
        <text>{{ isFoodExpiry ? '食品详情' : '菜品详情' }}</text>
      </view>
      <view class="share-btn" @click="shareDish">
        <uni-icons type="more" size="24" color="#ffc2cc" />
      </view>
    </view>

    <view class="content">
      <!-- Food Expiry Detail Mode - Redesigned per prototype -->
      <view v-if="isFoodExpiry" class="food-detail">
        <!-- Hero Section - with gradient overlay per design rule -->
        <view class="hero-section">
          <view class="hero-image" :style="{ backgroundColor: food.bgColor }">
            <view class="hero-gradient-overlay"></view>
            <view class="category-badge">
              <text>{{ food.category || '食品' }}</text>
            </view>
          </view>
        </view>

        <!-- Main Info Section -->
        <view class="main-info">
          <view class="title-row">
            <view class="food-title-block">
              <text class="food-name">{{ food.name }}</text>
              <text class="food-subtitle" v-if="food.spec">{{ food.spec }}</text>
            </view>
            <view class="icon-block">
              <uni-icons type="box" size="28" color="#ffc2cc" />
            </view>
          </view>

          <!-- Expiry Bento Grid - as seen in prototype -->
          <view class="bento-grid">
            <!-- Expiry Status Card - Full Width -->
            <view class="expiry-card">
              <view class="card-header">
                <text class="card-label">过期状态</text>
                <view class="urgency-badge" :class="getStatusClass(food.status)">
                  <text>{{ getUrgencyText(food.status) }}</text>
                </view>
              </view>
              <view class="expiry-content">
                <view class="days-display">
                  <text class="days-number" :class="getStatusTextClass(food.status)">{{ food.daysCount || '?' }}</text>
                  <text class="days-label">天后过期</text>
                </view>
                <text class="expiry-date">过期日期: {{ food.expiryDate }}</text>
              </view>
            </view>

            <!-- Storage Location - Full Width -->
            <view class="mini-card full-width">
              <view class="mini-card-icon bg-secondary-container">
                <uni-icons type="cold" size="20" color="#70585c" />
              </view>
              <view class="mini-card-content">
                <text class="mini-card-label">储藏位置</text>
                <text class="mini-card-value">{{ food.storage || '冰箱' }}</text>
              </view>
            </view>

            <!-- Category - Full Width -->
            <view class="mini-card full-width">
              <view class="mini-card-icon bg-tertiary-container">
                <uni-icons type="tag" size="20" color="#44664c" />
              </view>
              <view class="mini-card-content">
                <text class="mini-card-label">类别</text>
                <text class="mini-card-value">{{ food.category || '未分类' }}</text>
              </view>
            </view>
          </view>

          <!-- Notes Section -->
          <view class="notes-card" v-if="food.notes">
            <view class="notes-header">
              <uni-icons type="text" size="20" color="#504445" />
              <text class="notes-title">备注信息</text>
            </view>
            <text class="notes-content">{{ food.notes }}</text>
          </view>

          <!-- Notes Section - when no notes but has suggestion based on status -->
          <view class="notes-card" v-else>
            <view class="notes-header">
              <uni-icons type="info" size="20" color="#504445" />
              <text class="notes-title">处理建议</text>
            </view>
            <text class="notes-content">{{ getDefaultNote(food.status) }}</text>
          </view>

          <!-- Action Buttons -->
          <view class="action-buttons">
            <view class="action-btn primary-btn" @click="editFood">
              <uni-icons type="compose" size="20" color="#321018" />
              <text>修改食品</text>
            </view>
            <view class="action-btn danger-btn" @click="deleteFood">
              <uni-icons type="clear" size="20" color="#ba1a1a" />
              <text>删除食品</text>
            </view>
          </view>
        </view>

        <!-- Bottom spacer for fixed buttons -->
        <view class="spacer"></view>
      </view>

      <!-- Original Dish Detail Mode - preserved and updated to match design system -->
      <view v-else class="dish-detail">
        <!-- Hero Image - with gradient overlay -->
        <view class="hero-section">
          <view class="hero-image" style="background: linear-gradient(135deg, #f0b7a4 0%, #f5cac3 100%);">
            <view class="hero-gradient-overlay"></view>
          </view>
          <view class="hero-overlay">
            <text class="dish-name">{{ dish.name }}</text>
            <view class="dish-meta">
              <view class="meta-item">
                <uni-icons type="fire" size="16" color="#6b7280" />
                <text>{{ dish.calories }} kcal</text>
              </view>
              <view class="meta-item">
                <uni-icons type="clock" size="16" color="#6b7280" />
                <text>{{ dish.time }} mins</text>
              </view>
            </view>
          </view>
        </view>

        <!-- Dish Info -->
        <view class="info-section">
          <view class="section-header">
            <view class="header-line"></view>
            <text>菜品信息</text>
          </view>
          <view class="info-grid">
            <view class="info-card">
              <text class="info-label">能量</text>
              <text class="info-value">{{ dish.calories }} 千卡</text>
            </view>
            <view class="info-card">
              <text class="info-label">烹饪时间</text>
              <text class="info-value">{{ dish.time }} 分钟</text>
            </view>
          </view>
        </view>

        <!-- Ingredients -->
        <view class="ingredients-section">
          <view class="section-header">
            <view class="header-line"></view>
            <text>用料清单</text>
          </view>
          <view class="ingredients-list">
            <view v-for="(ing, index) in dish.ingredients" :key="index" class="ingredient-item">
              <text class="ingredient-name">{{ ing.name }}</text>
              <text class="ingredient-amount">{{ ing.amount }}</text>
            </view>
          </view>
        </view>

        <!-- Cooking Steps -->
        <view class="steps-section">
          <view class="section-header">
            <view class="header-line"></view>
            <text>烹饪步骤</text>
          </view>
          <view class="steps-list">
            <view v-for="(step, index) in dish.steps" :key="index" class="step-item">
              <view class="step-number">{{ index + 1 }}</view>
              <view class="step-content">
                <text>{{ step }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- Bottom spacer -->
        <view class="spacer-dish"></view>
      </view>
    </view>

    <!-- Bottom Action Button - only for dish mode -->
    <view class="bottom-bar" v-if="!isFoodExpiry && !addedToWishlist">
      <view class="add-btn" @click="addToWishlist">
        <uni-icons type="star" size="20" color="#321018" />
        <text>添加到心愿单</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue'

interface Dish {
  name: string
  calories: string
  time: string
  ingredients: Array<{ name: string; amount: string }>
  steps: string[]
}

interface FoodItem {
  name: string
  expiryDate: string
  daysText: string
  daysCount?: string
  status: 'fresh' | 'expiring' | 'expired'
  statusText: string
  bgColor: string
  category?: string
  spec?: string
  storage?: string
  notes?: string
}

const dish: Dish = {
  name: '番茄培根意面',
  calories: '450',
  time: '20',
  ingredients: [
    { name: '意大利面', amount: '100g' },
    { name: '番茄', amount: '2个' },
    { name: '培根', amount: '3片' },
    { name: '洋葱', amount: '1/4个' },
    { name: '橄榄油', amount: '适量' }
  ],
  steps: [
    '锅中烧水，水开后放入意面煮8-10分钟。',
    '热锅凉油，放入洋葱丁和培根片翻炒出香味。',
    '加入切好的番茄块，炒出汤汁。',
    '将煮好的意面放入锅中，加入适量盐和黑胡椒，拌匀即可。'
  ]
}

const food = ref<FoodItem>({
  name: '',
  expiryDate: '',
  daysText: '',
  status: 'fresh',
  statusText: '',
  bgColor: '#ffc2cc'
})

const isFoodExpiry = computed(() => !!food.value.name)

const addedToWishlist = ref(false)

onLoad((options: any) => {
  if (options && options.name) {
    food.value = {
      name: decodeURIComponent(options.name) || '',
      expiryDate: decodeURIComponent(options.expiryDate) || '',
      daysText: decodeURIComponent(options.daysText) || '',
      daysCount: options.daysCount ? decodeURIComponent(options.daysCount) : '',
      status: (decodeURIComponent(options.status) || 'fresh') as any,
      statusText: decodeURIComponent(options.statusText) || '',
      bgColor: options.bgColor ? decodeURIComponent(options.bgColor) : getRandomBgColor(),
      category: options.category ? decodeURIComponent(options.category) : '乳制品',
      spec: options.spec ? decodeURIComponent(options.spec) : '950ml · 1瓶',
      storage: options.storage ? decodeURIComponent(options.storage) : '冰箱 (冷藏室)',
      notes: options.notes ? decodeURIComponent(options.notes) : ''
    }
  }
})

const getRandomBgColor = () => {
  const colors = ['#8aa6cb', '#a8d5ba', '#d4a373', '#a88fca', '#f5cac3', '#f0b7a4']
  return colors[Math.floor(Math.random() * colors.length)]
}

const getStatusClass = (status: string) => {
  return status
}

const getStatusTextClass = (status: string) => {
  if (status === 'expired') return 'text-error'
  if (status === 'expiring') return 'text-expiring'
  return 'text-fresh'
}

const getUrgencyText = (status: string) => {
  if (status === 'expired') return '已过期'
  if (status === 'expiring') return '紧急'
  return '正常'
}

const getDefaultNote = (status: string) => {
  if (status === 'fresh') return '食品仍然新鲜，请尽快食用。'
  if (status === 'expiring') return '即将过期，建议优先食用。'
  return '已过期，建议丢弃处理。'
}

const goBack = () => {
  uni.navigateBack()
}

const shareDish = () => {
  uni.showToast({ title: '更多功能', icon: 'none' })
}

const addToWishlist = () => {
  addedToWishlist.value = true
  uni.showToast({
    title: '已添加至心愿单',
    icon: 'success'
  })
}

const editFood = () => {
  uni.showToast({ title: '编辑功能开发中', icon: 'none' })
}

const deleteFood = () => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个食品记录吗？',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => {
          uni.navigateBack()
        }, 1000)
      }
    }
  })
}
</script>

<style scoped>
/* Blush Velvet Design System Base Styles */
/* Primary: #ffc2cc, Background: #f8f5f6, On-surface: #1f1a1b */

.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f8f5f6;
}

/* Header - Glassmorphism per Blush Velvet rule */
.header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  padding-top: calc(12px + var(--status-bar-height));
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 194, 204, 0.2);
  box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.05);
}

.back-btn, .share-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  transition: background-color 0.2s;
}

.back-btn:active, .share-btn:active {
  background: rgba(255, 194, 204, 0.1);
  transform: scale(0.95);
}

.title {
  flex: 1;
  text-align: center;
}

.title text {
  font-size: 18px;
  font-weight: 700;
  color: #1f1a1b;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.content {
  flex: 1;
}

/* ========== Redesigned Food Detail ========== */
.food-detail {
  width: 100%;
  padding-bottom: 24px;
}

.hero-section {
  position: relative;
  width: 100%;
  margin: 16px;
  width: calc(100% - 32px);
  border-radius: 16px;
  overflow: hidden;
  /* Editorial shadow per design - 0 4px 20px -2px rgba(255, 194, 204, 0.2) */
  box-shadow: 0 4px 20px -2px rgba(255, 194, 204, 0.2);
}

.hero-image {
  width: 100%;
  height: 240px;
  overflow: hidden;
}

/* Gradient overlay rule: from-primary/30 to-primary/10 mix-blend-overlay */
.hero-gradient-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom right, rgba(255, 194, 204, 0.3), rgba(255, 194, 204, 0.1));
  mix-blend-mode: overlay;
  z-index: 10;
}

.category-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 20;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  padding: 6px 12px;
  border-radius: 9999px;
  box-shadow: 0 4px 12px -2px rgba(255, 194, 204, 0.2);
}

.category-badge text {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #ffc2cc;
}

.main-info {
  margin-top: 24px;
  padding: 0 16px;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.food-title-block {
  flex: 1;
}

.food-name {
  display: block;
  font-size: 30px;
  font-weight: 800;
  color: #1f1a1b;
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin-bottom: 4px;
}

.food-subtitle {
  font-size: 16px;
  font-weight: 500;
  color: #6b7280;
}

.icon-block {
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 194, 204, 0.2);
  flex-shrink: 0;
  margin-left: 12px;
}

/* Bento Grid Layout from prototype */
.bento-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.expiry-card {
  grid-column: 1 / span 1;
  background: #ffffff;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid rgba(255, 194, 204, 0.1);
  box-shadow: 0 4px 20px -2px rgba(255, 194, 204, 0.15);
  min-height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.card-label {
  font-size: 14px;
  font-weight: 700;
  color: #504445;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.urgency-badge {
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.urgency-badge.fresh {
  background: #a8d5ba;
  color: #44664c;
}

.urgency-badge.expiring {
  background: #f5cac3;
  color: #653a43;
}

.urgency-badge.expired {
  background: #ffdad6;
  color: #93000a;
}

.days-display {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.days-number {
  font-size: 42px;
  font-weight: 800;
  line-height: 1;
}

.days-label {
  font-size: 18px;
  font-weight: 700;
  color: #504445;
}

.text-error {
  color: #ba1a1a;
}

.text-expiring {
  color: #f57c00;
}

.text-fresh {
  color: #2e7d32;
}

.expiry-date {
  display: block;
  margin-top: 4px;
  font-size: 14px;
  color: #9ca3af;
  font-weight: 500;
}

.mini-card {
  background: #ffffff;
  padding: 16px 20px;
  border-radius: 16px;
  border: 1px solid rgba(255, 194, 204, 0.1);
  box-shadow: 0 4px 20px -2px rgba(255, 194, 204, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
}

.mini-card.full-width {
  width: 100%;
}

.mini-card-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bg-secondary-container {
  background: #f8d8dc;
}

.bg-tertiary-container {
  background: #c6eccb;
}

.mini-card-content {
  flex: 1;
}

.mini-card-label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}

.mini-card-value {
  font-size: 16px;
  font-weight: 700;
  color: #1f1a1b;
}

/* Notes Card */
.notes-card {
  background: rgba(255, 255, 255, 0.6);
  padding: 20px;
  border-radius: 16px;
  border: 1px solid rgba(255, 194, 204, 0.1);
  margin-bottom: 24px;
}

.notes-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.notes-title {
  font-size: 14px;
  font-weight: 700;
  color: #1f1a1b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.notes-content {
  font-size: 14px;
  line-height: 1.7;
  color: #504445;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 16px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 0;
  border-radius: 12px;
  font-weight: 700;
  font-size: 16px;
  transition: all 0.2s;
}

.action-btn:active {
  transform: scale(0.98);
}

.primary-btn {
  background: #ffc2cc;
  color: #321018;
  box-shadow: 0 4px 12px rgba(255, 194, 204, 0.3);
}

.danger-btn {
  background: #f8f5f6;
  color: #ba1a1a;
  border: 1px solid rgba(186, 26, 26, 0.2);
}

.spacer {
  height: 40px;
}

/* ========== Updated Dish Detail (still preserved) ========== */
.dish-detail {
  width: 100%;
}

.hero-overlay {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dish-name {
  font-size: 24px;
  font-weight: 700;
  color: #374151;
  display: block;
  margin-bottom: 8px;
}

.dish-meta {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #6b7280;
}

.info-section, .ingredients-section, .steps-section {
  padding: 24px 16px 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.header-line {
  width: 4px;
  height: 20px;
  background: #ffc2cc;
  border-radius: 2px;
}

.section-header text {
  font-size: 18px;
  font-weight: 700;
  color: #1f1a1b;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-card {
  background: rgba(255, 194, 204, 0.1);
  padding: 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.info-label {
  font-size: 12px;
  color: #9ca3af;
}

.info-value {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.ingredients-list {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 194, 204, 0.1);
}

.ingredient-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(243, 244, 246, 1);
}

.ingredient-item:last-child {
  border-bottom: none;
}

.ingredient-name {
  font-size: 14px;
  color: #6b7280;
}

.ingredient-amount {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.steps-list {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 194, 204, 0.1);
}

.step-item {
  display: flex;
  gap: 16px;
  padding-bottom: 32px;
}

.step-item:last-child {
  padding-bottom: 0;
}

.step-number {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  background: #ffc2cc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: white;
}

.step-content {
  flex: 1;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(243, 244, 246, 1);
}

.step-item:last-child .step-content {
  border-bottom: none;
}

.step-content text {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
}

.spacer-dish {
  height: 100px;
}

/* Bottom Bar - Glassmorphism */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255, 194, 204, 0.2);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.add-btn {
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
  color: #321018;
  box-shadow: 0 4px 12px rgba(255, 194, 204, 0.3);
  transition: all 0.2s;
}

.add-btn:active {
  transform: scale(0.98);
  filter: brightness(1.05);
}
</style>
