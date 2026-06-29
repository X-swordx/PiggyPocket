<template>
  <view class="container">
    <!-- Header - Glassmorphism style -->
    <view class="header">
      <view class="back-btn" @click="goBack">
        <uni-icons type="left" size="24" color="#ffc2cc" />
      </view>
      <view class="title">
        <text>添加食品</text>
      </view>
      <view class="placeholder-btn">
      </view>
    </view>

    <view class="content">
      <!-- Image Upload Area -->
      <view class="image-upload" @click="uploadImage">
        <view v-if="!formData.imageUrl" class="upload-placeholder">
          <uni-icons type="camera" size="48" color="#ffc2cc" />
          <text class="upload-text">点击上传食品图片</text>
        </view>
        <image v-else class="uploaded-image" :src="formData.imageUrl" mode="aspectFill" />
        <view class="image-badge">
          <text>{{ formData.name || '未命名' }}</text>
        </view>
      </view>

      <!-- Form Section -->
      <view class="form-section">
        <!-- Food Name Input -->
        <view class="form-item">
          <view class="label">
            <text>食品名称</text>
          </view>
          <view class="input-wrapper">
            <uni-icons type="shop" size="20" color="#ffc2cc" class="input-icon" />
            <input
              class="form-input"
              v-model="formData.name"
              placeholder="例如：有机全脂牛奶"
              placeholder-class="placeholder"
            />
          </view>
        </view>

        <!-- Expiry Date & Quantity Grid -->
        <view class="form-grid">
          <view class="form-item">
            <view class="label">
              <text>保质期至</text>
            </view>
            <view class="input-wrapper">
              <uni-icons type="calendar" size="20" color="#ffc2cc" class="input-icon" />
              <picker
                mode="date"
                :value="formData.expiryDate"
                @change="onDateChange"
                class="picker-wrapper"
              >
                <view class="picker-display">
                  <text :class="!formData.expiryDate ? 'placeholder-text' : ''">
                    {{ formData.expiryDate || '选择日期' }}
                  </text>
                </view>
              </picker>
            </view>
          </view>

          <view class="form-item">
            <view class="label">
              <text>数量</text>
            </view>
            <view class="input-wrapper">
              <uni-icons type="box" size="20" color="#ffc2cc" class="input-icon" />
              <input
                class="form-input"
                v-model.number="formData.quantity"
                type="number"
                placeholder="1"
                placeholder-class="placeholder"
              />
            </view>
          </view>
        </view>

        <!-- Storage Location -->
        <view class="form-item">
          <view class="label">
            <text>储存位置</text>
          </view>
          <view class="storage-grid">
            <view
              v-for="option in storageOptions"
              :key="option.value"
              class="storage-item"
              :class="{ active: formData.storage === option.value }"
              @click="formData.storage = option.value"
            >
              <uni-icons :type="option.icon" size="28" :color="formData.storage === option.value ? '#ffc2cc' : '#bbb'" />
              <text class="storage-label">{{ option.label }}</text>
            </view>
          </view>
        </view>

        <!-- Category Selection -->
        <view class="form-item">
          <view class="label">
            <text>食品分类</text>
          </view>
          <view class="category-grid">
            <view
              v-for="cat in categories"
              :key="cat.value"
              class="category-item"
              :class="{ active: formData.category === cat.value }"
              @click="formData.category = cat.value"
            >
              <text>{{ cat.label }}</text>
            </view>
          </view>
        </view>

        <!-- Notes Section -->
        <view class="notes-card">
          <view class="notes-header">
            <uni-icons type="text" size="20" color="#ffc2cc" />
            <text class="notes-title">备注 (可选)</text>
          </view>
          <textarea
            class="notes-input"
            v-model="formData.notes"
            placeholder="记录一些细节，比如购于哪家超市..."
            placeholder-class="placeholder"
            rows="3"
          />
        </view>
      </view>

      <!-- Bottom Spacer -->
      <view class="spacer"></view>
    </view>

    <!-- Fixed Bottom Action Button -->
    <view class="bottom-bar">
      <view class="submit-btn" @click="submitForm">
        <uni-icons type="plusempty" size="20" color="#321018" />
        <text>确认添加</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue'
