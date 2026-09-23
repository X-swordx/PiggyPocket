<template>
<view class="calendar">
  <view class="cal-header">
    <view class="arrow" @click="changeMonth(-1)">
      <uni-icons type="left" size="20" color="#333" />
    </view>
    <text class="cal-title">{{ year }}年{{ Number(monthNum) }}月</text>
    <view class="arrow" :class="{ disabled: isCurrentMonth }" @click="changeMonth(1)">
      <uni-icons type="right" size="20" :color="isCurrentMonth ? '#ccc' : '#333'" />
    </view>
  </view>

  <view class="week-row">
    <text v-for="w in weekDays" :key="w" class="week-text">{{ w }}</text>
  </view>

  <view class="day-grid">
    <view v-for="(cell, i) in cells" :key="i" class="day-cell" :class="cellClass(cell)" @click="onSelect(cell)">
      <text class="day-num">{{ cell.day }}</text>
      <view v-if="cell.types?.length" class="dot-row">
        <view
          v-for="(t, j) in cell.types.slice(0, 4)"
          :key="j"
          class="dot"
          :style="{ background: dotColor(t) }"
        ></view>
        <text v-if="cell.types.length > 4" class="more-text">+{{ cell.types.length - 4 }}</text>
      </view>
    </view>
  </view>
</view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue'
import { BRISTOL_BY_TYPE, type MonthDay } from '@/services/poop'
import { beijingToday } from '@/utils/date'

interface Cell {
  day: number
  date: string
  types: number[]
  future: boolean
}

const props = defineProps<{
  month: string
  days: MonthDay[]
  selected: string
}>()

const emit = defineEmits<{
  (e: 'select', date: string): void
  (e: 'change-month', month: string): void
}>()

const weekDays = ['一', '二', '三', '四', '五', '六', '日']

const parts = computed(() => props.month.split('-'))
const year = computed(() => parts.value[0])
const monthNum = computed(() => parts.value[1])

const today = beijingToday()
const isCurrentMonth = computed(() => props.month === today.slice(0, 7))

const cells = computed<Cell[]>(() => {
  const y = Number(year.value)
  const m = Number(monthNum.value)
  const firstWeekday = (new Date(y, m - 1, 1).getDay() + 6) % 7
  const daysInMonth = new Date(y, m, 0).getDate()

  const byDate = new Map(props.days.map((d) => [d.date, d.types]))
  const list: Cell[] = []
  for (let i = 0; i < firstWeekday; i++) {
    list.push({ day: 0, date: '', types: [], future: true })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year.value}-${monthNum.value}-${String(day).padStart(2, '0')}`
    list.push({
      day,
      date,
      types: byDate.get(date) ?? [],
      future: date > today,
    })
  }
  return list
})

const cellClass = (cell: Cell) => ({
  blank: !cell.day,
  future: cell.future,
  today: cell.date === today,
  selected: cell.date === props.selected,
  'has-record': !!cell.types.length,
})

const dotColor = (type: number) => {
  const tag = BRISTOL_BY_TYPE[type]?.tag
  if (tag === 'hard') return '#f59e0b'
  if (tag === 'soft') return '#ef4444'
  return '#22c55e'
}

const onSelect = (cell: Cell) => {
  if (!cell.day || cell.future) return
  emit('select', cell.date)
}

const changeMonth = (delta: number) => {
  if (delta > 0 && isCurrentMonth.value) return
  const date = new Date(Number(year.value), Number(monthNum.value) - 1 + delta, 1)
  emit(
    'change-month',
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
  )
}
</script>

<style scoped>
.calendar {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.arrow {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.arrow.disabled {
  opacity: 0.5;
}

.cal-title {
  font-size: 17px;
  font-weight: 700;
  color: #1f1a1b;
}

.week-row {
  display: flex;
  margin-bottom: 4px;
}

.week-text {
  flex: 1;
  text-align: center;
  font-size: 12px;
  color: #999;
}

.day-grid {
  display: flex;
  flex-wrap: wrap;
}

.day-cell {
  width: calc(100% / 7);
  height: 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border-radius: 10px;
}

.day-cell.blank {
  visibility: hidden;
}

.day-num {
  font-size: 14px;
  color: #333;
}

.day-cell.future .day-num {
  color: #ccc;
}

.day-cell.today .day-num {
  font-weight: 700;
  color: var(--theme-primary);
}

.day-cell.selected {
  background: var(--theme-primary-light);
}

.dot-row {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 6px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.more-text {
  font-size: 9px;
  color: #999;
}
</style>
