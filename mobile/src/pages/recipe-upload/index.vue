<template>
  <view class="container" :style="themeStyle">
    <!-- Header -->
    <view class="header">
      <view class="back-btn" @click="goBack">
        <uni-icons type="left" size="24" color="#777" />
      </view>
      <view class="title">
        <text>上传菜谱</text>
      </view>
    </view>

    <scroll-view scroll-y class="content">
      <!-- Photo Upload -->
      <view class="upload-section">
        <view class="upload-area" @click="chooseImage" v-if="!coverImage">
          <uni-icons type="camera-filled" size="40" color="var(--theme-primary)" />
          <text class="upload-text">添加美食封面图</text>
          <text class="upload-hint">美食的照片越好看，人气越高哦</text>
        </view>
        <view class="cover-preview" v-else @click="chooseImage">
          <image class="cover-image" :src="coverImage" mode="aspectFill" />
          <view class="cover-change-btn">
            <uni-icons type="camera-filled" size="16" color="#fff" />
            <text>更换封面</text>
          </view>
        </view>
      </view>

      <!-- Recipe Name Input -->
      <view class="input-section">
        <label class="input-label">
          <text>菜谱名称</text>
        </label>
        <input
          v-model="recipeName"
          class="recipe-input"
          placeholder="起个响亮的名字，如：秘制红烧肉"
        />
        <view class="ai-search-btn" :class="{ disabled: !recipeName.trim() }" @click="openAiSearch">
          <uni-icons type="search" size="16" :color="recipeName.trim() ? '#fff' : '#bbb'" />
          <text>搜索用料和步骤</text>
        </view>
      </view>

      <!-- Ingredients Section -->
      <view class="ingredients-section">
        <view class="section-header">
          <text class="section-title">用料</text>
          <view class="adjust-btn">
            <uni-icons type="gear" size="14" color="var(--theme-primary)" />
            <text>调整比例</text>
          </view>
        </view>
        <view class="ingredients-list">
          <view v-for="(ing, index) in ingredients" :key="index" class="ingredient-row">
            <input
              v-model="ing.name"
              class="ingredient-input"
              placeholder="食材：如 五花肉"
            />
            <input
              v-model="ing.amount"
              class="amount-input"
              placeholder="用量：如 500g"
            />
          </view>
        </view>
        <view class="add-btn" @click="addIngredient">
          <uni-icons type="plus" size="20" color="#333" />
          <text>再添加一行食材</text>
        </view>
      </view>

      <!-- Steps Section -->
      <view class="steps-section">
        <text class="section-title">烹饪步骤</text>
        <view class="steps-list">
          <view v-for="(step, index) in steps" :key="index" class="step-card">
            <view class="step-header">
              <view class="step-number">{{ index + 1 }}</view>
              <view class="delete-btn" @click="removeStep(index)">
                <uni-icons type="trash" size="20" color="#999" />
              </view>
            </view>
            <textarea
              v-model="step.text"
              class="step-textarea"
              placeholder="第一步：将五花肉洗净切块..."
            />
            <view class="step-image" @click="addStepImage(index)">
              <uni-icons type="image" size="24" color="var(--theme-primary)" />
              <text>添加步骤图</text>
            </view>
          </view>
        </view>
        <view class="add-step-btn" @click="addStep">
          <uni-icons type="plus-filled" size="20" color="#333" />
          <text>添加下一步</text>
        </view>
      </view>

      <!-- Dish Category (required) -->
      <view class="category-section" v-if="categoriesLoaded">
        <text class="section-title">菜品分类</text>
        <view class="category-list">
          <view
            v-for="cat in categories"
            :key="cat.id"
            class="tag"
            :class="{ active: selectedCategoryId === cat.id }"
            @click="selectedCategoryId = cat.id"
          >
            <text>{{ cat.name }}</text>
          </view>
          <view v-if="categories.length === 0" class="category-empty">
            <text>暂无可选分类，请联系管理员配置</text>
          </view>
        </view>
      </view>

      <!-- Dining Group Selector -->
      <view class="group-section" v-if="groupsLoaded">
        <text class="section-title">分享到饭搭子</text>
        <picker
          v-if="groups.length > 0"
          mode="selector"
          :range="groupNames"
          :value="selectedGroupIndex"
          @change="onGroupChange"
        >
          <view class="group-picker">
            <text>{{ groupNames[selectedGroupIndex] }}</text>
            <uni-icons type="arrowdown" size="14" color="#777" />
          </view>
        </picker>
        <view v-else class="group-empty">
          <text>暂无饭搭子组，创建或加入后才能发布菜谱</text>
        </view>
      </view>

      <!-- Spacer for fixed button -->
      <view style="height: 100px;"></view>
    </scroll-view>

    <!-- Bottom Publish Button -->
    <view class="bottom-bar">
      <view class="publish-buttons">
        <view class="draft-btn" @click="saveDraft">
          <text>存草稿</text>
        </view>
        <view class="publish-btn" @click="publishRecipe">
          <text>发布菜谱</text>
        </view>
      </view>
    </view>

    <PrivacyModal ref="privacyModal" />
    <AiRecipeModal ref="aiModal" @fill="onAiFill" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue'