import { uploadToOSS } from '@/services/oss'

interface FormData {
  name: string
  expiryDate: string
  quantity: number
  storage: string
  category: string
  notes: string
  imageUrl: string
}

const formData = ref<FormData>({
  name: '',
  expiryDate: '',
  quantity: 1,
  storage: 'fridge',
  category: 'dairy',
  notes: '',
  imageUrl: ''
})

const storageOptions = [
  { label: '冷藏', value: 'fridge', icon: 'home' },
  { label: '冷冻', value: 'freezer', icon: 'cold' },
  { label: '常温', value: 'pantry', icon: 'tag' }
]

const categories = [
  { label: '乳制品', value: 'dairy' },
  { label: '肉类', value: 'meat' },
  { label: '蔬菜', value: 'vegetable' },
  { label: '水果', value: 'fruit' },
  { label: '海鲜', value: 'seafood' },
  { label: '调味品', value: 'condiment' },
  { label: '零食', value: 'snack' },
  { label: '其他', value: 'other' }
]

const onDateChange = (e: any) => {
  formData.value.expiryDate = e.detail.value
}

const uploadImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      try {
        uni.showLoading({ title: '上传中...' })
        formData.value.imageUrl = await uploadToOSS(res.tempFilePaths[0], 'foods')
        uni.showToast({ title: '图片上传成功', icon: 'success' })
      } catch (err: any) {
        uni.showToast({ title: err.message || '上传失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
  })
}

const goBack = () => {
  uni.navigateBack()
}

const getRandomBgColor = () => {
  const colors = ['#8aa6cb', '#a8d5ba', '#d4a373', '#a88fca', '#f5cac3', '#f0b7a4']
  return colors[Math.floor(Math.random() * colors.length)]
}

const calculateDaysFromToday = (expiryDateStr: string): number => {
  const today = new Date()
  const expiry = new Date(expiryDateStr)
  const diffTime = expiry.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const getStatus = (days: number): { status: 'fresh' | 'expiring' | 'expired', statusText: string } => {
  if (days < 0) {
    return { status: 'expired', statusText: '已过期' }
  } else if (days <= 3) {
    return { status: 'expiring', statusText: '即将过期' }
  } else {
    return { status: 'fresh', statusText: '新鲜' }
  }
}

const submitForm = () => {
  if (!formData.value.name.trim()) {
    uni.showToast({ title: '请输入食品名称', icon: 'none' })
    return
  }
  if (!formData.value.expiryDate) {
    uni.showToast({ title: '请选择保质期日期', icon: 'none' })
    return
  }

  const days = calculateDaysFromToday(formData.value.expiryDate)
  const { status, statusText } = getStatus(days)
  const daysText = days < 0 ? `${Math.abs(days)}天前过期` : days === 0 ? '今天过期' : `${days}天后过期`

  // Get storage label
  const storageLabel = {
    fridge: '冰箱 (冷藏室)',
    freezer: '冰箱 (冷冻室)',
    pantry: '常温储藏'
  }[formData.value.storage] || formData.value.storage

  // Get category label
  const categoryLabel = categories.find(c => c.value === formData.value.category)?.label || '其他'

  // Prepare data to return to previous page
  const newItem = {
    name: formData.value.name,
    expiryDate: formData.value.expiryDate,
    daysText,
    daysCount: String(Math.abs(days)),
    status,
    statusText,
    tab: status === 'expiring' || status === 'expired' ? 1 : 0,
    bgColor: getRandomBgColor(),
    category: categoryLabel,
    spec: `${formData.value.quantity} · ${formData.value.quantity > 1 ? '件' : '件'}`,
    storage: storageLabel,
    notes: formData.value.notes
  }

  // For now, just show success and go back
  // In a real app, you would store this in a global store or backend
  uni.showToast({
    title: '添加成功',
    icon: 'success',
    duration: 1500
  })

  setTimeout(() => {
    uni.navigateBack()
  }, 1500)
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f8f5f6;
}

/* Header - Glassmorphism per Blush Velvet */
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

.back-btn, .placeholder-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  transition: background-color 0.2s;
}

