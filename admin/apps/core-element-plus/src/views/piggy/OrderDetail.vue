<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  ElDrawer, ElDescriptions, ElDescriptionsItem, ElTable, ElTableColumn,
  ElImage, ElTag, ElButton, ElInput, ElMessage, ElPopconfirm, ElDivider,
} from 'element-plus'
import {
  getOrder, setOrderStatus, updateOrderRemark,
  type AdminOrder, type OrderStatus,
} from '@/api/modules/piggy'
import {
  ORDER_STATUS_OPTIONS, ORDER_STATUS_TAG_TYPE, ORDER_NEXT_STATUS, labelOf,
} from './options'
import { usePiggyAuth } from './usePiggyAuth'

const { canEdit } = usePiggyAuth('admin.order:edit')

const props = defineProps<{
  visible: boolean
  id: number | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'saved'): void
}>()

const loading = ref(false)
const submitting = ref(false)
const order = ref<AdminOrder | null>(null)
const remark = ref('')

const nextStatus = computed<OrderStatus | null>(() => {
  if (!order.value) return null
  return ORDER_NEXT_STATUS[order.value.status] ?? null
})

async function load() {
  if (!props.id) return
  loading.value = true
  try {
    order.value = await getOrder(props.id)
    remark.value = order.value.remark ?? ''
  }
  finally {
    loading.value = false
  }
}

watch(
  () => [props.visible, props.id] as const,
  ([v]) => {
    if (v) load()
  },
  { immediate: true },
)

async function onAdvanceStatus() {
  if (!order.value || !nextStatus.value) return
  submitting.value = true
  try {
    order.value = await setOrderStatus(order.value.id, nextStatus.value)
    ElMessage.success(`已推进至：${labelOf(ORDER_STATUS_OPTIONS as any, order.value.status)}`)
    emit('saved')
  }
  finally {
    submitting.value = false
  }
}

async function onSaveRemark() {
  if (!order.value) return
  submitting.value = true
  try {
    order.value = await updateOrderRemark(order.value.id, remark.value)
    ElMessage.success('备注已更新')
    emit('saved')
  }
  finally {
    submitting.value = false
  }
}

async function onRevert(target: OrderStatus) {
  if (!order.value) return
  submitting.value = true
  try {
    order.value = await setOrderStatus(order.value.id, target)
    ElMessage.success(`已回退至：${labelOf(ORDER_STATUS_OPTIONS as any, order.value.status)}`)
    emit('saved')
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <ElDrawer
    :model-value="visible"
    title="订单详情"
    size="640px"
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
  >
    <div v-loading="loading" class="min-h-40">
      <template v-if="order">
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="订单号">
            {{ order.orderNo }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            <ElTag :type="ORDER_STATUS_TAG_TYPE[order.status]" effect="light">
              {{ labelOf(ORDER_STATUS_OPTIONS as any, order.status) }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="下单人">
            {{ order.userNickname ?? `#${order.userId}` }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="分组">
            {{ order.groupName ?? (order.groupId ? `#${order.groupId}` : '-') }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="做菜日期">
            {{ order.cookDate ?? '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="创建时间">
            {{ new Date(order.createdAt).toLocaleString() }}
          </ElDescriptionsItem>
        </ElDescriptions>

        <div class="mt-4">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-sm font-medium">状态流转：</span>
            <template v-if="canEdit">
              <ElButton
                v-if="nextStatus"
                size="small"
                type="primary"
                :loading="submitting"
                @click="onAdvanceStatus"
              >
                推进至 {{ labelOf(ORDER_STATUS_OPTIONS as any, nextStatus) }}
              </ElButton>
              <span v-else class="text-sm text-muted-foreground">已到终态</span>
              <div class="flex-1" />
              <ElPopconfirm
                v-if="order.status !== 'pending'"
                title="回退到待处理状态？"
                @confirm="onRevert('pending')"
              >
                <template #reference>
                  <ElButton size="small" plain>
                    回退到待处理
                  </ElButton>
                </template>
              </ElPopconfirm>
            </template>
            <span v-else class="text-sm text-muted-foreground">当前角色为只读，无法调整状态</span>
          </div>
        </div>

        <ElDivider />

        <div>
          <div class="text-sm font-medium mb-2">
            菜品明细（共 {{ order.items.length }} 项）
          </div>
          <ElTable :data="order.items" border>
            <ElTableColumn label="封面" width="80">
              <template #default="{ row }">
                <ElImage
                  v-if="row.dish?.image"
                  :src="row.dish.image"
                  :preview-src-list="[row.dish.image]"
                  preview-teleported
                  fit="cover"
                  style="width: 48px; height: 48px; border-radius: 4px"
                />
                <span v-else class="text-xs text-muted-foreground">无</span>
              </template>
            </ElTableColumn>
            <ElTableColumn label="菜品" min-width="140">
              <template #default="{ row }">
                {{ row.dish?.name ?? `已删除 (#${row.dishId})` }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="分类" width="90" prop="dish.category" />
            <ElTableColumn label="数量" width="70" prop="quantity" />
            <ElTableColumn label="子项备注" prop="remark" show-overflow-tooltip />
          </ElTable>
        </div>

        <ElDivider />

        <div>
          <div class="text-sm font-medium mb-2">
            订单备注
          </div>
          <ElInput
            v-model="remark"
            type="textarea"
            :rows="3"
            :disabled="!canEdit"
            maxlength="500"
            show-word-limit
            placeholder="给这单加个备注..."
          />
          <div v-if="canEdit" class="mt-2 flex justify-end">
            <ElButton
              type="primary"
              :loading="submitting"
              @click="onSaveRemark"
            >
              保存备注
            </ElButton>
          </div>
        </div>
      </template>
    </div>
  </ElDrawer>
</template>
