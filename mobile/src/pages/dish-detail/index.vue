<template>
  <view class="container" :style="themeStyle">
    <!-- Header - Glassmorphism style per Blush Velvet -->
    <view class="header">
      <view class="back-btn" @click="goBack">
        <uni-icons type="left" size="24" color="var(--theme-primary)" />
      </view>
      <view class="title">
        <text>{{ isFoodExpiry ? '物品详情' : '菜品详情' }}</text>
      </view>
      <view class="share-btn" @click="shareDish">
        <uni-icons type="more" size="24" color="var(--theme-primary)" />
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
              <text>{{ food.category || '未分类' }}</text>
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
              <uni-icons type="box" size="28" color="var(--theme-primary)" />
            </view>
          </view>

          <!-- Expiry Bento Grid - as seen in prototype -->
          <view class="bento-grid">
            <!-- Expiry Status Card - Full Width -->
            <view class="expiry-card">
              <view class="card-header">
                <text class="card-label">到期状态</text>
                <view class="urgency-badge" :class="getStatusClass(food.status)">
                  <text>{{ getUrgencyText(food.status) }}</text>
                </view>
              </view>
              <view class="expiry-content">
                <view class="days-display">
                  <text class="days-number" :class="getStatusTextClass(food.status)">{{ food.daysCount || '?' }}</text>
                  <text class="days-label">{{ food.status === 'expired' ? '天前过期' : '天后到期' }}</text>
                </view>
                <text class="expiry-date">到期日期: {{ food.expiryDate }}</text>
              </view>
            </view>

            <!-- Remind Ahead - Full Width -->
            <view class="mini-card full-width">
              <view class="mini-card-icon bg-secondary-container">
                <uni-icons type="notification" size="20" color="#70585c" />
              </view>
              <view class="mini-card-content">
                <text class="mini-card-label">提醒设置</text>
                <text class="mini-card-value">{{ food.remindText || '提前 3 天提醒' }}</text>
              </view>
            </view>

            <!-- Storage Location - Full Width -->
            <view class="mini-card full-width">
              <view class="mini-card-icon bg-secondary-container">
                <uni-icons type="cold" size="20" color="#70585c" />
              </view>
              <view class="mini-card-content">
                <text class="mini-card-label">存放位置</text>
                <text class="mini-card-value">{{ food.storage || '未指定' }}</text>
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
              <text>修改物品</text>
            </view>
            <view class="action-btn danger-btn" @click="deleteFood">
              <uni-icons type="clear" size="20" color="#ba1a1a" />
              <text>删除物品</text>
            </view>
          </view>
        </view>

        <!-- Bottom spacer for fixed buttons -->
        <view class="spacer"></view>
      </view>

      <!-- Original Dish Detail Mode -->
      <view v-else class="dish-detail">
        <!-- Hero Image -->
        <view class="hero-section" @click="onHeroTap">
          <view class="hero-image">
            <image v-if="displayImage" class="hero-bg-image" :src="displayImage" mode="aspectFill" />
            <view v-else class="hero-fallback-bg"
              :style="{ background: `linear-gradient(135deg, ${dish.bgColor || '#f0b7a4'} 0%, var(--theme-gradient-end) 100%)` }"></view>
            <view v-if="editing" class="hero-edit-mask">
              <uni-icons type="camera-filled" size="28" color="#fff" />
              <text>更换封面</text>
            </view>
          </view>
        </view>

        <!-- Dish Name -->
        <view class="dish-name-section">
          <text v-if="!editing" class="dish-name">{{ dish.name }}</text>
          <input v-else class="edit-input name-input" v-model="editForm.name" placeholder="菜品名称" />
          <view v-if="editing" class="ai-search-btn" :class="{ disabled: !editForm.name.trim() }" @click="openAiSearch">
            <uni-icons type="search" size="16" :color="editForm.name.trim() ? '#fff' : '#bbb'" />
            <text>搜索用料和步骤</text>
          </view>
        </view>

        <!-- Dish Category (edit mode only) -->
        <view class="category-section" v-if="editing">
          <view class="section-header">
            <view class="header-line"></view>
            <text>菜品分类</text>
          </view>
          <view class="category-list">
            <view v-for="cat in categories" :key="cat.id" class="tag"
              :class="{ active: editForm.categoryId === cat.id }" @click="editForm.categoryId = cat.id">
              <text>{{ cat.name }}</text>
            </view>
            <text v-if="categoriesLoaded && !categories.length" class="category-empty">暂无可选分类，请联系管理员配置</text>
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
              <text v-if="!editing" class="info-value">{{ dish.calories }} 千卡</text>
              <view v-else class="edit-input-wrap">
                <input class="edit-input" v-model="editForm.calories" type="number" placeholder="千卡" />
                <text class="edit-suffix">千卡</text>
              </view>
            </view>
            <view class="info-card">
              <text class="info-label">烹饪时间</text>
              <text v-if="!editing" class="info-value">{{ dish.time }}</text>
              <input v-else class="edit-input" v-model="editForm.time" placeholder="如：30 分钟" />
            </view>
          </view>
        </view>

        <!-- Ingredients -->
        <view class="ingredients-section">
          <view class="section-header">
            <view class="header-line"></view>
            <text>用料清单</text>
            <view v-if="editing" class="add-ing-btn" @click="addIngredient">
              <uni-icons type="plus" size="16" color="var(--theme-primary)" />
            </view>
          </view>
          <view class="ingredients-list" v-if="displayIngredients.length">
            <view v-for="(ing, index) in displayIngredients" :key="index" class="ingredient-item">
              <template v-if="!editing">
                <text class="ingredient-name">{{ ing.name }}</text>
                <text class="ingredient-amount">{{ ing.amount }}</text>
              </template>
              <template v-else>
                <input class="edit-input ing-name-input" v-model="ing.name" placeholder="食材" />
                <input class="edit-input ing-amount-input" v-model="ing.amount" placeholder="用量" />
                <view class="ing-del-btn" @click="removeIngredient(index)">
                  <uni-icons type="clear" size="18" color="#ba1a1a" />
                </view>
              </template>
            </view>
          </view>
          <view v-else style="padding: 16px; color: #777;">暂无用料信息</view>
        </view>

        <!-- Cooking Steps -->
        <view class="steps-section">
          <view class="section-header">
            <view class="header-line"></view>
            <text>烹饪步骤</text>
            <view v-if="editing" class="add-ing-btn" @click="addStep">
              <uni-icons type="plus" size="16" color="var(--theme-primary)" />
            </view>
          </view>
          <view class="steps-list" v-if="displaySteps.length">
            <view v-for="(step, index) in displaySteps" :key="index" class="step-item">
              <view class="step-number">{{ index + 1 }}</view>
              <view class="step-content">
                <text v-if="!editing">{{ step }}</text>
                <view v-else class="step-edit-row">
                  <textarea class="edit-textarea" v-model="displaySteps[index]" placeholder="步骤描述" />
                  <view class="step-del-btn" @click="removeStep(index)">
                    <uni-icons type="clear" size="18" color="#ba1a1a" />
                  </view>
                </view>
              </view>
            </view>
          </view>
          <view v-else style="padding: 16px; color: #777;">暂无步骤信息</view>
        </view>

        <!-- Bottom spacer -->
        <view class="spacer-dish" v-if="!readonly"></view>
      </view>

      <!-- Edit / Save bottom bar for dish mode -->
      <view class="bottom-bar" v-if="!isFoodExpiry && !readonly">
        <template v-if="!editing">
          <view class="delete-btn-bar" @click="handleDeleteDish">
            <uni-icons type="trash" size="20" color="#ba1a1a" />
            <text>删除</text>
          </view>
          <view class="edit-btn" @click="startEditing">
            <uni-icons type="compose" size="20" color="#321018" />
            <text>修改</text>
          </view>
        </template>
        <template v-else>
          <view class="cancel-btn" @click="cancelEditing">
            <text>取消</text>
          </view>
          <view class="save-btn" @click="saveDish">
            <uni-icons type="checkmarkempty" size="20" color="#fff" />
            <text>保存</text>
          </view>
        </template>
      </view>
    </view>

    <PrivacyModal ref="privacyModal" />
    <AiRecipeModal ref="aiModal" @fill="onAiFill" />

  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue'
