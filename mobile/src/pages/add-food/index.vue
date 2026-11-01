<template>
  <view class="container" :style="themeStyle">
    <!-- Header - Glassmorphism style -->
    <view class="header">
      <view class="back-btn" @click="goBack">
        <uni-icons type="left" size="24" color="var(--theme-primary)" />
      </view>
      <view class="title">
        <text>{{ isEditing ? '编辑物品' : '添加物品' }}</text>
      </view>
      <view class="placeholder-btn">
      </view>
    </view>

    <view class="content">
      <!-- Image Upload Area -->
      <view class="image-upload" @click="uploadImage">
        <view v-if="!formData.imageUrl" class="upload-placeholder">
          <uni-icons type="camera" size="48" color="var(--theme-primary)" />
          <text class="upload-text">点击上传物品图片</text>
        </view>
        <image v-else class="uploaded-image" :src="formData.imageUrl" mode="aspectFill" />
        <view class="image-badge">
          <text>{{ formData.name || '未命名' }}</text>
        </view>
      </view>

      <!-- Photo Recognition -->
      <view class="recognize-row">
        <view
          class="recognize-btn"
          :class="{ disabled: recognizing }"
          @click="recognizeFromPhoto"
        >
          <uni-icons type="camera" size="18" color="var(--theme-primary)" />
          <text>{{ recognizing ? '识别中...' : '拍照识别' }}</text>
        </view>
        <text class="recognize-hint">可先拍名称面，再拍日期面（日期面可跳过）</text>
      </view>

      <view
        v-if="recognitionApplied || recognitionWarnings.length"
        class="recognize-warnings"
      >
        <view class="warn-head">
          <text class="warn-title">
            {{ recognitionApplied ? 'AI 识别结果，请核对后保存' : '识别提示' }}
          </text>
          <text class="warn-close" @click="clearRecognitionTip">关闭</text>
        </view>
        <text
          v-for="(warning, index) in recognitionWarnings"
          :key="index"
          class="warn-item"
        >· {{ warning }}</text>
      </view>

      <!-- Form Section -->
      <view class="form-section">
        <!-- Item Name Input -->
        <view class="form-item">
          <view class="label">
            <text>物品名称</text>
          </view>
          <view class="input-wrapper">
            <uni-icons type="shop" size="20" color="var(--theme-primary)" class="input-icon" />
            <input
              class="form-input"
              v-model="formData.name"
              placeholder="例如：布洛芬缓释胶囊"
              placeholder-class="placeholder"
            />
          </view>
        </view>

        <!-- Production Date & Quantity Grid -->
        <view class="form-grid">
          <view class="form-item">
            <view class="label">
              <text>生产日期</text>
            </view>
            <view class="input-wrapper">
              <uni-icons type="calendar" size="20" color="var(--theme-primary)" class="input-icon" />
              <picker
                mode="date"
                :value="formData.productionDate"
                :end="todayStr"
                @change="onDateChange"
                class="picker-wrapper"
              >
                <view class="picker-display">
                  <text :class="!formData.productionDate ? 'placeholder-text' : ''">
                    {{ formData.productionDate || '选择日期' }}
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
              <uni-icons type="box" size="20" color="var(--theme-primary)" class="input-icon" />
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

        <!-- Shelf Life -->
        <view class="form-item">
          <view class="label">
            <text>保质期</text>
          </view>
          <view class="shelf-life-row">
            <view class="input-wrapper shelf-life-input">
              <uni-icons type="clock" size="20" color="var(--theme-primary)" class="input-icon" />
              <input
                class="form-input"
                v-model.number="formData.shelfLifeValue"
                type="number"
                placeholder="请输入保质期"
                placeholder-class="placeholder"
              />
            </view>
            <view class="unit-toggle">
              <view
                class="unit-item"
                :class="{ active: formData.shelfLifeUnit === 'day' }"
                @click="formData.shelfLifeUnit = 'day'"
              >
                <text>天</text>
              </view>
              <view
                class="unit-item"
                :class="{ active: formData.shelfLifeUnit === 'month' }"
                @click="formData.shelfLifeUnit = 'month'"
              >
                <text>月</text>
              </view>
            </view>
          </view>
          <text v-if="computedExpiryDate" class="shelf-life-hint">
            到期日期：{{ computedExpiryDate }}
          </text>
        </view>

        <!-- Remind Ahead -->
        <view class="form-item">
          <view class="label">
            <text>提前提醒</text>
          </view>
          <view class="input-wrapper">
            <uni-icons type="notification" size="20" color="var(--theme-primary)" class="input-icon" />
            <picker
              :value="remindIndex"
              :range="remindOptions"
              range-key="label"
              @change="onRemindChange"
              class="picker-wrapper"
            >
              <view class="picker-display">
                <text>{{ remindOptions[remindIndex].label }}</text>
              </view>
            </picker>
          </view>
        </view>

        <!-- Storage Location -->
        <view class="form-item">
          <view class="label">
            <text>存放位置</text>
          </view>
          <view class="storage-grid">
            <view
              v-for="option in storageOptions"
              :key="option.value"
              class="storage-item"
              :class="{ active: formData.storage === option.value }"
              @click="formData.storage = option.value"
            >
              <uni-icons :type="option.icon" size="28" :color="formData.storage === option.value ? 'var(--theme-primary)' : '#bbb'" />
              <text class="storage-label">{{ option.label }}</text>
            </view>
          </view>
        </view>

        <!-- Category Selection -->
        <view class="form-item">
          <view class="label">
            <text>物品分类</text>
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

        <!-- Share to dining group -->
        <view class="form-item">
          <view class="label">
            <text>共享范围</text>
          </view>
          <view class="input-wrapper">
            <uni-icons type="staff" size="20" color="var(--theme-primary)" class="input-icon" />
            <picker
              :value="shareIndex"
              :range="shareOptions"
              @change="onShareChange"
              class="picker-wrapper"
            >
              <view class="picker-display">
                <text>{{ shareOptions[shareIndex] }}</text>
              </view>
            </picker>
          </view>
        </view>

        <!-- Notes Section -->
        <view class="notes-card">
          <view class="notes-header">
            <uni-icons type="text" size="20" color="var(--theme-primary)" />
            <text class="notes-title">备注 (可选)</text>
          </view>
          <textarea
            class="notes-input"
            v-model="formData.notes"
            placeholder="记录一些细节，比如品牌、放在哪一格（搜索时也会用到）"
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

    <PrivacyModal ref="privacyModal" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue'
