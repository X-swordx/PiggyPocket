<template>
  <view class="container" :style="themeStyle">
    <!-- Header -->
    <view class="header">
      <view class="back-btn" @click="goBack">
        <uni-icons type="left" size="24" color="#333" />
      </view>
      <view class="title">
        <text>灵感菜谱</text>
      </view>
      <view class="header-placeholder"></view>
    </view>

    <!-- ============ 条件填写 ============ -->
    <scroll-view v-if="viewMode === 'form'" scroll-y class="content">
      <view class="hint-card">
        <uni-icons type="staff" size="20" color="var(--theme-primary)" />
        <text class="hint-text">选上手头现有的食材，告诉我口味和人数，帮你想今晚做什么菜</text>
      </view>

      <!-- 食材 -->
      <view class="section">
        <text class="section-title">手头食材<text class="required">*</text></text>
        <view class="chip-wrap">
          <view
            v-for="name in ingredientOptions"
            :key="name"
            class="chip"
            :class="{ active: selectedIngredients.includes(name) }"
            @click="toggleInList(selectedIngredients, name)"
          >
            <text>{{ name }}</text>
          </view>
        </view>
        <view class="custom-row">
          <input
            v-model="customIngredientInput"
            class="custom-input"
            placeholder="没有的食材？手动输入"
            confirm-type="done"
            @confirm="addCustomIngredient"
          />
          <view class="custom-add" @click="addCustomIngredient">
            <uni-icons type="plus" size="16" color="#333" />
            <text>添加</text>
          </view>
        </view>
      </view>

      <!-- 用餐人数 -->
      <view class="section">
        <text class="section-title">用餐人数</text>
        <view class="stepper">
          <view class="step-btn" :class="{ disabled: people <= 1 }" @click="changePeople(-1)">
            <uni-icons type="minus" size="18" color="#333" />
          </view>
          <text class="step-value">{{ people }} 人</text>
          <view class="step-btn" :class="{ disabled: people >= 20 }" @click="changePeople(1)">
            <uni-icons type="plus" size="18" color="#333" />
          </view>
        </view>
      </view>

      <!-- 辣度 -->
      <view class="section">
        <text class="section-title">辣度</text>
        <view class="chip-wrap">
          <view
            v-for="name in options.spicy"
            :key="name"
            class="chip"
            :class="{ active: selectedSpicy === name }"
            @click="selectedSpicy = selectedSpicy === name ? '' : name"
          >
            <text>{{ name }}</text>
          </view>
        </view>
      </view>

      <!-- 口味偏好 -->
      <view class="section">
        <text class="section-title">口味偏好</text>
        <view class="chip-wrap">
          <view
            v-for="name in preferenceOptions"
            :key="name"
            class="chip"
            :class="{ active: selectedPreferences.includes(name) }"
            @click="toggleInList(selectedPreferences, name)"
          >
            <text>{{ name }}</text>
          </view>
        </view>
        <view class="custom-row">
          <input
            v-model="customPreferenceInput"
            class="custom-input"
            placeholder="自定义偏好，如：给老人吃"
            confirm-type="done"
            @confirm="addCustomPreference"
          />
          <view class="custom-add" @click="addCustomPreference">
            <uni-icons type="plus" size="16" color="#333" />
            <text>添加</text>
          </view>
        </view>
      </view>

      <!-- 忌口 -->
      <view class="section">
        <text class="section-title">忌口</text>
        <view class="chip-wrap">
          <view
            v-for="name in tabooOptions"
            :key="name"
            class="chip"
            :class="{ active: selectedTaboos.includes(name) }"
            @click="toggleInList(selectedTaboos, name)"
          >
            <text>{{ name }}</text>
          </view>
        </view>
        <view class="custom-row">
          <input
            v-model="customTabooInput"
            class="custom-input"
            placeholder="自定义忌口，如：花生过敏"
            confirm-type="done"
            @confirm="addCustomTaboo"
          />
          <view class="custom-add" @click="addCustomTaboo">
            <uni-icons type="plus" size="16" color="#333" />
            <text>添加</text>
          </view>
        </view>
      </view>

      <!-- 备注 -->
      <view class="section">
        <text class="section-title">备注</text>
        <textarea
          v-model="notes"
          class="notes-input"
          placeholder="其他想说的，如：想做简单点的、家里有烤箱（选填）"
          maxlength="200"
        />
      </view>

      <view style="height: 140px;"></view>
    </scroll-view>

    <!-- ============ 推荐结果（流式逐张出现） ============ -->
    <scroll-view v-else scroll-y class="content">
      <view class="result-head">
        <text class="result-title">
          {{ generating ? '正在为你配菜…' : `为你推荐 ${dishes.filter((d) => d.name).length} 道菜` }}
        </text>
        <view class="regenerate-btn" :class="{ disabled: generating }" @click="generate">
          <uni-icons type="refresh" size="14" color="#333" />
          <text>{{ generating ? '生成中' : '换一批' }}</text>
        </view>
      </view>

      <view class="dish-list">
        <template v-for="(dish, index) in dishes" :key="index">
          <view
            v-if="dish.name"
            class="dish-card"
            :class="{ selected: chosenIndexs.includes(index) }"
          >
            <view class="dish-main" @click="!generating && toggleDish(index)">
              <view class="dish-check" :class="{ checked: chosenIndexs.includes(index) }">
                <uni-icons
                  v-if="chosenIndexs.includes(index)"
                  type="checkmarkempty"
                  size="16"
                  color="#fff"
                />
              </view>
              <view class="dish-text">
                <text class="dish-name">{{ dish.name }}</text>
                <text v-if="dish.reason" class="dish-reason">{{ dish.reason }}</text>
                <text v-if="dish.cookingTime" class="dish-time">约 {{ dish.cookingTime }}</text>
              </view>
            </view>
            <view class="dish-detail-toggle" @click="toggleExpand(index)">
              <text>{{ isExpanded(index) ? '收起做法' : '看用料和做法' }}</text>
              <uni-icons
                :type="isExpanded(index) ? 'up' : 'down'"
                size="14"
                color="#777"
              />
            </view>
            <view v-if="isExpanded(index)" class="dish-detail">
              <view v-if="dish.ingredients?.length" class="detail-block">
                <text class="detail-label">用料（{{ people }} 人份）</text>
                <view class="ingredient-grid">
                  <text v-for="(ing, i) in dish.ingredients" :key="i" class="ingredient-item">
                    {{ ing.name }} {{ ing.amount }}
                  </text>
                </view>
              </view>
              <view v-if="dish.steps?.length" class="detail-block">
                <text class="detail-label">步骤</text>
                <view v-for="(step, i) in dish.steps" :key="i" class="step-row">
                  <text class="step-no">{{ i + 1 }}</text>
                  <text class="step-content">{{ step }}</text>
                </view>
              </view>
            </view>
          </view>
        </template>

        <view v-if="generating" class="streaming-tip">
          <uni-icons type="spinner-cycle" size="18" color="var(--theme-primary)" />
          <text class="streaming-text">{{ streamTipText }}</text>
        </view>
      </view>

      <view v-if="!generating" class="back-form-btn" @click="viewMode = 'form'">
        <uni-icons type="compose" size="14" color="#777" />
        <text>调整食材和口味</text>
      </view>

      <view style="height: 180px;"></view>
    </scroll-view>

    <!-- ============ 底部操作 ============ -->
    <view class="bottom-bar">
      <template v-if="viewMode === 'form'">
        <view class="primary-bar-btn" :class="{ disabled: generating }" @click="generate">
          <uni-icons type="fire-filled" size="18" color="#111" />
          <text>生成推荐菜</text>
        </view>
      </template>
      <template v-else-if="generating">
        <view class="cancel-bar-btn" @click="cancelGenerate">
          <uni-icons type="closeempty" size="18" color="#777" />
          <text>取消生成</text>
        </view>
      </template>
      <template v-else>
        <picker
          mode="selector"
          :range="groupNames"
          :value="selectedGroupIndex"
          @change="onGroupChange"
        >
          <view class="group-picker">
            <uni-icons type="staff" size="16" color="#fff" />
            <text class="group-name">{{ groups.length ? groupNames[selectedGroupIndex] : '暂无搭伙组' }}</text>
            <uni-icons type="arrow-down" size="12" color="#fff" />
          </view>
        </picker>
        <view
          class="primary-bar-btn"
          :class="{ disabled: chosenIndexs.length === 0 || saving || !groups.length }"
          @click="save"
        >
          <uni-icons type="checkmarkempty" size="18" color="#111" />
          <text>{{ saving ? '加入中…' : `加入菜谱${chosenIndexs.length ? `（${chosenIndexs.length}）` : ''}` }}</text>
        </view>
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue'
import {
  getRecipeInspirationOptions,
  streamInspiredRecipes,
  saveInspiredDishes,
  type RecipeOptionGroups,
  type InspiredDish,
  type StreamInspirationTask
} from '@/services/recipeInspiration'
import { getCurrentUser, getMyDiningGroups, type DiningGroup } from '@/services/foodieBuddy'
import { themeStyle } from '@/utils/theme'

