<template>
  <view v-if="visible" class="ai-mask" :style="themeStyle" @click="close">
    <view class="ai-modal" @click.stop>
      <view class="ai-header">
        <text class="ai-title">AI 菜谱 · {{ dishName }}</text>
        <view class="ai-close" @click="close">
          <uni-icons type="closeempty" size="20" color="#999" />
        </view>
      </view>

      <scroll-view scroll-y class="ai-body" :scroll-into-view="scrollAnchor">
        <view class="ai-body-inner">
          <view v-if="status === 'error'" class="ai-error">
            <text>{{ errorMessage }}</text>
          </view>

          <view v-else-if="status === 'loading' && !hasContent" class="ai-loading">
            <text class="ai-loading-text">AI 正在翻菜谱...</text>
          </view>

          <template v-else>
            <view v-if="ingredients.length" class="ai-section">
              <text class="ai-section-title">用料</text>
              <view v-for="(ing, index) in ingredients" :key="index" class="ai-ing-row">
                <text class="ai-ing-name">{{ ing.name }}</text>
                <text class="ai-ing-amount">{{ ing.amount }}</text>
              </view>
            </view>

            <view v-if="steps.length" class="ai-section">
              <text class="ai-section-title">烹饪步骤</text>
              <view v-for="(step, index) in steps" :key="index" class="ai-step">
                <view class="ai-step-num">{{ index + 1 }}</view>
                <text class="ai-step-text">{{ step }}</text>
              </view>
            </view>

            <view v-if="status === 'streaming'" class="ai-streaming-hint">
              <text>生成中...</text>
            </view>
            <view v-else-if="status === 'done' && !hasContent" class="ai-error">
              <text>没能认出这道菜，换个名字试试</text>
            </view>
          </template>

          <!-- 两个底部锚点交替切换：scroll-into-view 只在值变化时生效，
               单个固定 id 无法在流式过程中反复触发滚动 -->
          <view id="ai-bottom-0" class="ai-anchor"></view>
          <view id="ai-bottom-1" class="ai-anchor"></view>
        </view>
      </scroll-view>

      <view class="ai-actions">
        <view class="ai-btn ai-btn-regen" :class="{ disabled: isRunning }" @click="regenerate">
          <text>重新生成</text>
        </view>
        <view class="ai-btn ai-btn-fill" :class="{ disabled: !canFill }" @click="confirmFill">
          <text>填充</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue'
import { streamRecipe, type AiRecipeIngredient, type StreamRecipeTask } from '@/services/aiRecipe'
import { themeStyle } from '@/utils/theme'

const emit = defineEmits<{
  (e: 'fill', payload: { ingredients: AiRecipeIngredient[]; steps: string[] }): void
}>()

type Status = 'loading' | 'streaming' | 'done' | 'error'

const visible = ref(false)
const status = ref<Status>('loading')
const errorMessage = ref('')
const dishName = ref('')
const ingredients = ref<AiRecipeIngredient[]>([])
const steps = ref<string[]>([])
const scrollAnchor = ref('')

/** 等内容渲染完再切锚点，否则滚动的是上一帧的旧高度 */
const stickToBottom = () => {
  nextTick(() => {
    scrollAnchor.value = scrollAnchor.value === 'ai-bottom-0' ? 'ai-bottom-1' : 'ai-bottom-0'
  })
}

let task: StreamRecipeTask | null = null

const isRunning = computed(() => status.value === 'loading' || status.value === 'streaming')
const hasContent = computed(() => ingredients.value.length > 0 || steps.value.length > 0)
const canFill = computed(() => status.value === 'done' && hasContent.value)

const run = () => {
  task?.abort()
  status.value = 'loading'
  errorMessage.value = ''
  ingredients.value = []
  steps.value = []
  scrollAnchor.value = ''

  task = streamRecipe(dishName.value, {
    onPartial: (partial) => {
      status.value = 'streaming'
      // 流式中间态里最后一项常是半截内容，过滤掉空壳，其余照常渐进渲染
      ingredients.value = (partial.ingredients || [])
        .filter((item) => item && item.name)
        .map((item) => ({ name: item.name || '', amount: item.amount || '' }))
      steps.value = (partial.steps || []).filter(Boolean)
      stickToBottom()
    },
    onDone: () => {
      status.value = 'done'
    },
    onError: (message) => {
      status.value = 'error'
      errorMessage.value = message
    }
  })
}

const open = (name: string) => {
  dishName.value = name
  visible.value = true
  run()
}

const close = () => {
  task?.abort()
  task = null
  visible.value = false
}

const regenerate = () => {
  if (isRunning.value) return
  run()
}

const confirmFill = () => {
  if (!canFill.value) return
  emit('fill', {
    ingredients: ingredients.value.map((item) => ({ ...item })),
    steps: [...steps.value]
  })
  close()
}

defineExpose({ open })
</script>

<style scoped>
.ai-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.ai-modal {
  width: 88vw;
  max-width: 340px;
  max-height: 84vh;
  background: #fff;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ai-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 16px;
  border-bottom: 1px solid var(--theme-primary-lighter);
}

.ai-title {
  flex: 1;
  min-width: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.ai-close {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 必须给确定高度：scroll-view 在 flex: 1 + max-height 下不构成可滚动视口，
   scroll-into-view / scroll-top 都不会生效。固定高度同时避免弹窗随内容跳动。
   padding 也不能加在 scroll-view 上：小程序里它是自定义组件，不继承 border-box，
   100% 宽度加左右 padding 会整体超出容器，被 .ai-modal 的 overflow: hidden 截掉 */
.ai-body {
  height: 46vh;
  width: 100%;
  box-sizing: border-box;
}

.ai-body-inner {
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
}

.ai-anchor {
  height: 1px;
}

.ai-loading, .ai-error {
  padding: 32px 0;
  text-align: center;
  font-size: 14px;
  color: #777;
}

.ai-error {
  color: #ba1a1a;
}

.ai-section {
  margin-bottom: 16px;
}

.ai-section-title {
  font-size: 14px;
  font-weight: 700;
  color: #111;
}

.ai-ing-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  box-sizing: border-box;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
  font-size: 14px;
}

/* flex 项默认 min-width: auto，长食材名不收缩会把用量挤出容器 */
.ai-ing-name {
  flex: 1;
  min-width: 0;
  color: #333;
  word-break: break-all;
}

.ai-ing-amount {
  flex-shrink: 0;
  max-width: 45%;
  text-align: right;
  color: #777;
  word-break: break-all;
}

.ai-step {
  display: flex;
  gap: 8px;
  padding: 8px 0;
}

.ai-step-num {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  background: var(--theme-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
}

.ai-step-text {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  word-break: break-all;
}

.ai-streaming-hint {
  padding: 8px 0;
  font-size: 12px;
  color: var(--theme-primary-dark);
}

.ai-actions {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid var(--theme-primary-lighter);
}

.ai-btn {
  flex: 1;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
}

.ai-btn.disabled {
  opacity: 0.5;
}

.ai-btn-regen {
  background: #f5f5f5;
  color: #555;
}

.ai-btn-fill {
  background: var(--theme-primary);
  color: #fff;
}
</style>