import PrivacyModal from '@/components/PrivacyModal.vue'
import AiRecipeModal from '@/components/AiRecipeModal.vue'
import { estimateCalories } from '@/services/aiRecipe'
import {
  createDish,
  getCurrentUser,
  getDishCategories,
  getMyDiningGroups,
  type DiningGroup,
  type DishCategory,
  type FoodieUser
} from '@/services/foodieBuddy'
import { uploadToOSS } from '@/services/oss'
import { themeStyle } from '@/utils/theme'

const DRAFT_STORAGE_KEY = 'recipe-upload-draft'

const recipeName = ref('')
const coverImage = ref('')
const publishing = ref(false)
const privacyModal = ref<InstanceType<typeof PrivacyModal>>()
const aiModal = ref<InstanceType<typeof AiRecipeModal>>()

const currentUser = ref<FoodieUser | null>(null)
const groups = ref<DiningGroup[]>([])
const groupsLoaded = ref(false)
const selectedGroupIndex = ref(0)

const categories = ref<DishCategory[]>([])
const categoriesLoaded = ref(false)
const selectedCategoryId = ref<number | null>(null)

const loadCategories = async () => {
  try {
    categories.value = await getDishCategories()
  } catch (err: any) {
    uni.showToast({ title: err.message || '加载菜品分类失败', icon: 'none' })
  } finally {
    categoriesLoaded.value = true
  }
}

const groupNames = computed(() =>
  groups.value.map((g) => g.name || `饭搭子 ${g.id}`)
)

const loadUserAndGroups = async () => {
  try {
    const user = await getCurrentUser()
    currentUser.value = user
    const myGroups = await getMyDiningGroups(user.id)
    groups.value = myGroups
    selectedGroupIndex.value = 0
  } catch (err: any) {
    uni.showToast({ title: err.message || '加载饭搭子组失败', icon: 'none' })
  } finally {
    groupsLoaded.value = true
  }
}

onMounted(() => {
  loadUserAndGroups()
  loadCategories()
  restoreDraft()
})

const onGroupChange = (e: { detail: { value: number } }) => {
  selectedGroupIndex.value = e.detail.value
}

interface Ingredient {
  name: string
  amount: string
}

interface Step {
  text: string
}

const ingredients = ref<Ingredient[]>([
  { name: '', amount: '' },
  { name: '', amount: '' }
])

const steps = ref<Step[]>([
  { text: '' }
])

const goBack = () => {
  uni.navigateBack()
}