const viewMode = ref<'form' | 'result'>('form')
const generating = ref(false)
const saving = ref(false)

const options = ref<RecipeOptionGroups>({ ingredient: [], spicy: [], preference: [], taboo: [] })

// 预设选项 + 用户自定义项合并展示
const ingredientOptions = ref<string[]>([])
const preferenceOptions = ref<string[]>([])
const tabooOptions = ref<string[]>([])

const selectedIngredients = ref<string[]>([])
const selectedSpicy = ref('')
const selectedPreferences = ref<string[]>([])
const selectedTaboos = ref<string[]>([])
const customIngredientInput = ref('')
const customPreferenceInput = ref('')
const customTabooInput = ref('')

const people = ref(2)
const notes = ref('')

const dishes = ref<InspiredDish[]>([])
const chosenIndexs = ref<number[]>([])
const expandedIndexs = ref<number[]>([])

const groups = ref<DiningGroup[]>([])
const selectedGroupIndex = ref(0)
const groupNames = ref<string[]>([])

const toggleInList = <T,>(list: T[], value: T) => {
  const index = list.indexOf(value)
  if (index >= 0) list.splice(index, 1)
  else list.push(value)
}

const addCustom = (optionList: string[], selectedList: string[], raw: string) => {
  const name = raw.trim()
  if (!name) return
  if (name.length > 20) {
    uni.showToast({ title: '最多输入 20 个字', icon: 'none' })
    return
  }
  if (!optionList.includes(name)) optionList.push(name)
  if (!selectedList.includes(name)) selectedList.push(name)
}