.back-btn:active {
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
}

.content {
  flex: 1;
  padding: 16px;
  padding-bottom: 100px;
}

/* Image Upload Area */
.image-upload {
  position: relative;
  width: 100%;
  height: 192px;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 194, 204, 0.08);
  border: 2px dashed rgba(255, 194, 204, 0.4);
  margin-bottom: 24px;
  cursor: pointer;
  transition: all 0.2s;
}

.image-upload:active {
  background: rgba(255, 194, 204, 0.15);
  transform: scale(0.99);
}

.upload-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.upload-text {
  font-size: 14px;
  font-weight: 600;
  color: #ffc2cc;
}

.uploaded-image {
  width: 100%;
  height: 100%;
}

.image-badge {
  position: absolute;
  bottom: 16px;
  left: 16px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  padding: 6px 16px;
  border-radius: 999px;
  border: 1px solid rgba(255, 194, 204, 0.2);
}

.image-badge text {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #ffc2cc;
}

/* Form Section */
.form-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  padding-left: 4px;
}

.label text {
  font-size: 14px;
  font-weight: 700;
  color: #1f1a1b;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  z-index: 10;
}

.form-input {
  width: 100%;
  padding: 16px 16px 16px 52px;
  background: #ffffff;
  border: 1px solid rgba(255, 194, 204, 0.2);
  border-radius: 12px;
  font-size: 16px;
  color: #1f1a1b;
  transition: all 0.2s;
}

.form-input:focus {
  border-color: #ffc2cc;
  box-shadow: 0 0 0 2px rgba(255, 194, 204, 0.2);
  outline: none;
}

.placeholder {
  color: #9ca3af;
  font-size: 16px;
}

.picker-wrapper {
  display: block;
  width: 100%;
}

.picker-display {
  width: 100%;
  padding: 16px 16px 16px 52px;
  min-height: 56px;
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid rgba(255, 194, 204, 0.2);
  border-radius: 12px;
  box-sizing: border-box;
}

.placeholder-text {
  color: #9ca3af;
}

.picker-display text {
  font-size: 16px;
  color: #1f1a1b;
  line-height: 1.4;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* Storage Location Selection */
.storage-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.storage-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 8px;
  border-radius: 12px;
  border: 2px solid rgba(255, 194, 204, 0.1);
  background: #ffffff;
  transition: all 0.2s;
  gap: 6px;
}

.storage-item.active {
  border-color: #ffc2cc;
  background: rgba(255, 194, 204, 0.05);
}

.storage-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #504445;
}

/* Category Selection */
.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.category-item {
  padding: 12px 8px;
  border-radius: 10px;
  border: 1px solid rgba(255, 194, 204, 0.15);
  background: #ffffff;
  text-align: center;
  transition: all 0.2s;
}

.category-item.active {
  background: rgba(255, 194, 204, 0.2);
  border-color: #ffc2cc;
}

.category-item text {
  font-size: 13px;
  font-weight: 600;
  color: #504445;
}

.category-item.active text {
  color: #653a43;
}

/* Notes Card */
.notes-card {
  background: #ffffff;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 194, 204, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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
  color: #ffc2cc;
}

.notes-input {
  width: 100%;
  min-height: 80px;
  padding: 0;
  border: none;
  outline: none;
  font-size: 14px;
  line-height: 1.6;
  color: #504445;
  background: transparent;
  resize: none;
}

.notes-input::placeholder {
  color: #d1d5db;
}

.spacer {
  height: 40px;
}

/* Bottom Action Bar */
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

.submit-btn {
  width: 100%;
  height: 56px;
  background: #ffc2cc;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 700;
  font-size: 16px;
  color: #321018;
  box-shadow: 0 4px 16px rgba(255, 194, 204, 0.4);
  transition: all 0.2s;
}

.submit-btn:active {
  transform: scale(0.98);
  filter: brightness(1.05);
}
</style>