import PrivacyModal from '@/components/PrivacyModal.vue'
import { uploadToOSS } from '@/services/oss'
import {
  addExpiryItem,
  editExpiryItem,
  getExpiryItem,
  ensureSubscribe,
  recognizeExpiryLabel
} from '@/services/expiry'
import { getMyDiningGroups, getCurrentUser, type DiningGroup } from '@/services/foodieBuddy'
import { themeStyle } from '@/utils/theme'
import { addShelfLife, type ShelfLifeUnit } from '@/utils/shelfLife'

interface FormData {
  name: string
  productionDate: string
  shelfLifeValue: number | null
  shelfLifeUnit: ShelfLifeUnit
  quantity: number
  remindDays: number
  storage: string
  category: string
  notes: string
  imageUrl: string
  groupId: number | null
}

const formData = ref<FormData>({
  name: '',
  productionDate: '',
  shelfLifeValue: null,
  shelfLifeUnit: 'day',
  quantity: 1,
  remindDays: 3,
  storage: 'fridge',
  category: 'food',
  notes: '',
  imageUrl: '',
  groupId: null
})

/** 生产日期不能晚于今天，取东八区当地日期作为选择上限 */
const now = new Date()
const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
  now.getDate()
).padStart(2, '0')}`

/** 按生产日期 + 保质期实时算出到期日，填表时给用户预览 */
const computedExpiryDate = computed(() => {
  const v = formData.value
  if (!v.productionDate || !v.shelfLifeValue || v.shelfLifeValue < 1) return ''
  return addShelfLife(v.productionDate, Number(v.shelfLifeValue), v.shelfLifeUnit)
})

// 共享范围：第 0 项固定为「仅自己」，其余是我加入的搭伙小组
const groups = ref<DiningGroup[]>([])
const shareOptions = computed(() => ['仅自己', ...groups.value.map((g) => g.name)])
const shareIndex = computed(() => {
  if (!formData.value.groupId) return 0
  const idx = groups.value.findIndex((g) => g.id === formData.value.groupId)
  return idx >= 0 ? idx + 1 : 0
})
const onShareChange = (e: any) => {
  const idx = Number(e.detail.value)
  formData.value.groupId = idx === 0 ? null : groups.value[idx - 1]?.id ?? null
}

const loadGroups = async () => {
  try {
    const user = await getCurrentUser()
    groups.value = await getMyDiningGroups(user.id)
  } catch (err) {
    groups.value = []
  }
}

const editingId = ref(0)
const isEditing = ref(false)
const submitting = ref(false)
const recognizing = ref(false)
const recognitionApplied = ref(false)
const recognitionWarnings = ref<string[]>([])
const privacyModal = ref<InstanceType<typeof PrivacyModal>>()

const storageOptions = [
  { label: '冷藏', value: 'fridge', icon: 'home' },
  { label: '冷冻', value: 'freezer', icon: 'cold' },
  { label: '常温', value: 'pantry', icon: 'tag' },
  { label: '收纳柜', value: 'cabinet', icon: 'folder-add' },
  { label: '其他', value: 'other', icon: 'more' }
]

const categories = [
  { label: '食品饮料', value: 'food' },
  { label: '药品', value: 'medicine' },
  { label: '美妆护肤', value: 'cosmetic' },
  { label: '日用品', value: 'daily' },
  { label: '宠物用品', value: 'pet' },
  { label: '滤芯耗材', value: 'consumable' },
  { label: '卡券会员', value: 'card' },
  { label: '证件保险', value: 'document' },
  { label: '其他', value: 'other' }
]

const remindOptions = [
  { label: '到期当天提醒', value: 0 },
  { label: '提前 1 天', value: 1 },
  { label: '提前 3 天', value: 3 },
  { label: '提前 7 天', value: 7 },
  { label: '提前 15 天', value: 15 },
  { label: '提前 30 天', value: 30 }
]

const remindIndex = computed(() => {
  const idx = remindOptions.findIndex((o) => o.value === formData.value.remindDays)
  return idx >= 0 ? idx : 2
})

const onRemindChange = (e: any) => {
  formData.value.remindDays = remindOptions[Number(e.detail.value)].value
}

const onDateChange = (e: any) => {
  formData.value.productionDate = e.detail.value
}

const uploadImage = async () => {
  const agreed = await privacyModal.value?.ensurePrivacyAgreement()
  if (!agreed) return

  uni.chooseMedia({
    count: 1,
    mediaType: ['image'],
    sourceType: ['album', 'camera'],
    sizeType: ['compressed'],
    success: async (res) => {
      const tempFilePath = res.tempFiles?.[0]?.tempFilePath
      if (!tempFilePath) return
      try {
        uni.showLoading({ title: '上传中...' })
        formData.value.imageUrl = await uploadToOSS(tempFilePath, 'items')
        uni.showToast({ title: '图片上传成功', icon: 'success' })
      } catch (err: any) {
        uni.showToast({ title: err.message || '上传失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    },
    fail: (err) => {
      console.error('chooseMedia fail', err)
      if (err.errMsg?.includes('cancel')) return
      uni.showToast({ title: err.errMsg || '选择图片失败', icon: 'none' })
    }
  })
}

/** 表单里已有内容时先确认，避免识别结果覆盖手填值 */
const confirmOverwrite = (): Promise<boolean> => {
  const hasContent = Boolean(
    formData.value.name ||
    formData.value.productionDate ||
    formData.value.shelfLifeValue ||
    formData.value.imageUrl
  )
  if (!hasContent) return Promise.resolve(true)

  return new Promise((resolve) => {
    uni.showModal({
      title: '覆盖已填写内容',
      content: '识别结果会覆盖名称、生产日期、保质期和图片，是否继续？',
      confirmText: '继续',
      cancelText: '取消',
      success: (res) => resolve(res.confirm),
      fail: () => resolve(false)
    })
  })
}

const clearRecognitionTip = () => {
  recognitionApplied.value = false
  recognitionWarnings.value = []
}

/** 选一张图；取消或失败返回 null */
const chooseOneImage = (): Promise<string | null> =>
  new Promise((resolve) => {
    uni.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera', 'album'],
      sizeType: ['compressed'],
      success: (res) => resolve(res.tempFiles?.[0]?.tempFilePath || null),
      fail: (err) => {
        console.error('chooseMedia fail', err)
        if (!err.errMsg?.includes('cancel')) {
          uni.showToast({ title: err.errMsg || '选择图片失败', icon: 'none' })
        }
        resolve(null)
      }
    })
  })

const askContinueDatePhoto = (): Promise<boolean> =>
  new Promise((resolve) => {
    uni.showModal({
      title: '继续拍日期面',
      content: '名称面已上传。是否再拍一张生产日期/保质期喷码面？',
      confirmText: '继续拍',
      cancelText: '跳过',
      success: (res) => resolve(res.confirm),
      fail: () => resolve(false)
    })
  })

/**
 * 先拍名称面，再询问是否拍日期面；两张一起交给后端识别。
 * 识别结果只预填表单，用户点「确认添加」才入库。
 */
const recognizeFromPhoto = async () => {
  if (recognizing.value) return
  const agreed = await privacyModal.value?.ensurePrivacyAgreement()
  if (!agreed) return

  recognizing.value = true
  try {
    const nameTempPath = await chooseOneImage()
    if (!nameTempPath) return

    uni.showLoading({ title: '上传名称面...', mask: true })
    const nameImageUrl = await uploadToOSS(nameTempPath, 'items')
    uni.hideLoading()

    const imageUrls = [nameImageUrl]
    if (await askContinueDatePhoto()) {
      const dateTempPath = await chooseOneImage()
      if (dateTempPath) {
        uni.showLoading({ title: '上传日期面...', mask: true })
        imageUrls.push(await uploadToOSS(dateTempPath, 'items'))
        uni.hideLoading()
      }
    }

    uni.showLoading({ title: '识别中...', mask: true })
    const result = await recognizeExpiryLabel(imageUrls)
    uni.hideLoading()

    const hasField = Boolean(
      result.name ||
        result.productionDate ||
        (result.shelfLifeValue && result.shelfLifeUnit)
    )
    if (!result.recognized || !hasField) {
      recognitionApplied.value = false
      recognitionWarnings.value = result.warnings
      uni.showToast({ title: '未识别到完整信息，请手动填写', icon: 'none' })
      return
    }

    const overwrite = await confirmOverwrite()
    if (!overwrite) return

    if (result.name) formData.value.name = result.name
    if (result.productionDate) {
      formData.value.productionDate = result.productionDate
    }
    if (result.shelfLifeValue && result.shelfLifeUnit) {
      formData.value.shelfLifeValue = result.shelfLifeValue
      formData.value.shelfLifeUnit = result.shelfLifeUnit
    }
    formData.value.imageUrl = nameImageUrl
    recognitionApplied.value = true
    recognitionWarnings.value = result.warnings
    uni.showToast({ title: '已识别，请核对', icon: 'success' })
  } catch (err: any) {
    uni.hideLoading()
    uni.showToast({
      title: err.message || '识别失败，请手动填写',
      icon: 'none'
    })
  } finally {
    recognizing.value = false
  }
}

const goBack = () => {
  uni.navigateBack()
}

const getRandomBgColor = () => {
  const colors = ['#8aa6cb', '#a8d5ba', '#d4a373', '#a88fca', '#f5cac3', '#f0b7a4']
  return colors[Math.floor(Math.random() * colors.length)]
}

onLoad(async (options: any) => {
  loadGroups()
  if (options?.id) {
    editingId.value = Number(options.id)
    isEditing.value = true
    try {
      const item = await getExpiryItem(editingId.value)
      formData.value = {
        name: item.name,
        productionDate: item.productionDate || '',
        shelfLifeValue: item.shelfLifeValue ?? null,
        shelfLifeUnit: item.shelfLifeUnit || 'day',
        quantity: item.quantity || 1,
        remindDays: item.remindDays ?? 3,
        storage: item.storage || 'fridge',
        category: item.category || 'food',
        notes: item.notes || '',
        imageUrl: item.imageUrl || '',
        groupId: item.groupId ?? null
      }
    } catch (err: any) {
      uni.showToast({ title: err.message || '加载失败', icon: 'none' })
    }
  }
})

/**
 * 保存后询问是否开启微信提醒。
 * 微信规则：一次授权只能推一条消息，所以每次保存都问一次，把配额攒在后端。
 */
const askSubscribe = () =>
  new Promise<void>((resolve) => {
    uni.showModal({
      title: '开启到期提醒',
      content: '到了提醒日期，用微信服务通知提醒你处理。每次授权可推送一条。',
      confirmText: '开启',
      cancelText: '暂不',
      success: async (res) => {
        if (res.confirm) {
          try {
            await ensureSubscribe()
          } catch (err) {
            console.error('ensureSubscribe fail', err)
          }
        }
        resolve()
      },
      fail: () => resolve()
    })
  })

const submitForm = async () => {
  if (submitting.value) return
  if (!formData.value.name.trim()) {
    uni.showToast({ title: '请输入物品名称', icon: 'none' })
    return
  }
  if (!formData.value.productionDate) {
    uni.showToast({ title: '请选择生产日期', icon: 'none' })
    return
  }
  if (!formData.value.shelfLifeValue || formData.value.shelfLifeValue < 1) {
    uni.showToast({ title: '请填写保质期', icon: 'none' })
    return
  }

  const payload = {
    name: formData.value.name.trim(),
    productionDate: formData.value.productionDate,
    shelfLifeValue: Number(formData.value.shelfLifeValue),
    shelfLifeUnit: formData.value.shelfLifeUnit,
    quantity: formData.value.quantity || 1,
    remindDays: formData.value.remindDays,
    storage: formData.value.storage,
    category: formData.value.category,
    notes: formData.value.notes || undefined,
    imageUrl: formData.value.imageUrl || undefined,
    groupId: formData.value.groupId
  }

  submitting.value = true
  try {
    if (isEditing.value) {
      await editExpiryItem(editingId.value, payload)
      uni.showToast({ title: '保存成功', icon: 'success', duration: 1500 })
    } else {
      await addExpiryItem({ ...payload, bgColor: getRandomBgColor() })
      uni.showToast({ title: '添加成功', icon: 'success', duration: 1500 })
    }
    await askSubscribe()
    uni.navigateBack()
  } catch (err: any) {
    uni.showToast({ title: err.message || '操作失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--theme-bg);
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
  border-bottom: 1px solid rgba(var(--theme-primary-rgb), 0.2);
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
  background: rgba(var(--theme-primary-rgb), 0.1);
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
  background: rgba(var(--theme-primary-rgb), 0.08);
  border: 2px dashed rgba(var(--theme-primary-rgb), 0.4);
  margin-bottom: 24px;
  cursor: pointer;
  transition: all 0.2s;
}

.image-upload:active {
  background: rgba(var(--theme-primary-rgb), 0.15);
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
  color: var(--theme-primary);
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
  border: 1px solid rgba(var(--theme-primary-rgb), 0.2);
}

.image-badge text {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--theme-primary);
}

/* Photo Recognition */
.recognize-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.recognize-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 999px;
  background: rgba(var(--theme-primary-rgb), 0.12);
  border: 1px solid rgba(var(--theme-primary-rgb), 0.25);
  color: var(--theme-primary);
  font-size: 14px;
  font-weight: 600;
}

.recognize-btn:active {
  transform: scale(0.97);
}

.recognize-btn.disabled {
  opacity: 0.5;
}

.recognize-hint {
  font-size: 12px;
  color: #999;
}

.recognize-warnings {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(var(--theme-primary-rgb), 0.08);
  border: 1px solid rgba(var(--theme-primary-rgb), 0.18);
}

.warn-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.warn-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--theme-primary);
}

.warn-close {
  font-size: 12px;
  color: #999;
}

.warn-item {
  font-size: 12px;
  line-height: 1.6;
  color: #666;
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
  border: 1px solid rgba(var(--theme-primary-rgb), 0.2);
  border-radius: 12px;
  font-size: 16px;
  color: #1f1a1b;
  transition: all 0.2s;
}

.form-input:focus {
  border-color: var(--theme-primary);
  box-shadow: 0 0 0 2px rgba(var(--theme-primary-rgb), 0.2);
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
  border: 1px solid rgba(var(--theme-primary-rgb), 0.2);
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

/* Shelf Life: number input + day/month toggle */
.shelf-life-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.shelf-life-input {
  flex: 1;
}

.unit-toggle {
  flex-shrink: 0;
  display: flex;
  border: 1px solid rgba(var(--theme-primary-rgb), 0.2);
  border-radius: 12px;
  overflow: hidden;
}

.unit-item {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
}

.unit-item.active {
  background: rgba(var(--theme-primary-rgb), 0.2);
}

.unit-item text {
  font-size: 16px;
  font-weight: 600;
  color: #504445;
}

.unit-item.active text {
  color: #653a43;
}

.shelf-life-hint {
  padding-left: 4px;
  font-size: 12px;
  color: var(--theme-primary);
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
  border: 2px solid rgba(var(--theme-primary-rgb), 0.1);
  background: #ffffff;
  transition: all 0.2s;
  gap: 6px;
}

.storage-item.active {
  border-color: var(--theme-primary);
  background: rgba(var(--theme-primary-rgb), 0.05);
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
  border: 1px solid rgba(var(--theme-primary-rgb), 0.15);
  background: #ffffff;
  text-align: center;
  transition: all 0.2s;
}

.category-item.active {
  background: rgba(var(--theme-primary-rgb), 0.2);
  border-color: var(--theme-primary);
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
  border: 1px solid rgba(var(--theme-primary-rgb), 0.1);
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
  color: var(--theme-primary);
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
  border-top: 1px solid rgba(var(--theme-primary-rgb), 0.2);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.submit-btn {
  width: 100%;
  height: 56px;
  background: var(--theme-primary);
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 700;
  font-size: 16px;
  color: #321018;
  box-shadow: 0 4px 16px rgba(var(--theme-primary-rgb), 0.4);
  transition: all 0.2s;
}

.submit-btn:active {
  transform: scale(0.98);
  filter: brightness(1.05);
}
</style>