const addCustomIngredient = () => {
  addCustom(ingredientOptions.value, selectedIngredients.value, customIngredientInput.value)
  customIngredientInput.value = ''
}

const addCustomPreference = () => {
  addCustom(preferenceOptions.value, selectedPreferences.value, customPreferenceInput.value)
  customPreferenceInput.value = ''
}

const addCustomTaboo = () => {
  addCustom(tabooOptions.value, selectedTaboos.value, customTabooInput.value)
  customTabooInput.value = ''
}

const changePeople = (delta: number) => {
  const next = people.value + delta
  if (next >= 1 && next <= 20) people.value = next
}

let streamTask: StreamInspirationTask | null = null

const streamTipText = computed(() => {
  const count = dishes.value.filter((d) => d.name).length
  if (count === 0) return '正在构思菜单，菜马上出锅…'
  const last = dishes.value[count - 1]
  if (last && (!last.ingredients?.length || !last.steps?.length)) return '正在补全用料和做法…'
  return `正在准备第 ${count + 1} 道菜…`
})

const generate = () => {
  if (generating.value) return
  if (selectedIngredients.value.length === 0) {
    uni.showToast({ title: '至少选一种手头食材', icon: 'none' })
    return
  }

  streamTask?.abort()
  generating.value = true
  viewMode.value = 'result'
  dishes.value = []
  chosenIndexs.value = []
  expandedIndexs.value = []

  streamTask = streamInspiredRecipes(
    {
      ingredients: selectedIngredients.value,
      people: people.value,
      spicy: selectedSpicy.value || undefined,
      preferences: selectedPreferences.value,
      taboos: selectedTaboos.value,
      notes: notes.value.trim() || undefined
    },
    {
      onPartial: (list) => {
        dishes.value = list
      },
      onDone: () => {
        generating.value = false
        streamTask = null
        const valid = dishes.value
          .map((d, i) => (d.name ? i : -1))
          .filter((i) => i >= 0)
        if (valid.length === 0) {
          viewMode.value = 'form'
          uni.showToast({ title: '没有生成合适的菜，调整食材再试', icon: 'none' })
          return
        }
        // 默认全选且保持展开，用户可自行取消勾选/折叠
        chosenIndexs.value = valid
        expandedIndexs.value = [...valid]
      },
      onError: (message) => {
        generating.value = false
        streamTask = null
        const valid = dishes.value
          .map((d, i) => (d.name ? i : -1))
          .filter((i) => i >= 0)
        if (valid.length === 0) {
          viewMode.value = 'form'
          uni.showToast({ title: message, icon: 'none' })
          return
        }
        // 已有部分菜生成成功则保留，让用户可以直接加入这几道菜
        chosenIndexs.value = valid
        expandedIndexs.value = [...valid]
        uni.showToast({ title: message, icon: 'none' })
      }
    }
  )
}

