<template>
  <view class="container" :style="themeStyle">
    <!-- Header -->
    <view class="header">
      <view class="back-btn" @click="goBack">
        <uni-icons type="left" size="24" color="#333" />
      </view>
      <view class="title">
        <text>拉粑粑么</text>
      </view>
      <view class="header-placeholder"></view>
    </view>

    <view class="content">
      <!-- 概览 -->
      <view class="stat-row">
        <view class="stat-card">
          <text class="stat-num">{{ todayCount }}</text>
          <text class="stat-label">今天次数</text>
        </view>
        <view class="stat-card">
          <text class="stat-num">{{ monthTotal }}</text>
          <text class="stat-label">本月次数</text>
        </view>
        <view class="stat-card">
          <text class="stat-num">{{ monthDays.length }}</text>
          <text class="stat-label">本月有记录天数</text>
        </view>
      </view>

      <!-- 月历 -->
      <PoopCalendar
        :month="month"
        :days="monthDays"
        :selected="selectedDate"
        @select="onDateSelect"
        @change-month="onChangeMonth"
      />

      <!-- 当日明细 -->
      <view class="day-card">
        <view class="day-header">
          <text class="day-title">{{ selectedLabel }}</text>
          <text class="day-count">共 {{ dayRecords.length }} 次</text>
        </view>

        <view v-if="!dayRecords.length" class="empty-text">
          <text>这天还没有记录</text>
        </view>

        <view v-for="record in dayRecords" :key="record.id" class="record-row">
          <text class="record-emoji">{{ bristolMeta(record.bristolType).emoji }}</text>
          <view class="record-info">
            <text class="record-time">{{ beijingTime(record.occurredAt) }}</text>
            <text class="record-type">
              {{ record.bristolType }}型 · {{ bristolMeta(record.bristolType).name }}
            </text>
            <text v-if="record.notes" class="record-notes">{{ record.notes }}</text>
          </view>
          <view class="record-actions">
            <view class="action-btn" @click="editRecord(record)">
              <uni-icons type="compose" size="18" color="#666" />
            </view>
            <view class="action-btn" @click="deleteRecord(record)">
              <uni-icons type="trash" size="18" color="#d05656" />
            </view>
          </view>
        </view>
      </view>

      <!-- AI 建议 -->
      <view class="advice-card">
        <view class="advice-header">
          <text class="card-title">🩺 AI 健康建议</text>
          <text v-if="advice" class="regen-btn" @click="fetchAdvice">重新生成</text>
        </view>

        <view v-if="adviceLoading" class="advice-loading">
          <text>AI 正在分析最近 30 天的记录…</text>
        </view>
        <text v-else-if="advice" class="advice-text">{{ advice }}</text>
        <view v-else class="advice-empty">
          <text class="advice-desc">根据最近 30 天的排便记录，AI 帮你解读肠道状态、给出饮食和生活习惯建议</text>
          <view class="primary-btn" @click="fetchAdvice">
            <text>获取健康建议</text>
          </view>
        </view>
      </view>

      <!-- 提醒订阅 -->
      <view class="reminder-card">
        <view class="reminder-info">
          <text class="card-title">🔔 每晚提醒</text>
          <text class="reminder-desc">21:00 微信问你「拉粑粑么」，已记录则不打扰</text>
          <text v-if="quotaRemaining > 0" class="reminder-quota">
            剩余 {{ quotaRemaining }} 次推送额度
          </text>
        </view>
        <view class="primary-btn small" @click="openSubscribe">
          <text>{{ quotaRemaining > 0 ? '续额度' : '开启' }}</text>
        </view>
      </view>

      <view style="height: 120px;"></view>
    </view>

    <!-- FAB -->
    <view class="fab" @click="addRecord">
      <uni-icons type="plus" size="32" color="#333" />
    </view>

    <TabBar :current-index="-1" @change="handleTabChange" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import TabBar from '@/components/TabBar.vue'
import PoopCalendar from '@/components/PoopCalendar.vue'
import {
  getMonth,
  getDayRecords,
  removePoop,
  getAdvice,
  getReminderConfig,
  ensurePoopSubscribe,
  BRISTOL_BY_TYPE,
  type PoopRecord,
  type MonthDay,
} from '@/services/poop'
import { beijingToday } from '@/utils/date'
import { themeStyle } from '@/utils/theme'

const today = beijingToday()
const month = ref(today.slice(0, 7))
const selectedDate = ref(today)
const monthDays = ref<MonthDay[]>([])
const dayRecords = ref<PoopRecord[]>([])

const advice = ref('')
const adviceLoading = ref(false)

const quotaRemaining = ref(0)

const bristolMeta = (type: number) =>
  BRISTOL_BY_TYPE[type] ?? { emoji: '❓', name: '未知' }

