<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import {
  ElButton, ElInput, ElSelect, ElOption, ElTable, ElTableColumn,
  ElPagination, ElTag, ElPopconfirm, ElMessage, ElDatePicker,
} from 'element-plus'
import {
  listPoopRecords, removePoopRecord,
  type AdminPoopRecord, type PoopListQuery,
} from '@/api/modules/piggy'
import { BRISTOL_OPTIONS, BRISTOL_EMOJI, BRISTOL_TAG_TYPE } from './options'
import UserSelect from './components/UserSelect.vue'
import PoopRecordEditor from './PoopRecordEditor.vue'
import { usePiggyAuth } from './usePiggyAuth'

defineOptions({ name: 'PoopRecordList' })

const { canEdit } = usePiggyAuth('admin.poop:edit')

const loading = ref(false)
const list = ref<AdminPoopRecord[]>([])
const total = ref(0)

const query = reactive<Required<Pick<PoopListQuery, 'page' | 'pageSize'>> & PoopListQuery>({
  page: 1,
  pageSize: 20,
  keyword: '',
  bristolType: undefined,
  userId: undefined,
  startDate: undefined,
  endDate: undefined,
})

const dateRange = ref<[string, string] | null>(null)

async function fetchData() {
  loading.value = true
  try {
    const res = await listPoopRecords({
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword || undefined,
      bristolType: query.bristolType,
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
  query.bristolType = undefined
  query.userId = undefined
  dateRange.value = null
  onSearch()
}

/** ISO 时间转东八区墙时间展示 */
function beijingWall(iso: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

// ================ 编辑弹窗 ================
const editorVisible = ref(false)
const editingId = ref<number | null>(null)

function onCreate() {
  editingId.value = null
  editorVisible.value = true
}

function onEdit(row: AdminPoopRecord) {
  editingId.value = row.id
  editorVisible.value = true
}

function onEditorSaved() {
  editorVisible.value = false
  fetchData()
}

// ================ 删除 ================
async function onDelete(row: AdminPoopRecord) {
  await removePoopRecord(row.id)
  ElMessage.success('已删除')
  fetchData()
}

onMounted(fetchData)
</script>

<template>
  <FaPageMain>
    <!-- 筛选栏 -->
    <div class="flex flex-wrap gap-3 mb-4">
      <ElInput
        v-model="query.keyword"
        placeholder="按备注模糊搜索"
        clearable
        style="width: 200px"
        @keyup.enter="onSearch"
      />
      <ElSelect
        v-model="query.bristolType"
        placeholder="布里斯托分型"
        clearable
        style="width: 160px"
      >
        <ElOption
          v-for="opt in BRISTOL_OPTIONS"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </ElSelect>
      <ElDatePicker
        v-model="dateRange"
        type="daterange"
        value-format="YYYY-MM-DD"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
      />
      <div style="width: 220px">
        <UserSelect v-model="query.userId" placeholder="按用户过滤" />
      </div>
      <ElButton type="primary" @click="onSearch">
        搜索
      </ElButton>
      <ElButton @click="onReset">
        重置
      </ElButton>
      <div class="flex-1" />
      <ElButton v-if="canEdit" type="primary" @click="onCreate">
        新增记录
      </ElButton>
    </div>

    <!-- 表格 -->
    <ElTable
      v-loading="loading"
      :data="list"
      border
      stripe
      row-key="id"
      empty-text="暂无数据"
    >
      <ElTableColumn label="ID" prop="id" width="70" />
      <ElTableColumn label="所属用户" width="120" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.userNickname ?? `#${row.userId}` }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="日历日" prop="recordDate" width="120" />
      <ElTableColumn label="排便时间（北京）" width="170">
        <template #default="{ row }">
          {{ beijingWall(row.occurredAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="分型" width="130">
        <template #default="{ row }">
          <ElTag :type="BRISTOL_TAG_TYPE[row.bristolType]" effect="light">
            {{ BRISTOL_EMOJI[row.bristolType] }} {{ row.bristolType }}型
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="备注" prop="notes" min-width="160" show-overflow-tooltip />
      <ElTableColumn label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <template v-if="canEdit">
            <ElButton link type="primary" @click="onEdit(row as AdminPoopRecord)">
              编辑
            </ElButton>
            <ElPopconfirm
              title="确认删除？"
              width="200"
              @confirm="onDelete(row as AdminPoopRecord)"
            >
              <template #reference>
                <ElButton link type="danger">
                  删除
                </ElButton>
              </template>
            </ElPopconfirm>
          </template>
          <span v-else class="text-xs text-muted-foreground">只读</span>
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

    <PoopRecordEditor
      v-if="editorVisible"
      v-model:visible="editorVisible"
      :id="editingId"
      @saved="onEditorSaved"
    />
  </FaPageMain>
</template>