const cancelGenerate = () => {
  streamTask?.abort()
  streamTask = null
  generating.value = false
  viewMode.value = 'form'
}

// 生成中全部展开，让用料/步骤逐字补全的过程可见；结束后以 expandedIndexs 为准
const isExpanded = (index: number) =>
  generating.value || expandedIndexs.value.includes(index)

const toggleDish = (index: number) => {
  toggleInList(chosenIndexs.value, index)
}

const toggleExpand = (index: number) => {
  toggleInList(expandedIndexs.value, index)
}

const onGroupChange = (e: any) => {
  selectedGroupIndex.value = Number(e.detail.value)
}

const save = async () => {
  if (saving.value) return
  if (chosenIndexs.value.length === 0) {
    uni.showToast({ title: '请先勾选菜品', icon: 'none' })
    return
  }
  const group = groups.value[selectedGroupIndex.value]
  if (!group) {
    uni.showToast({ title: '还没有搭伙小组，无法加入菜谱', icon: 'none' })
    return
  }

  saving.value = true
  try {
    const user = await getCurrentUser()
    const picked = chosenIndexs.value
      .sort((a, b) => a - b)
      .map((i) => dishes.value[i])
      .map((dish) => ({
        name: dish.name,
        description: dish.description,
        cookingTime: dish.cookingTime,
        ingredients: dish.ingredients,
        steps: dish.steps
      }))
    const result = await saveInspiredDishes({
      userId: user.id,
      groupId: group.id,
      dishes: picked
    })
    uni.showToast({ title: `已加入 ${result.count} 道菜`, icon: 'success' })
    setTimeout(() => uni.navigateBack(), 800)
  } catch (err: any) {
    uni.showToast({ title: err.message || '加入失败，请重试', icon: 'none' })
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  uni.navigateBack()
}

onUnload(() => {
  streamTask?.abort()
})

onLoad(async () => {
  try {
    const [optionGroups, user] = await Promise.all([
      getRecipeInspirationOptions(),
      getCurrentUser()
    ])
    options.value = optionGroups
    ingredientOptions.value = [...optionGroups.ingredient]
    preferenceOptions.value = [...optionGroups.preference]
    tabooOptions.value = [...optionGroups.taboo]

    const myGroups = await getMyDiningGroups(user.id)
    groups.value = myGroups
    groupNames.value = myGroups.map((g) => g.name)
  } catch (err: any) {
    uni.showToast({ title: err.message || '加载失败', icon: 'none' })
  }
})
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

.back-btn,
.header-placeholder {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
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

.hint-card {
  margin: 16px;
  padding: 14px 16px;
  background: var(--theme-primary-lighter);
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.hint-text {
  font-size: 13px;
  color: #555;
  flex: 1;
}

.section {
  padding: 0 16px 16px;
}

.section-title {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #111;
  margin-bottom: 12px;
}

.required {
  color: #d33;
  margin-left: 4px;
}

.chip-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.chip {
  padding: 8px 18px;
  border-radius: 999px;
  background: var(--theme-primary-lighter);
}

.chip text {
  font-size: 14px;
  color: #333;
}

.chip.active {
  background: var(--theme-primary);
}

.custom-row {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.custom-input {
  flex: 1;
  height: 40px;
  padding: 0 14px;
  background: #fff;
  border-radius: 10px;
  font-size: 14px;
  border: 1px solid var(--theme-primary-light);
}

.custom-add {
  height: 40px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: #fff;
  border-radius: 10px;
  font-size: 14px;
  border: 1px solid var(--theme-primary-light);
}

.stepper {
  display: flex;
  align-items: center;
  gap: 20px;
}

.step-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--theme-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-btn.disabled {
  opacity: 0.4;
}

.step-value {
  font-size: 18px;
  font-weight: 700;
  min-width: 56px;
  text-align: center;
}

.notes-input {
  width: 100%;
  height: 90px;
  padding: 12px;
  background: #fff;
  border-radius: 10px;
  font-size: 14px;
  border: 1px solid var(--theme-primary-light);
  box-sizing: border-box;
}

.streaming-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
}

.streaming-text {
  font-size: 14px;
  color: #888;
}

.result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
}

.result-title {
  font-size: 18px;
  font-weight: 700;
  color: #111;
}

.regenerate-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  background: #fff;
  border-radius: 999px;
  border: 1px solid var(--theme-primary-light);
  font-size: 13px;
}

.dish-list {
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dish-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 16px;
  border: 2px solid transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.dish-card.selected {
  border-color: rgba(22, 163, 74, 0.5);
}

.dish-main {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.dish-check {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid #ccc;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}

.dish-check.checked {
  background: #16a34a;
  border-color: #16a34a;
}

.dish-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dish-name {
  font-size: 17px;
  font-weight: 700;
  color: #111;
}

.dish-reason {
  font-size: 13px;
  color: #666;
}

.dish-time {
  font-size: 12px;
  color: #999;
}

.dish-detail-toggle {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--theme-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.dish-detail-toggle text {
  font-size: 13px;
  color: #777;
}

.dish-detail {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--theme-primary-light);
}

.detail-block {
  margin-bottom: 12px;
}

.detail-label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

.ingredient-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ingredient-item {
  font-size: 12px;
  color: #555;
  background: var(--theme-primary-lighter);
  border-radius: 6px;
  padding: 4px 10px;
}

.step-row {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}

.step-no {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--theme-primary);
  color: #111;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
  font-size: 14px;
  color: #444;
  line-height: 1.5;
}

.back-form-btn {
  margin: 20px auto 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: fit-content;
  padding: 8px 20px;
}

.back-form-btn text {
  font-size: 13px;
  color: #777;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.95);
  border-top: 1px solid var(--theme-primary-light);
  display: flex;
  gap: 12px;
  z-index: 100;
}

.primary-bar-btn {
  flex: 1;
  height: 48px;
  background: var(--theme-primary);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #111;
}

.primary-bar-btn.disabled {
  opacity: 0.5;
}

.cancel-bar-btn {
  flex: 1;
  height: 48px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 16px;
  color: #555;
}

.group-picker {
  height: 48px;
  padding: 0 16px;
  background: #230f12;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-name {
  font-size: 14px;
  color: #fff;
  max-width: 130px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