import PrivacyModal from '@/components/PrivacyModal.vue'
import AiRecipeModal from '@/components/AiRecipeModal.vue'
import {
  getCurrentUser,
  getDish,
  getDishCategories,
  updateDish,
  deleteDish,
  type DishCategory,
  type FoodieDish,
  type FoodieUser
} from '@/services/foodieBuddy'
import { uploadToOSS } from '@/services/oss'
import {
  getExpiryItem,
  removeExpiryItem,
  CATEGORY_LABELS,
  STORAGE_LABELS,
  STORAGE_LABEL_DEFAULT
} from '@/services/expiry'
import { themeStyle } from '@/utils/theme'

interface Dish {
  name: string
  calories: string
  time: string
  ingredients: Array<{ name: string; amount: string }>
  steps: string[]
  bgColor?: string
  image?: string
  categoryId?: number | null
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
  remindText?: string
  notes?: string
}

const currentUser = ref<FoodieUser | null>(null)
const dishId = ref<number>(0)
const foodId = ref<number>(0)
const dish = ref<Dish>({
  name: '',
  calories: '--',
  time: '未知',
  ingredients: [],
  steps: []
})

const food = ref<FoodItem>({
  name: '',
  expiryDate: '',
  daysText: '',
  status: 'fresh',
  statusText: '',
  bgColor: '#ffc2cc'
})

