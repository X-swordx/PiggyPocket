<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  ElDrawer, ElDescriptions, ElDescriptionsItem, ElAvatar, ElInput,
  ElButton, ElMessage, ElStatistic, ElRow, ElCol,
} from 'element-plus'
import {
  getAdminUser, updateAdminUser, type AdminUserDetail,
} from '@/api/modules/piggy'
import { usePiggyAuth } from './usePiggyAuth'

const { canEdit } = usePiggyAuth('admin.user:edit')

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
const user = ref<AdminUserDetail | null>(null)
const nickname = ref('')

async function load() {
  if (!props.id) return
  loading.value = true
  try {
    user.value = await getAdminUser(props.id)
    nickname.value = user.value.nickname ?? ''
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

async function onSaveNickname() {
  if (!user.value) return
  submitting.value = true
  try {
    user.value = await updateAdminUser(user.value.id, { nickname: nickname.value })
    ElMessage.success('已更新')
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
    title="用户详情"
    size="560px"
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
  >
    <div v-loading="loading" class="min-h-40">
      <template v-if="user">
        <div class="flex items-center gap-4 mb-4">
          <ElAvatar :size="64" :src="user.avatar">
            {{ (user.nickname ?? '?').slice(0, 1) }}
          </ElAvatar>
          <div class="flex-1">
            <div class="text-lg font-medium">
              {{ user.nickname ?? `用户 #${user.id}` }}
            </div>
            <div class="text-xs text-muted-foreground">
              openid: {{ user.openid ? `…${user.openidTail}` : '-' }}
            </div>
          </div>
        </div>

        <ElRow :gutter="12" class="mb-4">
          <ElCol :span="6">
            <div class="p-3 rounded border bg-muted/40">
              <ElStatistic :value="user.itemCount" title="到期物品" />
            </div>
          </ElCol>
          <ElCol :span="6">
            <div class="p-3 rounded border bg-muted/40">
              <ElStatistic :value="user.wishCount" title="心愿" />
            </div>
          </ElCol>
          <ElCol :span="6">
            <div class="p-3 rounded border bg-muted/40">
              <ElStatistic :value="user.dishCount" title="菜品" />
            </div>
          </ElCol>
          <ElCol :span="6">
            <div class="p-3 rounded border bg-muted/40">
              <ElStatistic :value="user.orderCount" title="订单" />
            </div>
          </ElCol>
        </ElRow>

        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="ID">
            {{ user.id }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="openid">
            {{ user.openid ?? '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="注册时间">
            {{ new Date(user.createdAt).toLocaleString() }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="更新时间">
            {{ new Date(user.updatedAt).toLocaleString() }}
          </ElDescriptionsItem>
        </ElDescriptions>

        <div v-if="canEdit" class="mt-4">
          <div class="text-sm font-medium mb-2">
            修改昵称
          </div>
          <div class="flex gap-2">
            <ElInput v-model="nickname" maxlength="50" show-word-limit />
            <ElButton type="primary" :loading="submitting" @click="onSaveNickname">
              保存
            </ElButton>
          </div>
        </div>
      </template>
    </div>
  </ElDrawer>
</template>
