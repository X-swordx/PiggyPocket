<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import {
  ElButton, ElSelect, ElOption, ElTable, ElTableColumn, ElPagination,
  ElTag, ElDatePicker, ElPopover,
} from 'element-plus'
import { listOpLogs, type AdminOpLog } from '@/api/modules/piggy'

defineOptions({ name: 'SystemLog' })

const ACTION_OPTIONS = [
  { label: '登录', value: 'login' },
  { label: '登出', value: 'logout' },
  { label: '新增', value: 'create' },
  { label: '修改', value: 'update' },
  { label: '删除', value: 'delete' },
  { label: '状态变更', value: 'status' },
  { label: '重置密码', value: 'reset_password' },
]

const ACTION_TAG: Record<string, 'success' | 'primary' | 'warning' | 'danger' | 'info'> = {
  login: 'success',
  logout: 'info',
  create: 'primary',
  update: 'warning',
  delete: 'danger',
  status: 'warning',
  reset_password: 'danger',
}

const RESOURCE_LABEL: Record<string, string> = {
  admin_auth: '后台登录',
  admin_user: '管理员账号',
  user: '小程序用户',
  expiry_item: '到期物品',
  expiry_item_expired: '批量清理过期',
  expiry_item_reindex: '重建向量索引',
  expiry_item_reminder: '到期提醒扫描',
  wish: '心愿',
  dish: '菜品',
  order: '订单',
  order_remark: '订单备注',
  dining_group: '饭搭子',
  dining_group_member: '饭搭子成员',
}

const actionLabel = (a: string) =>
  ACTION_OPTIONS.find(o => o.value === a)?.label ?? a
const resourceLabel = (r: string | null) =>
  r ? RESOURCE_LABEL[r] ?? r : '-'

const loading = ref(false)
const list = ref<AdminOpLog[]>([])
const total = ref(0)

const query = reactive<{
  page: number
  pageSize: number
  action?: string
  resource?: string
}>({
  page: 1,
  pageSize: 20,
  action: undefined,
  resource: undefined,
})

const dateRange = ref<[string, string] | null>(null)

async function fetchData() {
  loading.value = true
  try {
    const res = await listOpLogs({
      page: query.page,
      pageSize: query.pageSize,
      action: query.action,
      resource: query.resource,
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1],
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
  query.action = undefined
  query.resource = undefined
  dateRange.value = null
  onSearch()
}

function prettyPayload(p: string | null) {
  if (!p) return '-'
  try {
    return JSON.stringify(JSON.parse(p), null, 2)
  }
  catch {
    return p
  }
}

onMounted(fetchData)
</script>

<template>
  <FaPageMain>
    <div class="flex flex-wrap gap-3 mb-4">
      <ElSelect
        v-model="query.action"
        placeholder="动作类型"
        clearable
        style="width: 150px"
      >
        <ElOption
          v-for="opt in ACTION_OPTIONS"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </ElSelect>
      <ElSelect
        v-model="query.resource"
        placeholder="资源类型"
        clearable
        style="width: 170px"
      >
        <ElOption
          v-for="(label, value) in RESOURCE_LABEL"
          :key="value"
          :label="label"
          :value="value"
        />
      </ElSelect>
      <ElDatePicker
        v-model="dateRange"
        type="daterange"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        style="width: 260px"
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
      empty-text="暂无日志"
    >
      <ElTableColumn label="ID" prop="id" width="70" />
      <ElTableColumn label="操作人" prop="adminUsername" width="120" show-overflow-tooltip />
      <ElTableColumn label="动作" width="110">
        <template #default="{ row }">
          <ElTag :type="ACTION_TAG[row.action] ?? 'info'" effect="light" size="small">
            {{ actionLabel(row.action) }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="资源" width="140">
        <template #default="{ row }">
          {{ resourceLabel(row.resource) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="目标" prop="target" width="120" show-overflow-tooltip />
      <ElTableColumn label="上下文" min-width="120">
        <template #default="{ row }">
          <ElPopover
            v-if="row.payload"
            placement="left"
            :width="380"
            trigger="hover"
          >
            <template #reference>
              <ElButton link type="primary" size="small">
                查看
              </ElButton>
            </template>
            <pre class="text-xs overflow-auto max-h-80 whitespace-pre-wrap">{{ prettyPayload(row.payload) }}</pre>
          </ElPopover>
          <span v-else class="text-xs text-muted-foreground">-</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="IP" prop="ip" width="140" show-overflow-tooltip />
      <ElTableColumn label="时间" width="170">
        <template #default="{ row }">
          {{ new Date(row.createdAt).toLocaleString() }}
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
  </FaPageMain>
</template>
