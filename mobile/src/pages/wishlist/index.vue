<template>
  <view class="container" :style="themeStyle">
    <!-- Header -->
    <view class="header">
      <view class="back-btn" @click="goBack">
        <uni-icons type="left" size="24" color="#777" />
      </view>
      <view class="title">
        <text>心愿清单</text>
      </view>
    </view>

    <!-- Progress Section -->
    <view class="progress-section">
      <view class="progress-card">
        <view class="progress-header">
          <view class="progress-title">
            <text class="label">心愿进度</text>
            <text class="count">{{ completedCount }} <text class="total">/ {{ totalCount }} 项</text></text>
          </view>
          <view class="progress-icon">
            <uni-icons type="star-filled" size="24" color="#ec4899" />
          </view>
        </view>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
        </view>
        <text class="progress-text">加油！还有{{ remainingCount }}个心愿待实现！</text>
      </view>
    </view>

    <!-- Filter Chips -->
    <view class="filters">
      <view
        v-for="(filter, index) in filters"
        :key="index"
        class="filter-chip"
        :class="{ active: currentFilter === index }"
        @click="currentFilter = index"
      >
        <text>{{ filter }}</text>
      </view>
    </view>

    <!-- Wishlist Items -->
    <view class="items">
      <view v-for="item in filteredItems" :key="item.id" class="item" @click="toggleItem(item)">
        <view class="checkbox" :class="{ checked: item.completed }">
          <uni-icons v-if="item.completed" type="checkmarkempty" size="16" color="#fff" />
        </view>
        <view class="item-content">
          <text class="item-title" :class="{ completed: item.completed }">{{ item.title }}</text>
          <view class="item-tag" :class="item.tagClass">
            <text>{{ item.category }}</text>
          </view>
        </view>
        <uni-icons type="more-filled" size="24" color="#d1d5db" />
      </view>
    </view>

    <!-- Add Wish Modal -->
    <view class="modal-overlay" v-if="showModal" @click="closeModal">
      <view class="modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">添加新心愿</text>
          <view class="close-btn" @click="closeModal">
            <uni-icons type="clear" size="20" color="#999" />
          </view>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="label">心愿名称</text>
            <textarea
              v-model="newWishTitle"
              class="textarea"
              placeholder="输入你的心愿..."
              maxlength="50"
              auto-height
            />
          </view>
          <view class="form-item">
            <text class="label">分类</text>
            <view class="category-list">
              <view
                v-for="cat in categoryOptions"
                :key="cat.value"
                class="category-item"
                :class="{ active: newWishCategory === cat.value }"
                @click="newWishCategory = cat.value"
              >
                <text>{{ cat.label }}</text>
              </view>
            </view>
          </view>
        </view>
        <view class="modal-footer">
          <view class="btn btn-cancel" @click="closeModal">
            <text>取消</text>
          </view>
          <view class="btn btn-confirm" @click="submitWish">
            <text>确认添加</text>
          </view>
        </view>
      </view>
    </view>

    <!-- Add Wish FAB -->
    <view class="fab" @click="addWish">
      <uni-icons type="plus" size="28" color="#fff" />
    </view>

    <!-- Tab Bar -->
    <TabBar :current-index="0" @change="handleTabChange" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import TabBar from '@/components/TabBar.vue'
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue'
import {
  getActiveWishes,
  getCompletedCount,
  getTotalCount,
  completeWish,
  addWish as addWishToStore,
  type Wish
} from '@/services/wishlist'
import { themeStyle } from '@/utils/theme'

const filters = ['全部', '旅行', '技能', '健康', '家居']
const currentFilter = ref(0)

const items = ref<Wish[]>([])

const filteredItems = computed(() => {
  if (currentFilter.value === 0) {
    return items.value
  }
  return items.value.filter(item => item.filter === currentFilter.value)
})

const completedCount = ref(0)
const totalCount = ref(0)
const remainingCount = computed(() => totalCount.value - completedCount.value)
const progressPercent = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((completedCount.value / totalCount.value) * 100)
})

const reload = async () => {
  try {
    const [active, completed, total] = await Promise.all([
      getActiveWishes(),
      getCompletedCount(),
      getTotalCount()
    ])
    items.value = active
    completedCount.value = completed
    totalCount.value = total
  } catch (err: any) {
    uni.showToast({ title: err.message || '心愿加载失败', icon: 'none' })
  }
}

onShow(reload)

const goBack = () => {
  uni.navigateBack()
}

const toggleItem = async (item: Wish) => {
  try {
    await completeWish(item.id)
    await reload()
    uni.showToast({ title: '心愿已实现', icon: 'success' })
  } catch (err: any) {
    uni.showToast({ title: err.message || '操作失败', icon: 'none' })
  }
}

