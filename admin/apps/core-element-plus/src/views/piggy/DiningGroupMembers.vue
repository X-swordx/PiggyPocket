<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  ElDrawer, ElTable, ElTableColumn, ElAvatar, ElButton, ElMessage,
  ElPopconfirm, ElMessageBox,
} from 'element-plus'
import {
  listGroupMembers, addGroupMember, updateGroupMember, removeGroupMember,
  type AdminDiningGroup, type AdminGroupMember,
} from '@/api/modules/piggy'
import UserSelect from './components/UserSelect.vue'
import { usePiggyAuth } from './usePiggyAuth'

const { canEdit } = usePiggyAuth('admin.diningGroup:edit')

const props = defineProps<{
  visible: boolean
  group: AdminDiningGroup
}>()

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'changed'): void
}>()

const loading = ref(false)
const members = ref<AdminGroupMember[]>([])

const addUserId = ref<number | null>(null)
const adding = ref(false)

async function load() {
  loading.value = true
  try {
    members.value = await listGroupMembers(props.group.id)
  }
  finally {
    loading.value = false
  }
}

watch(
  () => props.visible,
  (v) => {
    if (v) load()
  },
  { immediate: true },
)

async function onAdd() {
  if (!addUserId.value) {
    ElMessage.warning('请选择要添加的用户')
    return
  }
  adding.value = true
  try {
    members.value = await addGroupMember(props.group.id, {
      userId: addUserId.value,
    })
    addUserId.value = null
    ElMessage.success('已添加')
    emit('changed')
  }
  finally {
    adding.value = false
  }
}

async function onRenameMember(row: AdminGroupMember) {
  try {
    const { value } = await ElMessageBox.prompt('在组内的昵称', '修改成员昵称', {
      inputValue: row.nickname ?? '',
    })
    members.value = await updateGroupMember(props.group.id, row.id, {
      nickname: value ?? '',
    })
    ElMessage.success('已更新')
  }
  catch {
    // cancel
  }
}

async function onRemove(row: AdminGroupMember) {
  await removeGroupMember(props.group.id, row.id)
  ElMessage.success('已移除')
  await load()
  emit('changed')
}
</script>

<template>
  <ElDrawer
    :model-value="visible"
    :title="`成员管理 - ${group.name}`"
    size="600px"
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
  >
    <div v-if="canEdit" class="mb-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-sm font-medium">添加成员：</span>
      </div>
      <div class="flex gap-2">
        <div class="flex-1">
          <UserSelect v-model="addUserId" placeholder="搜索并选择用户" />
        </div>
        <ElButton
          type="primary"
          :loading="adding"
          @click="onAdd"
        >
          加入
        </ElButton>
      </div>
    </div>

    <ElTable
      v-loading="loading"
      :data="members"
      border
      stripe
      row-key="id"
      empty-text="暂无成员"
    >
      <ElTableColumn label="ID" prop="id" width="60" />
      <ElTableColumn label="头像" width="70">
        <template #default="{ row }">
          <ElAvatar :size="32" :src="row.user?.avatar">
            {{ (row.user?.nickname ?? '?').slice(0, 1) }}
          </ElAvatar>
        </template>
      </ElTableColumn>
      <ElTableColumn label="昵称" min-width="140">
        <template #default="{ row }">
          {{ row.nickname || row.user?.nickname || `#${row.userId}` }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="openid 尾号" width="110">
        <template #default="{ row }">
          {{ row.user?.openidTail ? `…${row.user.openidTail}` : '-' }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="加入时间" width="170">
        <template #default="{ row }">
          {{ new Date(row.joinedAt).toLocaleString() }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <template v-if="canEdit">
            <ElButton link type="primary" @click="onRenameMember(row as AdminGroupMember)">
              改昵称
            </ElButton>
            <ElPopconfirm
              title="移除该成员？"
              width="200"
              @confirm="onRemove(row as AdminGroupMember)"
            >
              <template #reference>
                <ElButton link type="danger">
                  移除
                </ElButton>
              </template>
            </ElPopconfirm>
          </template>
          <span v-else class="text-xs text-muted-foreground">只读</span>
        </template>
      </ElTableColumn>
    </ElTable>
  </ElDrawer>
</template>
