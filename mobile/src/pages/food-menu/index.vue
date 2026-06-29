<template>
  <view class="container">
    <!-- Header -->
    <view class="header">
      <view class="back-btn" @click="goBack">
        <uni-icons type="left" size="24" color="#333" />
      </view>
      <view class="title">
        <text>美食菜单</text>
      </view>
      <view class="notify-btn">
        <uni-icons type="notification" size="24" color="#333" />
      </view>
    </view>

    <!-- Main Content -->
    <scroll-view scroll-y class="content">
      <!-- Upload Section -->
      <view class="upload-section">
        <view class="upload-card">
          <view class="upload-icon">
            <uni-icons type="cloud-upload" size="32" color="#ffc2cc" />
          </view>
          <view class="upload-text">
            <text class="upload-title">上传食谱</text>
            <text class="upload-desc">与社区分享您的美味佳肴</text>
          </view>
          <view class="upload-btn" @click="goToUpload">
            <uni-icons type="camera" size="20" color="#333" />
            <text>上传图片</text>
          </view>
        </view>
      </view>

      <!-- Menu Section -->
      <view class="menu-section">
        <view class="menu-header">
          <text class="menu-title">今日菜单</text>
          <view class="menu-badge">
            <text>{{ dishes.length }} 道菜可选</text>
          </view>
        </view>
        <view v-if="loading" style="padding: 24px; text-align: center; color: #777;">加载中...</view>
        <view v-else-if="error" style="padding: 24px; text-align: center; color: #ba1a1a;">{{ error }}</view>
        <view v-else-if="dishes.length === 0" style="padding: 24px; text-align: center; color: #777;">暂无菜品，去上传第一道菜谱吧</view>
        <view v-else class="dishes">
          <view v-for="(dish, index) in dishes" :key="dish.id" class="dish-card" @click="goToDetail(dish)">
            <view class="dish-image" :style="{ backgroundColor: dish.bgColor }">
              <image v-if="dish.image" class="dish-img" :src="dish.image" mode="aspectFill" />
            </view>
            <view class="dish-info">
              <view class="dish-text">
                <text class="dish-name">{{ dish.name }}</text>
                <text class="dish-meta">{{ dish.calories }} 千卡 • {{ dish.time }}</text>
              </view>
              <view
                class="dish-btn"
                :class="{ selected: dish.selected }"
                @click.stop="toggleDish(index)"
              >
                <uni-icons v-if="!dish.selected" type="cart" size="18" color="#333" />
                <uni-icons v-else type="checkmarkempty" size="18" color="#16a34a" />
                <text>{{ dish.selected ? '已选' : '选择' }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- Padding for bottom -->
      <view style="height: 140px;"></view>
    </scroll-view>

    <!-- Bottom Summary & Tab Bar -->
    <view class="bottom-bar">
      <!-- Order Summary -->
      <view class="order-summary" v-if="selectedCount > 0">
        <view class="summary-left">
          <view class="basket-icon">
            <uni-icons type="shopping-cart" size="24" color="#fff" />
          </view>
          <view>
            <text class="summary-text">已选 {{ selectedCount }} 道菜</text>
          </view>
        </view>
        <view class="summary-btn" @click="goToOrder">
          <text>查看订单</text>
        </view>
      </view>

      <!-- Tab Bar -->
      <TabBar :current-index="2" @change="handleTabChange" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import TabBar from '@/components/TabBar.vue'
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue'
import { getDishes, SELECTED_DISHES_KEY, type FoodieDish } from '@/services/foodieBuddy'

interface Dish {
  id: number
  name: string
  calories: string
  time: string
  selected: boolean
  bgColor: string
  image?: string
}

const colors = ['#a8d5ba', '#e67e22', '#27ae60', '#f0b7a4', '#8aa6cb', '#a88fca']
const dishes = ref<Dish[]>([])
const loading = ref(false)
const error = ref('')

const selectedCount = computed(() => dishes.value.filter(d => d.selected).length)

const mapDish = (dish: FoodieDish, index: number): Dish => ({
  id: dish.id,
  name: dish.name,
  calories: dish.calories ? String(dish.calories) : '--',
  time: dish.cookingTime || '未知',
  selected: false,
  bgColor: dish.bgColor || colors[index % colors.length],
  image: dish.image
})

const loadDishes = async () => {
  loading.value = true
  error.value = ''
  try {
    const result = await getDishes({ page: 1, pageSize: 100 })
    dishes.value = result.list.map(mapDish)
  } catch (err: any) {
    error.value = err.message || '菜品加载失败'
  } finally {
    loading.value = false
  }
}

onShow(loadDishes)

const goBack = () => {
  uni.navigateBack()
}

const goToUpload = () => {
  uni.navigateTo({ url: '/pages/recipe-upload/index' })
}

const toggleDish = (index: number) => {
  dishes.value[index].selected = !dishes.value[index].selected
}

const goToOrder = () => {
  const selectedDishes = dishes.value.filter((dish) => dish.selected)
  uni.setStorageSync(SELECTED_DISHES_KEY, selectedDishes)
  uni.navigateTo({ url: '/pages/order/index' })
}

const goToDetail = (dish: Dish) => {
  uni.navigateTo({ url: `/pages/dish-detail/index?id=${dish.id}` })
}

const handleTabChange = (index: number) => {
  if (index === 0) {
    uni.reLaunch({ url: '/pages/index/index' })
  } else if (index === 1) {
    uni.reLaunch({ url: '/pages/expiry/index' })
  } else if (index === 2) {
    // Stay on current page
  } else if (index === 3) {
    uni.reLaunch({ url: '/pages/profile/index' })
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #F8F5F6;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  padding-top: calc(16px + var(--status-bar-height));
  background: rgba(248, 245, 246, 0.8);
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid rgba(255, 194, 204, 0.2);
}

.back-btn, .notify-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.notify-btn {
  background: rgba(255, 194, 204, 0.2);
}

.title {
  flex: 1;
  text-align: center;
}

.title text {
  font-size: 20px;
  font-weight: 700;
}

.content {
  flex: 1;
}

.upload-section {
  padding: 16px;
}

.upload-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 2px dashed rgba(255, 194, 204, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
}

.upload-icon {
  width: 64px;
  height: 64px;
  background: rgba(255, 194, 204, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-title {
  font-size: 18px;
  font-weight: 700;
  color: #111;
  display: block;
}

.upload-desc {
  font-size: 14px;
  color: #777;
  display: block;
  margin-top: 4px;
}

.upload-btn {
  width: 100%;
  height: 48px;
  background: #ffc2cc;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
}

.menu-section {
  padding: 16px;
}

.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.menu-title {
  font-size: 20px;
  font-weight: 700;
  color: #111;
}

.menu-badge {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  background: rgba(255, 194, 204, 0.2);
  border-radius: 999px;
}

.dishes {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dish-card {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 194, 204, 0.1);
}

.dish-image {
  width: 100%;
  height: 192px;
  position: relative;
  overflow: hidden;
}

.dish-img {
  width: 100%;
  height: 100%;
}

.dish-info {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dish-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dish-name {
  font-size: 18px;
  font-weight: 700;
  color: #111;
}

.dish-meta {
  font-size: 12px;
  color: #777;
}

.dish-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: #ffc2cc;
  color: #111;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
}

.dish-btn.selected {
  background: rgba(255, 194, 204, 0.2);
  border: 1px solid rgba(255, 194, 204, 0.3);
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
}

.order-summary {
  margin: 0 16px 16px;
  margin-bottom: calc(16px + 60px);
  padding: 16px;
  background: #230f12;
  color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.summary-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.basket-icon {
  background: rgba(255, 255, 255, 0.2);
  padding: 8px;
  border-radius: 8px;
}

.summary-text {
  font-size: 18px;
  font-weight: 700;
}

.summary-btn {
  padding: 8px 24px;
  background: white;
  color: #111;
  border-radius: 8px;
  font-weight: 600;
}
</style>
