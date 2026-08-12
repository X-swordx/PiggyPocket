<template>
  <view class="container" :style="themeStyle">
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
            <uni-icons type="cloud-upload" size="32" color="var(--theme-primary)" />
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

        <!-- Category Filter -->
        <scroll-view scroll-x class="filters">
          <view class="filters-inner">
            <view
              v-for="cat in categoryTabs"
              :key="cat.id ?? 'all'"
              class="filter-chip"
              :class="{ active: activeCategoryId === cat.id }"
              @click="selectCategory(cat.id)"
            >
              <text>{{ cat.name }}</text>
            </view>
          </view>
        </scroll-view>
        <view v-if="loading" style="padding: 24px; text-align: center; color: #777;">加载中...</view>
        <view v-else-if="error" style="padding: 24px; text-align: center; color: #ba1a1a;">{{ error }}</view>
        <view v-else-if="dishes.length === 0" style="padding: 24px; text-align: center; color: #777;">暂无菜品，去上传第一道菜谱吧</view>
        <view v-else class="dishes">
          <view v-for="(dish, index) in dishes" :key="dish.id" class="dish-card" @click="goToDetail(dish)">
            <view class="dish-image" :style="dish.image ? {} : { backgroundColor: dish.bgColor }">
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
import {
  getDishes,
  getDishCategories,
  getCurrentUser,
  SELECTED_DISHES_KEY,
  type DishCategory,
  type FoodieDish
} from '@/services/foodieBuddy'
import { themeStyle } from '@/utils/theme'

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

const categories = ref<DishCategory[]>([])
const activeCategoryId = ref<number | null>(null)

// null = 全部
const categoryTabs = computed(() => [
  { id: null as number | null, name: '全部' },
  ...categories.value.map((c) => ({ id: c.id as number | null, name: c.name }))
])

// 切换分类会重新请求列表，用 id → Dish 记住已选项，避免跨分类丢失选择
const selectedMap = ref<Record<number, Dish>>({})

const selectedCount = computed(() => Object.keys(selectedMap.value).length)

const mapDish = (dish: FoodieDish, index: number): Dish => ({
  id: dish.id,
  name: dish.name,
  calories: dish.calories ? String(dish.calories) : '--',
  time: dish.cookingTime || '未知',
  selected: !!selectedMap.value[dish.id],
  bgColor: dish.bgColor || colors[index % colors.length],
  image: dish.image
})

const loadDishes = async () => {
  loading.value = true
  error.value = ''
  try {
    const user = await getCurrentUser()
    const result = await getDishes({
      userId: user.id,
      page: 1,
      pageSize: 100,
      categoryId: activeCategoryId.value ?? undefined
    })
    dishes.value = result.list.map(mapDish)
  } catch (err: any) {
    error.value = err.message || '菜品加载失败'
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    categories.value = await getDishCategories()
  } catch (err) {
    // 分类加载失败不阻断菜单展示，仅少了筛选入口
    console.error('loadDishCategories fail', err)
  }
}

const selectCategory = (id: number | null) => {
  if (activeCategoryId.value === id) return
  activeCategoryId.value = id
  loadDishes()
}

onShow(() => {
  selectedMap.value = {}
  loadCategories()
  loadDishes()
})

const goBack = () => {
  uni.navigateBack()
}

const goToUpload = () => {
  uni.navigateTo({ url: '/pages/recipe-upload/index' })
}

const toggleDish = (index: number) => {
  const dish = dishes.value[index]
  dish.selected = !dish.selected
  if (dish.selected) {
    selectedMap.value = { ...selectedMap.value, [dish.id]: dish }
  } else {
    const next = { ...selectedMap.value }
    delete next[dish.id]
    selectedMap.value = next
  }
}

const goToOrder = () => {
  uni.setStorageSync(SELECTED_DISHES_KEY, Object.values(selectedMap.value))
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
  background: var(--theme-bg);
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
  border-bottom: 1px solid var(--theme-primary-light);
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
  background: var(--theme-primary-light);
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
  border: 2px dashed rgba(var(--theme-primary-rgb), 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
}

.upload-icon {
  width: 64px;
  height: 64px;
  background: var(--theme-primary-lighter);
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
  background: var(--theme-primary);
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
  background: var(--theme-primary-light);
  border-radius: 999px;
}

.dishes {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filters {
  white-space: nowrap;
  margin-bottom: 16px;
}

.filters-inner {
  display: inline-flex;
  gap: 12px;
}

.filter-chip {
  flex-shrink: 0;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0 20px;
  background: var(--theme-primary-lighter);
}

.filter-chip text {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.filter-chip.active {
  background: var(--theme-primary);
}

.dish-card {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--theme-primary-lighter);
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
  background: var(--theme-primary);
  color: #111;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
}

.dish-btn.selected {
  background: var(--theme-primary-light);
  border: 1px solid rgba(var(--theme-primary-rgb), 0.3);
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