const isFoodExpiry = computed(() => !!food.value.name)

// 从历史菜单进入时只读回看，不允许删改
const readonly = ref(false)

// --- Edit mode ---
const editing = ref(false)
const saving = ref(false)
const privacyModal = ref<InstanceType<typeof PrivacyModal>>()
const aiModal = ref<InstanceType<typeof AiRecipeModal>>()

const categories = ref<DishCategory[]>([])
const categoriesLoaded = ref(false)

const loadCategories = async () => {
  try {
    categories.value = await getDishCategories()
  } catch (err: any) {
    uni.showToast({ title: err.message || '加载菜品分类失败', icon: 'none' })
  } finally {
    categoriesLoaded.value = true
  }
}

interface EditForm {
  name: string
  calories: string
  time: string
  ingredients: Array<{ name: string; amount: string }>
  steps: string[]
  image: string
  categoryId: number | null
}

const editForm = ref<EditForm>({
  name: '',
  calories: '',
  time: '',
  ingredients: [],
  steps: [],
  image: '',
  categoryId: null
})

const displayIngredients = computed(() => editing.value ? editForm.value.ingredients : dish.value.ingredients)
const displaySteps = computed(() => editing.value ? editForm.value.steps : dish.value.steps)
const displayImage = computed(() => editing.value ? editForm.value.image : dish.value.image)

const startEditing = () => {
  editForm.value = {
    name: dish.value.name,
    calories: dish.value.calories === '--' ? '' : dish.value.calories,
    time: dish.value.time === '未知' ? '' : dish.value.time,
    ingredients: dish.value.ingredients.length ? dish.value.ingredients.map(i => ({ ...i })) : [],
    steps: dish.value.steps.length ? [...dish.value.steps] : [],
    image: dish.value.image || '',
    categoryId: dish.value.categoryId ?? null
  }
  editing.value = true
  if (!categoriesLoaded.value) loadCategories()
}

const cancelEditing = () => {
  editing.value = false
}

