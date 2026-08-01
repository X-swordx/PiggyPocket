<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElCard, ElTag } from 'element-plus'
import {
  getDashboardOverview, getOrderStatusDistribution, getOrderTrend,
  type DashboardCards,
} from '@/api/modules/piggy'
import { ORDER_STATUS_OPTIONS, ORDER_STATUS_TAG_TYPE, labelOf } from './options'

defineOptions({ name: 'Dashboard' })

const loading = ref(false)
const cards = ref<DashboardCards | null>(null)
const statusDist = ref<Array<{ status: string; count: number }>>([])
const trend = ref<Array<{ date: string; count: number }>>([])

const statusTotal = computed(() =>
  statusDist.value.reduce((sum, s) => sum + s.count, 0),
)

const trendMax = computed(() =>
  Math.max(1, ...trend.value.map(t => t.count)),
)

/** 折线图的 SVG path，坐标系 0..100 x 0..40 */
const trendPath = computed(() => {
  const list = trend.value
  if (list.length < 2) return ''
  const stepX = 100 / (list.length - 1)
  return list
    .map((t, i) => {
      const x = (i * stepX).toFixed(2)
      const y = (40 - (t.count / trendMax.value) * 34).toFixed(2)
      return `${i === 0 ? 'M' : 'L'}${x},${y}`
    })
    .join(' ')
})

async function load() {
  loading.value = true
  try {
    const [overview, dist, tr] = await Promise.all([
      getDashboardOverview(),
      getOrderStatusDistribution(),
      getOrderTrend(7),
    ])
    cards.value = overview.cards
    statusDist.value = dist
    trend.value = tr
  }
  finally {
    loading.value = false
  }
}

function pct(count: number) {
  if (!statusTotal.value) return 0
  return Math.round((count / statusTotal.value) * 100)
}

const barColor: Record<string, string> = {
  pending: 'oklch(0.7 0.02 250)',
  confirming: 'oklch(0.78 0.15 75)',
  cooking: 'oklch(0.66 0.18 258)',
  completed: 'oklch(0.7 0.16 150)',
}

onMounted(load)
</script>

<template>
  <div v-loading="loading" class="space-y-4">
    <!-- 统计卡片 -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <ElCard v-for="item in [
        { label: '用户总数', value: cards?.userTotal ?? 0, sub: `今日新增 ${cards?.newUsersToday ?? 0}`, icon: 'i-lucide:users' },
        { label: '临期食品', value: cards?.foodTotal ?? 0, sub: `3天内到期 ${cards?.expiringSoon ?? 0}`, icon: 'i-lucide:refrigerator' },
        { label: '心愿总数', value: cards?.wishTotal ?? 0, sub: '', icon: 'i-lucide:sparkles' },
        { label: '订单总数', value: cards?.orderTotal ?? 0, sub: `今日新增 ${cards?.newOrdersToday ?? 0}`, icon: 'i-lucide:shopping-cart' },
      ]" :key="item.label" shadow="never">
        <div class="flex items-start justify-between">
          <div>
            <div class="text-sm text-muted-foreground">
              {{ item.label }}
            </div>
            <div class="text-3xl font-semibold mt-1">
              {{ item.value }}
            </div>
            <div v-if="item.sub" class="text-xs text-muted-foreground mt-1">
              {{ item.sub }}
            </div>
          </div>
          <FaIcon :name="item.icon" class="size-8 text-muted-foreground/50" />
        </div>
      </ElCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- 订单状态分布 -->
      <ElCard shadow="never">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="font-medium">订单状态分布</span>
            <span class="text-xs text-muted-foreground">共 {{ statusTotal }} 单</span>
          </div>
        </template>
        <div v-if="statusTotal === 0" class="py-8 text-center text-sm text-muted-foreground">
          暂无订单数据
        </div>
        <div v-else class="space-y-3">
          <div v-for="s in statusDist" :key="s.status">
            <div class="flex items-center justify-between text-sm mb-1">
              <ElTag :type="ORDER_STATUS_TAG_TYPE[s.status]" size="small" effect="light">
                {{ labelOf(ORDER_STATUS_OPTIONS as any, s.status) }}
              </ElTag>
              <span class="text-muted-foreground">{{ s.count }} 单 · {{ pct(s.count) }}%</span>
            </div>
            <div class="h-2 rounded-full bg-muted overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :style="{
                  width: `${pct(s.count)}%`,
                  backgroundColor: barColor[s.status] ?? 'oklch(0.7 0.02 250)',
                }"
              />
            </div>
          </div>
        </div>
      </ElCard>

      <!-- 近 7 天订单趋势 -->
      <ElCard shadow="never">
        <template #header>
          <span class="font-medium">近 7 天订单趋势</span>
        </template>
        <div v-if="!trend.length" class="py-8 text-center text-sm text-muted-foreground">
          暂无数据
        </div>
        <div v-else>
          <svg viewBox="0 0 100 44" class="w-full h-32" preserveAspectRatio="none">
            <!-- 网格线 -->
            <line
              v-for="y in [6, 23, 40]"
              :key="y"
              x1="0" :y1="y" x2="100" :y2="y"
              stroke="oklch(var(--border))" stroke-width="0.3"
              vector-effect="non-scaling-stroke"
            />
            <path
              :d="trendPath"
              fill="none"
              stroke="oklch(var(--primary))"
              stroke-width="1.5"
              vector-effect="non-scaling-stroke"
              stroke-linejoin="round"
            />
            <circle
              v-for="(t, i) in trend"
              :key="t.date"
              :cx="(i * (100 / (trend.length - 1))).toFixed(2)"
              :cy="(40 - (t.count / trendMax) * 34).toFixed(2)"
              r="1.2"
              fill="oklch(var(--primary))"
            />
          </svg>
          <div class="flex justify-between mt-2 text-xs text-muted-foreground">
            <span v-for="t in trend" :key="t.date" class="text-center flex-1">
              <div>{{ t.date.slice(5) }}</div>
              <div class="font-medium text-foreground">{{ t.count }}</div>
            </span>
          </div>
        </div>
      </ElCard>
    </div>

    <!-- 订单待办提示 -->
    <ElCard shadow="never">
      <div class="flex flex-wrap gap-6">
        <div>
          <span class="text-sm text-muted-foreground">待处理订单</span>
          <span class="ml-2 text-lg font-semibold">{{ cards?.pendingOrders ?? 0 }}</span>
        </div>
        <div>
          <span class="text-sm text-muted-foreground">已完成订单</span>
          <span class="ml-2 text-lg font-semibold">{{ cards?.completedOrders ?? 0 }}</span>
        </div>
        <div>
          <span class="text-sm text-muted-foreground">3 天内到期食品</span>
          <span class="ml-2 text-lg font-semibold">{{ cards?.expiringSoon ?? 0 }}</span>
        </div>
      </div>
    </ElCard>
  </div>
</template>
