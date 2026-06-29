<template>
  <view class="container">
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
          <uni-icons type="camera-filled" size="40" color="#ffc2cc" />
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
      </view>

      <!-- Ingredients Section -->
      <view class="ingredients-section">
        <view class="section-header">
          <text class="section-title">用料</text>
          <view class="adjust-btn">
            <uni-icons type="gear" size="14" color="#ffc2cc" />
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
              <uni-icons type="image" size="24" color="#ffc2cc" />
              <text>添加步骤图</text>
            </view>
          </view>
        </view>
        <view class="add-step-btn" @click="addStep">
          <uni-icons type="plus-filled" size="20" color="#333" />
          <text>添加下一步</text>
        </view>
      </view>

      <!-- Categories / Tags -->
      <view class="tags-section">
        <text class="section-title">分类标签</text>
        <view class="tags-list">
          <view
            v-for="(tag, index) in tags"
            :key="index"
            class="tag"
            :class="{ active: tag.active }"
            @click="toggleTag(index)"
          >
            <text>{{ tag.name }}</text>
          </view>
          <view class="add-tag-btn" @click="addTag()">
            <uni-icons type="plus" size="16" color="#ffc2cc" />
          </view>
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
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue'
import { createDish } from '@/services/foodieBuddy'
import { uploadToOSS } from '@/services/oss'

const recipeName = ref('')
const coverImage = ref('')
const publishing = ref(false)

interface Ingredient {
  name: string
  amount: string
}

interface Step {
  text: string
}

interface Tag {
  name: string
  active: boolean
}

const ingredients = ref<Ingredient[]>([
  { name: '', amount: '' },
  { name: '', amount: '' }
])

const steps = ref<Step[]>([
  { text: '' }
])

const tags = ref<Tag[]>([
  { name: '早餐', active: true },
  { name: '午餐', active: false },
  { name: '晚餐', active: false },
  { name: '健康轻食', active: false },
  { name: '甜点', active: false },
  { name: '新手必做', active: false }
])

const goBack = () => {
  uni.navigateBack()
}

const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    success: async (res) => {
      try {
        uni.showLoading({ title: '上传中...' })
        coverImage.value = await uploadToOSS(res.tempFilePaths[0], 'dishes')
        uni.showToast({ title: '封面图上传成功', icon: 'success' })
      } catch (err: any) {
        uni.showToast({ title: err.message || '上传失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
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

const addStepImage = (index: number) => {
  uni.chooseImage({
    count: 1,
    success: async (res) => {
      try {
        uni.showLoading({ title: '上传中...' })
        await uploadToOSS(res.tempFilePaths[0], 'dishes/steps')
        uni.showToast({ title: '步骤图片上传成功', icon: 'success' })
      } catch (err: any) {
        uni.showToast({ title: err.message || '上传失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
  })
}

const toggleTag = (index: number) => {
  tags.value[index].active = !tags.value[index].active
}

const addTag = () => {
  uni.showToast({ title: '添加标签功能开发中', icon: 'none' })
}

const saveDraft = () => {
  uni.showToast({ title: '草稿已保存', icon: 'success' })
}

const getActiveTags = () => tags.value.filter((tag) => tag.active).map((tag) => tag.name)

const getCategory = (activeTags: string[]) => {
  if (activeTags.includes('健康轻食')) return '凉菜'
  if (activeTags.includes('甜点')) return '饮品'
  return '主食'
}

const buildDescription = (validIngredients: Ingredient[], validSteps: Step[]) => {
  const ingredientText = validIngredients.map((item) => `${item.name} ${item.amount}`.trim()).join('、')
  const stepText = validSteps.map((item, index) => `${index + 1}. ${item.text}`).join('\n')
  return [ingredientText ? `用料：${ingredientText}` : '', stepText ? `步骤：\n${stepText}` : '']
    .filter(Boolean)
    .join('\n')
}

const publishRecipe = async () => {
  if (publishing.value) return
  const name = recipeName.value.trim()
  if (!name) {
    uni.showToast({ title: '请输入菜谱名称', icon: 'none' })
    return
  }

  const validIngredients = ingredients.value.filter((item) => item.name.trim() || item.amount.trim())
  const validSteps = steps.value.filter((item) => item.text.trim())
  const activeTags = getActiveTags()

  publishing.value = true
  try {
    await createDish({
      name,
      description: buildDescription(validIngredients, validSteps),
      category: getCategory(activeTags),
      image: coverImage.value,
      status: 1,
      cookingTime: validSteps.length ? `${validSteps.length * 5} 分钟` : undefined,
      ingredients: validIngredients.map((item) => ({
        name: item.name.trim(),
        amount: item.amount.trim()
      })),
      steps: validSteps.map((item) => item.text.trim()),
      tags: activeTags,
      bgColor: '#f0b7a4'
    })
    uni.showToast({ title: '菜谱发布成功', icon: 'success' })
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
  background: rgba(255, 194, 204, 0.1);
  border-radius: 12px;
  border: 2px dashed rgba(255, 194, 204, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.upload-text {
  font-size: 14px;
  font-weight: 500;
  color: #ffc2cc;
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

.ingredients-section, .steps-section, .tags-section {
  padding: 16px;
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
  color: #ffc2cc;
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
  background: rgba(255, 194, 204, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
}

.add-step-btn {
  border: 2px dashed rgba(255, 194, 204, 0.4);
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
  background: #ffc2cc;
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
  background: rgba(255, 194, 204, 0.1);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.step-image text:last-child {
  font-size: 10px;
  color: #ffc2cc;
}

.tags-list {
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
  border: 1px solid rgba(255, 194, 204, 0.2);
}

.tag.active {
  background: #ffc2cc;
  color: white;
}

.add-tag-btn {
  padding: 8px;
  background: rgba(255, 194, 204, 0.1);
  border-radius: 50%;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: rgba(248, 245, 246, 0.95);
  border-top: 1px solid rgba(255, 194, 204, 0.1);
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
  border: 1px solid rgba(255, 194, 204, 0.3);
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
  background: #ffc2cc;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  color: white;
  box-shadow: 0 4px 12px rgba(255, 194, 204, 0.3);
}
</style>