const chooseCover = async () => {
  const agreed = await privacyModal.value?.ensurePrivacyAgreement()
  if (!agreed) return

  uni.chooseMedia({
    count: 1,
    mediaType: ['image'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempFilePath = res.tempFiles?.[0]?.tempFilePath
      if (!tempFilePath) return
      try {
        uni.showLoading({ title: '上传中...' })
        editForm.value.image = await uploadToOSS(tempFilePath, 'dishes')
        uni.showToast({ title: '封面更新成功', icon: 'success' })
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

const onHeroTap = () => {
  if (editing.value) {
    chooseCover()
    return
  }
  if (dish.value.image) {
    uni.previewImage({
      urls: [dish.value.image],
      current: dish.value.image
    })
  }
}

const addIngredient = () => {
  editForm.value.ingredients.push({ name: '', amount: '' })
}

const removeIngredient = (index: number) => {
  editForm.value.ingredients.splice(index, 1)
}

const addStep = () => {
  editForm.value.steps.push('')
}

const removeStep = (index: number) => {
  editForm.value.steps.splice(index, 1)
}

const openAiSearch = () => {
  const name = editForm.value.name.trim()
  if (!name) {
    uni.showToast({ title: '请先输入菜品名称', icon: 'none' })
    return
  }
  aiModal.value?.open(name)
}

const hasManualContent = () =>
  editForm.value.ingredients.some((item) => item.name.trim() || item.amount.trim()) ||
  editForm.value.steps.some((item) => item.trim())

const applyAiRecipe = (payload: { ingredients: Array<{ name: string; amount: string }>; steps: string[] }) => {
  if (payload.ingredients.length) {
    editForm.value.ingredients = payload.ingredients.map((item) => ({ ...item }))
  }
  if (payload.steps.length) {
    editForm.value.steps = [...payload.steps]
  }
  uni.showToast({ title: '已填充', icon: 'success' })
}

const onAiFill = (payload: { ingredients: Array<{ name: string; amount: string }>; steps: string[] }) => {
  // 已经有用料/步骤时先确认，避免直接抹掉原有内容
  if (!hasManualContent()) {
    applyAiRecipe(payload)
    return
  }
  uni.showModal({
    title: '覆盖已填写内容？',
    content: '填充会替换当前的用料和烹饪步骤',
    confirmText: '覆盖',
    success: (res) => {
      if (res.confirm) applyAiRecipe(payload)
    }
  })
}

const saveDish = async () => {
  if (saving.value) return
  if (!editForm.value.name.trim()) {
    uni.showToast({ title: '请输入菜品名称', icon: 'none' })
    return
  }

  saving.value = true
  try {
    const validIngredients = editForm.value.ingredients.filter(i => i.name.trim() || i.amount.trim())
    const validSteps = editForm.value.steps.filter(s => s.trim())
    const payload: Partial<FoodieDish> = {
      name: editForm.value.name.trim(),
      calories: editForm.value.calories ? Number(editForm.value.calories) : undefined,
      cookingTime: editForm.value.time || undefined,
      ingredients: validIngredients.length ? validIngredients : undefined,
      steps: validSteps.length ? validSteps : undefined,
      image: editForm.value.image || undefined,
      categoryId: editForm.value.categoryId ?? undefined,
    }

    if (!currentUser.value) {
      uni.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    const updated = await updateDish(dishId.value, currentUser.value.id, payload)
    dish.value = mapDish(updated)
    editing.value = false
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (err: any) {
    uni.showToast({ title: err.message || '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}
// --- End edit mode ---

const mapDish = (item: FoodieDish): Dish => ({
  name: item.name,
  calories: item.calories ? String(item.calories) : '--',
  time: item.cookingTime || '未知',
  ingredients: item.ingredients || [],
  steps: item.steps?.length ? item.steps : (item.description ? [item.description] : []),
  bgColor: item.bgColor,
  image: item.image,
  categoryId: item.categoryId
})

const loadDish = async (id: number) => {
  try {
    const user = await getCurrentUser()
    currentUser.value = user
    dishId.value = id
    dish.value = mapDish(await getDish(id, user.id))
  } catch (err: any) {
    uni.showToast({ title: err.message || '菜品加载失败', icon: 'none' })
  }
}

const loadExpiryItem = async (id: number) => {
  try {
    foodId.value = id
    const item = await getExpiryItem(id)
    food.value = {
      name: item.name,
      expiryDate: item.expiryDate,
      daysText: item.daysText,
      daysCount: String(Math.abs(item.daysRemaining)),
      status: item.status,
      statusText: item.statusText,
      bgColor: item.bgColor || getRandomBgColor(),
      category: item.category ? CATEGORY_LABELS[item.category] || '未分类' : '未分类',
      spec: `${item.quantity} 件`,
      storage: item.storage ? STORAGE_LABELS[item.storage] || STORAGE_LABEL_DEFAULT : STORAGE_LABEL_DEFAULT,
      remindText: item.remindDays > 0 ? `提前 ${item.remindDays} 天提醒` : '到期当天提醒',
      notes: item.notes || ''
    }
  } catch (err: any) {
    uni.showToast({ title: err.message || '物品加载失败', icon: 'none' })
  }
}

onLoad((options: any) => {
  readonly.value = options?.readonly === '1'
  if (options?.mode === 'expiry' && options?.id) {
    loadExpiryItem(Number(options.id))
    return
  }
  if (options?.id) {
    loadDish(Number(options.id))
    return
  }
  if (options && (options.mode === 'expiry' || options.expiryDate)) {
    food.value = {
      name: decodeURIComponent(options.name) || '',
      expiryDate: decodeURIComponent(options.expiryDate) || '',
      daysText: decodeURIComponent(options.daysText) || '',
      daysCount: options.daysCount ? decodeURIComponent(options.daysCount) : '',
      status: (decodeURIComponent(options.status) || 'fresh') as any,
      statusText: decodeURIComponent(options.statusText) || '',
      bgColor: options.bgColor ? decodeURIComponent(options.bgColor) : getRandomBgColor(),
      category: options.category ? decodeURIComponent(options.category) : '未分类',
      spec: options.spec ? decodeURIComponent(options.spec) : '',
      storage: options.storage ? decodeURIComponent(options.storage) : STORAGE_LABEL_DEFAULT,
      remindText: options.remindText ? decodeURIComponent(options.remindText) : '',
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
  if (status === 'fresh') return '还在有效期内，暂时不用着急。'
  if (status === 'expiring') return '即将到期，建议优先处理。'
  return '已过期，建议及时处理或丢弃。'
}

const goBack = () => {
  uni.navigateBack()
}

const shareDish = () => {
  uni.showToast({ title: '更多功能', icon: 'none' })
}

const handleDeleteDish = () => {
  if (!dishId.value) return
  if (!currentUser.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这道菜吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteDish(dishId.value, currentUser.value!.id)
          uni.showToast({ title: '已删除', icon: 'success' })
          setTimeout(() => {
            uni.navigateBack()
          }, 1000)
        } catch (err: any) {
          uni.showToast({ title: err.message || '删除失败', icon: 'none' })
        }
      }
    }
  })
}

const editFood = () => {
  if (!foodId.value) return
  uni.navigateTo({
    url: `/pages/add-food/index?id=${foodId.value}`
  })
}

const deleteFood = () => {
  if (!foodId.value) return
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个物品记录吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await removeExpiryItem(foodId.value)
          uni.showToast({ title: '已删除', icon: 'success' })
          setTimeout(() => {
            uni.navigateBack()
          }, 1000)
        } catch (err: any) {
          uni.showToast({ title: err.message || '删除失败', icon: 'none' })
        }
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
  background: var(--theme-bg);
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
  border-bottom: 1px solid var(--theme-primary-light);
  box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.05);
}

.back-btn,
.share-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  transition: background-color 0.2s;
}

.back-btn:active,
.share-btn:active {
  background: var(--theme-primary-lighter);
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
  /* Editorial shadow per design - 0 4px 20px -2px rgba(var(--theme-primary-rgb), 0.2) */
  box-shadow: 0 4px 20px -2px var(--theme-primary-light);
}

.hero-image {
  width: 100%;
  height: 240px;
  overflow: hidden;
  position: relative;
}

.hero-bg-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.hero-fallback-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* Gradient overlay rule: from-primary/30 to-primary/10 mix-blend-overlay */
.hero-gradient-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom right, rgba(var(--theme-primary-rgb), 0.55), rgba(var(--theme-primary-rgb), 0.25));
  z-index: 5;
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
  box-shadow: 0 4px 12px -2px var(--theme-primary-light);
}

.category-badge text {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--theme-primary);
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
  background: var(--theme-primary-light);
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
  border: 1px solid var(--theme-primary-lighter);
  box-shadow: 0 4px 20px -2px rgba(var(--theme-primary-rgb), 0.15);
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
  background: var(--theme-gradient-end);
  color: #653a43;
}

.urgency-badge.expired {
  background: var(--theme-primary-light);
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
  border: 1px solid var(--theme-primary-lighter);
  box-shadow: 0 4px 20px -2px var(--theme-primary-lighter);
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
  background: var(--theme-bg-card);
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
  border: 1px solid var(--theme-primary-lighter);
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
  background: var(--theme-primary);
  color: #321018;
  box-shadow: 0 4px 12px rgba(var(--theme-primary-rgb), 0.3);
}

.danger-btn {
  background: var(--theme-bg);
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

.dish-name-section {
  padding: 16px 16px 0;
}

.dish-name-section .dish-name {
  font-size: 24px;
  font-weight: 700;
  color: #1f1a1b;
}

.info-section,
.ingredients-section,
.steps-section,
.category-section {
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
  background: var(--theme-primary);
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
  background: var(--theme-primary-lighter);
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
  border: 1px solid var(--theme-primary-lighter);
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
  border: 1px solid var(--theme-primary-lighter);
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
  background: var(--theme-primary);
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

/* ========== Edit Mode Styles ========== */
.hero-edit-mask {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.edit-input {
  width: 100%;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid rgba(var(--theme-primary-rgb), 0.3);
  border-radius: 8px;
  font-size: 14px;
  color: #1f1a1b;
}

.name-input {
  font-size: 24px;
  font-weight: 700;
  padding: 12px 16px;
}

.ai-search-btn {
  margin-top: 12px;
  height: 44px;
  background: var(--theme-primary);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.ai-search-btn.disabled {
  background: #eee;
  color: #bbb;
}

.category-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  background: white;
  border: 1px solid var(--theme-primary-light);
}

.tag.active {
  background: var(--theme-primary);
  color: white;
}

.category-empty {
  font-size: 12px;
  color: #777;
}

.edit-input-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}

.edit-input-wrap .edit-input {
  flex: 1;
  text-align: center;
}

.edit-suffix {
  font-size: 12px;
  color: #9ca3af;
  white-space: nowrap;
}

.add-ing-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(var(--theme-primary-rgb), 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
}

.ing-name-input {
  flex: 2;
}

.ing-amount-input {
  flex: 1;
  text-align: right;
}

.ing-del-btn {
  flex-shrink: 0;
  padding: 4px;
}

.step-edit-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.edit-textarea {
  flex: 1;
  min-height: 60px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid rgba(var(--theme-primary-rgb), 0.3);
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  color: #1f1a1b;
}

.step-del-btn {
  flex-shrink: 0;
  padding: 4px;
  margin-top: 4px;
}

/* Bottom Bar - Edit / Save */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 12px;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid rgba(var(--theme-primary-rgb), 0.15);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.edit-btn,
.save-btn,
.cancel-btn,
.delete-btn-bar {
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.edit-btn {
  flex: 2;
  background: var(--theme-primary);
  color: #321018;
  box-shadow: 0 4px 12px rgba(var(--theme-primary-rgb), 0.3);
}

.delete-btn-bar {
  flex: 1;
  background: var(--theme-bg);
  color: #ba1a1a;
  border: 1px solid rgba(186, 26, 26, 0.2);
}

.cancel-btn {
  flex: 1;
  background: var(--theme-bg);
  color: #777;
  border: 1px solid rgba(var(--theme-primary-rgb), 0.2);
}

.save-btn {
  flex: 2;
  background: var(--theme-primary);
  color: #fff;
  box-shadow: 0 4px 12px rgba(var(--theme-primary-rgb), 0.3);
}

.edit-btn:active,
.save-btn:active,
.cancel-btn:active,
.delete-btn-bar:active {
  transform: scale(0.98);
}

</style>