// Add Wish Modal
const showModal = ref(false)
const newWishTitle = ref('')
const newWishCategory = ref('travel')

interface CategoryOption {
  label: string
  value: string
  filter: number
  tagClass: string
}

const categoryOptions: CategoryOption[] = [
  { label: '旅行', value: 'travel', filter: 1, tagClass: 'travel' },
  { label: '技能', value: 'skill', filter: 2, tagClass: 'skill' },
  { label: '健康', value: 'health', filter: 3, tagClass: 'health' },
  { label: '成长', value: 'growth', filter: 0, tagClass: 'growth' }
]

const addWish = () => {
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  newWishTitle.value = ''
  newWishCategory.value = 'travel'
}

const submitWish = async () => {
  if (!newWishTitle.value.trim()) {
    uni.showToast({ title: '请输入心愿名称', icon: 'none' })
    return
  }
  const category = categoryOptions.find(c => c.value === newWishCategory.value)
  try {
    await addWishToStore({
      title: newWishTitle.value.trim(),
      category: category?.label || '旅行',
      tagClass: category?.tagClass || 'travel',
      filter: category?.filter || 1
    })
    uni.showToast({ title: '添加成功', icon: 'success' })
    closeModal()
    await reload()
  } catch (err: any) {
    uni.showToast({ title: err.message || '添加失败', icon: 'none' })
  }
}

const handleTabChange = (index: number) => {
  if (index === 0) {
    uni.reLaunch({ url: '/pages/index/index' })
  } else if (index === 1) {
    uni.reLaunch({ url: '/pages/expiry/index' })
  } else if (index === 2) {
    uni.reLaunch({ url: '/pages/food-menu/index' })
  } else if (index === 3) {
    uni.reLaunch({ url: '/pages/profile/index' })
  }
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
  padding: 24px 16px 8px;
  padding-top: calc(24px + var(--status-bar-height));
  background: rgba(248, 245, 246, 0.8);
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.fab {
  position: fixed;
  right: 20px;
  bottom: calc(80px + env(safe-area-inset-bottom));
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--theme-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(var(--theme-primary-rgb), 0.5);
  z-index: 20;
}

.title {
  flex: 1;
  text-align: center;
}

.title text {
  font-size: 20px;
  font-weight: 700;
}

.progress-section {
  padding: 24px 16px;
}

.progress-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--theme-primary-light);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-title {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 12px;
  font-weight: 600;
  color: #777;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.count {
  font-size: 24px;
  font-weight: 700;
  color: #111;
}

.total {
  font-size: 14px;
  font-weight: 400;
  color: #777;
}

.progress-icon {
  width: 48px;
  height: 48px;
  background: var(--theme-primary-light);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-bar {
  position: relative;
  height: 12px;
  width: 100%;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--theme-primary);
  transition: width 1s;
}

.progress-text {
  margin-top: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #ec4899;
}

.filters {
  display: flex;
  gap: 12px;
  padding: 0 16px 16px;
  overflow-x: auto;
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

.filter-chip.active text {
  font-weight: 600;
}

.items {
  padding: 0 16px;
  padding-bottom: 100px;
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
}

.checkbox {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--theme-primary);
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

/* Add Wish Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 200;
  animation: fadeIn 0.3s ease;
}

.modal {
  width: 100%;
  background: white;
  border-radius: 20px 20px 0 0;
  padding: 0 16px;
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
  animation: slideUp 0.3s ease;
  box-sizing: border-box;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px;
  border-bottom: 1px solid rgba(243, 244, 246, 1);
}

.modal-title {
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

.modal-body {
  padding: 20px 16px;
}

.form-item {
  margin-bottom: 20px;
}

.form-item:last-child {
  margin-bottom: 0;
}

.label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.textarea {
  width: 100%;
  min-height: 80px;
  max-height: 120px;
  padding: 12px 16px;
  padding-right: 20px;
  background: #F9FAFB;
  border-radius: 8px;
  border: 1px solid rgba(var(--theme-primary-rgb), 0.3);
  font-size: 16px;
  line-height: 1.5;
  box-sizing: border-box;
}

.textarea:focus {
  outline: none;
  border-color: var(--theme-primary);
}

.category-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
}

.category-item {
  padding: 8px 16px;
  border-radius: 999px;
  background: var(--theme-primary-lighter);
  border: 1px solid transparent;
  font-size: 14px;
  color: #6b7280;
}

.category-item.active {
  background: var(--theme-primary);
  color: white;
  font-weight: 600;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid rgba(243, 244, 246, 1);
}

.btn {
  flex: 1;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
}

.btn-cancel {
  background: rgba(243, 244, 246, 1);
  color: #6b7280;
}

.btn-confirm {
  background: var(--theme-primary);
  color: white;
  box-shadow: 0 4px 12px rgba(var(--theme-primary-rgb), 0.3);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>
