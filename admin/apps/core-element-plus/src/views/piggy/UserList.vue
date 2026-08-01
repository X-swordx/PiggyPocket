<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import {
  ElButton, ElInput, ElTable, ElTableColumn, ElPagination, ElAvatar, ElTag,
  ElSwitch, ElMessage,
} from 'element-plus'
import {
  listUsers, setUserStatus, type AdminUserRow,
} from '@/api/modules/piggy'
import UserDetail from './UserDetail.vue'
import { usePiggyAuth } from './usePiggyAuth'

defineOptions({ name: 'UserList' })

const { canEdit } = usePiggyAuth('admin.user:edit')

const loading = ref(false)
const list = ref<AdminUserRow[]>([])
const total = ref(0)

const query = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
})

async function fetchData() {
  loading.value = true
  try {
    const res = await listUsers({
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword || undefined,
    })
    list.value = res.list
    total.value = res.total
  }
  finally {
    loading.value = false
  }
}

function onSearch() {
  query.page = 1
  fetchData()
}

function onReset() {
  query.keyword = ''
  onSearch()
}

// ============ 详情抽屉 ============
const detailVisible = ref(false)
const currentId = ref<number | null>(null)

function onView(row: AdminUserRow) {
  currentId.value = row.id
  detailVisible.value = true
}

function onSaved() {
  fetchData()
}

async function onToggleStatus(row: AdminUserRow, enabled: boolean) {
  try {
    await setUserStatus(row.id, enabled ? 1 : 0)
    row.status = enabled ? 1 : 0
    ElMessage.success(enabled ? '已启用' : '已禁用')
  }
  catch {
    // 失败保持原状态，switch 自动回弹
  }
}

onMounted(fetchData)
</script>

<template>
  <FaPageMain>
    <div class="flex flex-wrap gap-3 mb-4">
      <ElInput
        v-model="query.keyword"
        placeholder="按昵称搜索"
        clearable
        style="width: 220px"
        @keyup.enter="onSearch"
      />
      <ElButton type="primary" @click="onSearch">
        搜索
      </ElButton>
      <ElButton @click="onReset">
        重置
      </ElButton>
    </div>

    <ElTable
      v-loading="loading"
      :data="list"
      border
      stripe
      row-key="id"
      empty-text="暂无数据"
    >
      <ElTableColumn label="ID" prop="id" width="70" />
      <ElTableColumn label="头像" width="72">
        <template #default="{ row }">
          <ElAvatar :size="36" :src="row.avatar">
            {{ (row.nickname ?? '?').slice(0, 1) }}
          </ElAvatar>
        </template>
      </ElTableColumn>
      <ElTableColumn label="昵称" min-width="140" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.nickname ?? `用户 #${row.id}` }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="openid 尾号" width="120">
        <template #default="{ row }">
          <ElTag effect="plain" size="small">
            {{ row.openidTail ? `…${row.openidTail}` : '-' }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="食品" prop="foodCount" width="80" />
      <ElTableColumn label="心愿" prop="wishCount" width="80" />
      <ElTableColumn label="菜品" prop="dishCount" width="80" />
      <ElTableColumn label="订单" prop="orderCount" width="80" />
      <ElTableColumn label="注册时间" width="170">
        <template #default="{ row }">
          {{ new Date(row.createdAt).toLocaleString() }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="状态" width="140">
        <template #default="{ row }">
          <ElSwitch
            :model-value="row.status === 1"
            :disabled="!canEdit"
            active-text="启用"
            inactive-text="禁用"
            @change="(v) => onToggleStatus(row as AdminUserRow, v as boolean)"
          />
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <ElButton link type="primary" @click="onView(row as AdminUserRow)">
            详情
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <div class="flex justify-end mt-4">
      <ElPagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="fetchData"
        @size-change="fetchData"
      />
    </div>

    <UserDetail
      v-if="detailVisible"
      v-model:visible="detailVisible"
      :id="currentId"
      @saved="onSaved"
    />
  </FaPageMain>
</template>
