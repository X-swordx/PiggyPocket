<template>
  <view class="container" :style="themeStyle">
    <!-- Header -->
    <view class="header">
      <view class="back-btn" @click="goBack">
        <uni-icons type="left" size="24" color="#333" />
      </view>
      <view class="title">
        <text>{{ isEdit ? '编辑记录' : '记一笔' }}</text>
      </view>
      <view class="header-placeholder"></view>
    </view>

    <view class="content">
      <!-- 布里斯托分型 -->
      <view class="section-card">
        <text class="section-title">今天的粑粑长啥样？</text>
        <view class="type-grid">
          <view
            v-for="item in BRISTOL_TYPES"
            :key="item.type"
            class="type-item"
            :class="{ selected: bristolType === item.type, [item.tag]: true }"
            @click="bristolType = item.type"
          >
            <text class="type-emoji">{{ item.emoji }}</text>
            <text class="type-num">{{ item.type }}型</text>
            <text class="type-name">{{ item.name }}</text>
          </view>
        </view>
        <text v-if="selectedMeta" class="type-desc">{{ selectedMeta.desc }}</text>
      </view>

      <!-- 时间 -->
      <view class="section-card">
        <text class="section-title">排便时间</text>
        <uni-datetime-picker
          type="datetime"
          :value="datetime"
          :max="nowMax"
          @change="onTimeChange"
        />
      </view>

      <!-- 备注 -->
      <view class="section-card">
        <text class="section-title">备注（可选）</text>
        <textarea
          v-model="notes"
          class="notes-input"
          placeholder="比如：肚子有点疼、带血、排得很痛快…"
          maxlength="200"
        />
      </view>

      <view class="save-btn" :class="{ disabled: saving }" @click="save">
        <text>{{ saving ? '保存中…' : '保存' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import {
  addPoop,
  updatePoop,
  getPoopRecord,
  BRISTOL_TYPES,
  BRISTOL_BY_TYPE,
} from '@/services/poop'
import { beijingToday } from '@/utils/date'
import { themeStyle } from '@/utils/theme'

const editId = ref<number | null>(null)
const isEdit = computed(() => editId.value !== null)

const bristolType = ref<number | null>(null)
const datetime = ref('')
const notes = ref('')
const saving = ref(false)

const nowMax = computed(() => {
  const now = new Date()
  return `${beijingToday()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
})

const selectedMeta = computed(() =>
  bristolType.value ? BRISTOL_BY_TYPE[bristolType.value] : null,
)

/** 当前东八区墙时间，填充给 picker。 */
const nowBeijingWall = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date())
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]))
  return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}`
}

/** UTC 字符串转东八区墙时间，供编辑态回填。 */
const toBeijingWall = (utc: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(utc.replace(' ', 'T')))
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]))
  return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}`
}

const onTimeChange = (value: string) => {
  datetime.value = value
}

const save = async () => {
  if (saving.value) return
  if (!bristolType.value) {
    uni.showToast({ title: '请选择粑粑形态', icon: 'none' })
    return
  }
  if (!datetime.value) {
    uni.showToast({ title: '请选择时间', icon: 'none' })
    return
  }

  // picker 的值是设备本地（东八区）墙时间，转成带时区的 ISO 字符串
  const occurredAt = new Date(datetime.value.replace(' ', 'T')).toISOString()
  if (Number.isNaN(new Date(occurredAt).getTime())) {
    uni.showToast({ title: '时间格式有误', icon: 'none' })
    return
  }

  saving.value = true
  try {
    if (isEdit.value) {
      await updatePoop(editId.value!, {
        occurredAt,
        bristolType: bristolType.value,
        notes: notes.value || undefined,
      })
    } else {
      await addPoop({
        occurredAt,
        bristolType: bristolType.value,
        notes: notes.value || undefined,
      })
    }
    uni.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 500)
  } catch (err: any) {
    uni.showToast({ title: err.message || '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

onLoad(async (options) => {
  datetime.value = nowBeijingWall()
  if (!options?.id) return

  editId.value = Number(options.id)
  try {
    const record = await getPoopRecord(editId.value)
    bristolType.value = record.bristolType
    datetime.value = toBeijingWall(record.occurredAt)
    notes.value = record.notes ?? ''
  } catch (err: any) {
    uni.showToast({ title: err.message || '加载失败', icon: 'none' })
  }
})

const goBack = () => {
  uni.navigateBack()
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--theme-bg);
}

.header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 16px;
  padding-top: calc(16px + var(--status-bar-height));
  background: rgba(248, 245, 246, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--theme-primary-light);
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

.header-placeholder {
  width: 40px;
  height: 40px;
}

.title {
  flex: 1;
  text-align: center;
}

.title text {
  font-size: 20px;
  font-weight: 700;
  color: #1f1a1b;
}

.content {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-title {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: #1f1a1b;
  margin-bottom: 14px;
}

.type-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.type-item {
  width: calc((100% - 30px) / 4);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 4px;
  border-radius: 12px;
  border: 2px solid transparent;
  background: #faf8f8;
}

.type-item.selected {
  border-color: var(--theme-primary);
  background: var(--theme-primary-light);
}

.type-emoji {
  font-size: 24px;
}

.type-num {
  font-size: 12px;
  font-weight: 700;
  color: #333;
}

.type-name {
  font-size: 10px;
  color: #888;
}

.type-desc {
  display: block;
  margin-top: 10px;
  font-size: 12px;
  color: #777;
}

.notes-input {
  width: 100%;
  height: 80px;
  padding: 10px;
  border-radius: 10px;
  background: #faf8f8;
  font-size: 14px;
  box-sizing: border-box;
}

.save-btn {
  margin-top: 8px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--theme-primary);
}

.save-btn.disabled {
  opacity: 0.6;
}

.save-btn text {
  font-size: 16px;
  font-weight: 600;
  color: #1f1a1b;
}
</style>
