<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import {
  ElButton, ElInput, ElSelect, ElOption, ElTable, ElTableColumn,
  ElPagination, ElTag, ElPopconfirm, ElMessage, ElDatePicker,
} from 'element-plus'
import {
  listOrders, removeOrder,
  type AdminOrder, type OrderListQuery,
} from '@/api/modules/piggy'
import {
  ORDER_STATUS_OPTIONS, ORDER_STATUS_TAG_TYPE, labelOf,
} from './options'
import UserSelect from './components/UserSelect.vue'
import OrderDetail from './OrderDetail.vue'
import { usePiggyAuth } from './usePiggyAuth'

defineOptions({ name: 'OrderList' })

const { canEdit } = usePiggyAuth('admin.order:edit')

const loading = ref(false)
const list = ref<AdminOrder[]>([])
const total = ref(0)

const query = reactive<Required<Pick<OrderListQuery, 'page' | 'pageSize'>> & OrderListQuery>({
  page: 1,
  pageSize: 20,
  keyword: '',
  status: undefined,
  userId: undefined,
})

const dateRange = ref<[string, string] | null>(null)

async function fetchData() {
  loading.value = true
  try {
    const res = await listOrders({
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword || undefined,
      status: query.status,
      userId: query.userId,
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
  query.keyword = ''
  query.status = undefined
  query.userId = undefined
  dateRange.value = null
  onSearch()
}

// ================ 详情抽屉 ================
const detailVisible = ref(false)
const currentId = ref<number | null>(null)

function onView(row: AdminOrder) {
  currentId.value = row.id
  detailVisible.value = true
}

function onDetailSaved() {
  detailVisible.value = false
  fetchData()
}

async function onDelete(row: AdminOrder) {
  await removeOrder(row.id)
  ElMessage.success('已删除')
  fetchData()
}

const statusLabel = (s: string) => labelOf(ORDER_STATUS_OPTIONS as any, s)

onMounted(fetchData)
</script>

<template>
  <FaPageMain>
    <div class="flex flex-wrap gap-3 mb-4">
      <ElInput
        v-model="query.keyword"
        placeholder="按订单号搜索"
        clearable
        style="width: 220px"
        @keyup.enter="onSearch"
      />
      <ElSelect
        v-model="query.status"
        placeholder="状态"
        clearable
        style="width: 140px"
      >
        <ElOption
          v-for="opt in ORDER_STATUS_OPTIONS"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </ElSelect>
      <div style="width: 220px">
        <UserSelect v-model="query.userId" placeholder="按下单人过滤" />
      </div>
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
      empty-text="暂无数据"
    >
      <ElTableColumn label="订单号" prop="orderNo" min-width="180" show-overflow-tooltip />
      <ElTableColumn label="下单人" width="100" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.userNickname ?? `#${row.userId}` }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="分组" width="120" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.groupName ?? (row.groupId ? `#${row.groupId}` : '-') }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="状态" width="100">
        <template #default="{ row }">
          <ElTag :type="ORDER_STATUS_TAG_TYPE[row.status]" effect="light">
            {{ statusLabel(row.status) }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="菜品数" prop="itemCount" width="80" />
      <ElTableColumn label="备注" prop="remark" min-width="140" show-overflow-tooltip />
      <ElTableColumn label="创建时间" width="170">
        <template #default="{ row }">
          {{ new Date(row.createdAt).toLocaleString() }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <ElButton link type="primary" @click="onView(row as AdminOrder)">
            详情
          </ElButton>
          <ElPopconfirm
            v-if="canEdit"
            title="删除订单及所有子项？"
            width="220"
            @confirm="onDelete(row as AdminOrder)"
          >
            <template #reference>
              <ElButton link type="danger">
                删除
              </ElButton>
            </template>
          </ElPopconfirm>
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

    <OrderDetail
      v-if="detailVisible"
      v-model:visible="detailVisible"
      :id="currentId"
      @saved="onDetailSaved"
    />
  </FaPageMain>
</template>