const chooseImage = async () => {
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
        coverImage.value = await uploadToOSS(tempFilePath, 'dishes')
        uni.showToast({ title: '封面图上传成功', icon: 'success' })
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

const addIngredient = () => {
  ingredients.value.push({ name: '', amount: '' })
}

const addStep = () => {
  steps.value.push({ text: '' })
}

const removeStep = (index: number) => {
  if (steps.value.length > 1) {
    steps.value.splice(index, 1)
  }
}

const openAiSearch = () => {
  const name = recipeName.value.trim()
  if (!name) {
    uni.showToast({ title: '请先输入菜谱名称', icon: 'none' })
    return
  }
  aiModal.value?.open(name)
}

const hasManualContent = () =>
  ingredients.value.some((item) => item.name.trim() || item.amount.trim()) ||
  steps.value.some((item) => item.text.trim())

const applyAiRecipe = (payload: { ingredients: Ingredient[]; steps: string[] }) => {
  if (payload.ingredients.length) {
    ingredients.value = payload.ingredients.map((item) => ({
      name: item.name,
      amount: item.amount
    }))
  }
  if (payload.steps.length) {
    steps.value = payload.steps.map((text) => ({ text }))
  }
  uni.showToast({ title: '已填充', icon: 'success' })
}

const onAiFill = (payload: { ingredients: Ingredient[]; steps: string[] }) => {
  // 已经手填过内容时先确认，避免直接抹掉用户写的东西
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

const addStepImage = async (index: number) => {
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
        await uploadToOSS(tempFilePath, 'dishes/steps')
        uni.showToast({ title: '步骤图片上传成功', icon: 'success' })
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

const saveDraft = () => {
  const draft = {
    recipeName: recipeName.value,
    coverImage: coverImage.value,
    ingredients: ingredients.value,
    steps: steps.value,
    categoryId: selectedCategoryId.value,
    savedAt: Date.now()
  }
  try {
    uni.setStorageSync(DRAFT_STORAGE_KEY, draft)
    uni.showToast({ title: '草稿已保存', icon: 'success' })
  } catch (err: any) {
    uni.showToast({ title: err.message || '草稿保存失败', icon: 'none' })
  }
}

const restoreDraft = () => {
  try {
    const draft = uni.getStorageSync(DRAFT_STORAGE_KEY)
    if (!draft) return
    if (typeof draft.recipeName === 'string') recipeName.value = draft.recipeName
    if (typeof draft.coverImage === 'string') coverImage.value = draft.coverImage
    if (Array.isArray(draft.ingredients) && draft.ingredients.length) ingredients.value = draft.ingredients
    if (Array.isArray(draft.steps) && draft.steps.length) steps.value = draft.steps
    if (typeof draft.categoryId === 'number') selectedCategoryId.value = draft.categoryId
    uni.showToast({ title: '已恢复上次草稿', icon: 'none' })
  } catch (err) {
    console.error('restoreDraft fail', err)
  }
}

const buildDescription = (validIngredients: Ingredient[], validSteps: Step[]) => {
  const ingredientText = validIngredients.map((item) => `${item.name} ${item.amount}`.trim()).join('、')
  const stepText = validSteps.map((item, index) => `${index + 1}. ${item.text}`).join('\n')
  return [ingredientText ? `用料：${ingredientText}` : '', stepText ? `步骤：\n${stepText}` : '']
    .filter(Boolean)
    .join('\n')
}

/**
 * 发布前根据用料估算每人份能量。
 * 估算失败不阻断发布：能量只是附加信息，用户还能在菜品详情页手动改。
 */
const resolveCalories = async (name: string, validIngredients: Ingredient[]) => {
  if (!validIngredients.length) return undefined
  try {
    uni.showLoading({ title: '正在估算能量...' })
    const { calories } = await estimateCalories(
      name,
      validIngredients.map((item) => ({ name: item.name.trim(), amount: item.amount.trim() }))
    )
    return calories > 0 ? calories : undefined
  } catch (err) {
    console.error('estimateCalories fail', err)
    return undefined
  } finally {
    uni.hideLoading()
  }
}

const publishRecipe = async () => {
  if (publishing.value) return
  const name = recipeName.value.trim()
  if (!name) {
    uni.showToast({ title: '请输入菜谱名称', icon: 'none' })
    return
  }

  if (!currentUser.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }

  if (!selectedCategoryId.value) {
    uni.showToast({ title: '请选择菜品分类', icon: 'none' })
    return
  }

  if (groups.value.length === 0) {
    uni.showToast({ title: '请先创建或加入饭搭子组', icon: 'none' })
    return
  }

  const validIngredients = ingredients.value.filter((item) => item.name.trim() || item.amount.trim())
  const validSteps = steps.value.filter((item) => item.text.trim())
  const group = groups.value[selectedGroupIndex.value]

  publishing.value = true
  try {
    const calories = await resolveCalories(name, validIngredients)
    await createDish({
      name,
      description: buildDescription(validIngredients, validSteps),
      categoryId: selectedCategoryId.value,
      image: coverImage.value,
      status: 1,
      calories,
      cookingTime: validSteps.length ? `${validSteps.length * 5} 分钟` : undefined,
      ingredients: validIngredients.map((item) => ({
        name: item.name.trim(),
        amount: item.amount.trim()
      })),
      steps: validSteps.map((item) => item.text.trim()),
      bgColor: '#f0b7a4',
      userId: currentUser.value.id,
      groupId: group.id
    })
    uni.showToast({ title: '菜谱发布成功', icon: 'success' })
    uni.removeStorageSync(DRAFT_STORAGE_KEY)
    setTimeout(() => uni.navigateBack(), 800)
  } catch (err: any) {
    uni.showToast({ title: err.message || '发布失败', icon: 'none' })
  } finally {
    publishing.value = false
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
  padding: 16px;
  padding-top: calc(16px + var(--status-bar-height));
  background: rgba(248, 245, 246, 0.8);
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid var(--theme-primary-light);
}

.back-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
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
  padding-bottom: 120px;
}

.upload-section {
  padding: 16px;
}

.upload-area {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: var(--theme-primary-lighter);
  border-radius: 12px;
  border: 2px dashed rgba(var(--theme-primary-rgb), 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.upload-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--theme-primary);
}

.upload-hint {
  font-size: 12px;
  color: #777;
}

.cover-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
}

.cover-change-btn {
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 999px;
  font-size: 12px;
  color: #fff;
}

.input-section {
  padding: 8px 16px;
}

.input-label {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label text {
  font-size: 16px;
  font-weight: 600;
  color: #111;
}

.recipe-input {
  width: 100%;
  height: 56px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  font-size: 16px;
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

.ingredients-section, .steps-section, .category-section, .group-section {
  padding: 16px;
}

.group-picker {
  margin-top: 12px;
  height: 48px;
  background: white;
  border-radius: 12px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  color: #111;
}

.group-empty {
  margin-top: 12px;
  padding: 16px;
  background: rgba(186, 26, 26, 0.05);
  border-radius: 12px;
  font-size: 14px;
  color: #ba1a1a;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #111;
}

.adjust-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--theme-primary);
  font-weight: 600;
}

.ingredients-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ingredient-row {
  display: flex;
  gap: 8px;
}

.ingredient-input {
  flex: 2;
  height: 48px;
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 14px;
}

.amount-input {
  flex: 1;
  height: 48px;
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 14px;
  text-align: right;
}

.add-btn, .add-step-btn {
  margin-top: 16px;
  width: 100%;
  height: 48px;
  background: var(--theme-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
}

.add-step-btn {
  border: 2px dashed rgba(var(--theme-primary-rgb), 0.4);
  background: transparent;
}

.steps-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.step-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  border: 1px solid transparent;
}

.step-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.step-number {
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

.delete-btn {
  color: #999;
}

.step-textarea {
  width: 100%;
  min-height: 80px;
  background: transparent;
  padding: 0;
  font-size: 14px;
  line-height: 1.5;
}

.step-image {
  width: 96px;
  height: 96px;
  background: var(--theme-primary-lighter);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.step-image text:last-child {
  font-size: 10px;
  color: var(--theme-primary);
}

.category-list {
  margin-top: 12px;
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

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: rgba(248, 245, 246, 0.95);
  border-top: 1px solid var(--theme-primary-lighter);
  z-index: 100;
}

.publish-buttons {
  display: flex;
  gap: 12px;
}

.draft-btn {
  flex: 1;
  height: 56px;
  background: white;
  border: 1px solid rgba(var(--theme-primary-rgb), 0.3);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  color: #555;
}

.publish-btn {
  flex: 2;
  height: 56px;
  background: var(--theme-primary);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  color: white;
  box-shadow: 0 4px 12px rgba(var(--theme-primary-rgb), 0.3);
}
</style>