const todayCount = computed(
  () => monthDays.value.find((d) => d.date === today)?.count ?? 0,
)
const monthTotal = computed(() =>
  monthDays.value.reduce((sum, d) => sum + d.count, 0),
)

const selectedLabel = computed(() => {
  const date = new Date(`${selectedDate.value}T00:00:00`)
  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
  const [, m, d] = selectedDate.value.split('-')
  return `${Number(m)}月${Number(d)}日 ${weekday}`
})

/** UTC 时间字符串转东八区 HH:mm 展示。 */
const beijingTime = (utc: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(utc.replace(' ', 'T')))

const loadMonth = async () => {
  monthDays.value = await getMonth(month.value)
}

const loadDay = async () => {
  dayRecords.value = await getDayRecords(selectedDate.value)
}

const onDateSelect = (date: string) => {
  selectedDate.value = date
  loadDay()
}

const onChangeMonth = async (newMonth: string) => {
  month.value = newMonth
  await loadMonth()
}

const fetchAdvice = async () => {
  adviceLoading.value = true
  try {
    const res = await getAdvice(30)
    advice.value = res.advice
  } catch (err: any) {
    uni.showToast({ title: err.message || '生成失败', icon: 'none' })
  } finally {
    adviceLoading.value = false
  }
}

const openSubscribe = async () => {
  try {
    quotaRemaining.value = await ensurePoopSubscribe()
    uni.showToast({
      title: quotaRemaining.value > 0 ? '已开启提醒' : '未开启',
      icon: 'none',
    })
  } catch (err: any) {
    uni.showToast({ title: err.message || '开启失败', icon: 'none' })
  }
}

const addRecord = () => {
  uni.navigateTo({ url: '/pages/poop/add' })
}

const editRecord = (record: PoopRecord) => {
  uni.navigateTo({ url: `/pages/poop/add?id=${record.id}` })
}

const deleteRecord = async (record: PoopRecord) => {
  try {
    await removePoop(record.id)
    uni.showToast({ title: '已删除', icon: 'success' })
    await Promise.all([loadDay(), loadMonth()])
  } catch (err: any) {
    uni.showToast({ title: err.message || '删除失败', icon: 'none' })
  }
}

onShow(() => {
  loadMonth().catch((err) =>
    uni.showToast({ title: err.message || '加载失败', icon: 'none' }),
  )
  loadDay().catch(() => {})
  getReminderConfig()
    .then((res) => (quotaRemaining.value = res.remaining))
    .catch(() => {})
})

const goBack = () => {
  uni.navigateBack()
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
  padding-bottom: 140px;
}

.stat-row {
  display: flex;
  gap: 12px;
}

.stat-card {
  flex: 1;
  background: white;
  border-radius: 14px;
  padding: 14px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-num {
  font-size: 22px;
  font-weight: 700;
  color: #1f1a1b;
}

.stat-label {
  font-size: 11px;
  color: #999;
}

.day-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.day-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}

.day-title {
  font-size: 16px;
  font-weight: 700;
  color: #1f1a1b;
}

.day-count {
  font-size: 13px;
  color: #999;
}

.empty-text {
  padding: 24px 0;
  text-align: center;
  color: #aaa;
  font-size: 13px;
}

.record-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid #f5f2f3;
}

.record-emoji {
  font-size: 26px;
}

.record-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.record-time {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.record-type {
  font-size: 12px;
  color: #777;
}

.record-notes {
  font-size: 12px;
  color: #999;
}

.record-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.advice-card,
.reminder-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.advice-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  color: #1f1a1b;
}

.regen-btn {
  font-size: 13px;
  color: var(--theme-primary);
  font-weight: 600;
}

.advice-loading {
  padding: 20px 0;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.advice-text {
  font-size: 14px;
  color: #444;
  line-height: 1.7;
  white-space: pre-wrap;
}

.advice-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding-top: 4px;
}

.advice-desc {
  font-size: 13px;
  color: #888;
  line-height: 1.6;
}

.primary-btn {
  padding: 0 24px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--theme-primary);
}

.primary-btn.small {
  height: 34px;
  padding: 0 18px;
}

.primary-btn text {
  font-size: 14px;
  font-weight: 600;
  color: #1f1a1b;
}

.reminder-card {
  display: flex;
  align-items: center;
  gap: 12px;
}

.reminder-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.reminder-desc {
  font-size: 12px;
  color: #888;
}

.reminder-quota {
  font-size: 12px;
  color: var(--theme-primary);
}

.fab {
  position: fixed;
  bottom: 96px;
  right: 24px;
  width: 56px;
  height: 56px;
  background: var(--theme-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(var(--theme-primary-rgb), 0.4);
  z-index: 50;
}
</style>
