<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import {
  ElButton, ElInput, ElSelect, ElOption, ElTable, ElTableColumn,
  ElPagination, ElImage, ElTag, ElPopconfirm, ElMessage, ElMessageBox,
} from 'element-plus'
import {
  listExpiryItems, removeExpiryItem, removeExpiredItems,
  reindexExpiryItems, runExpiryReminder,
  type AdminExpiryItem, type ExpiryListQuery,
} from '@/api/modules/piggy'
import {
  EXPIRY_STATUS_OPTIONS, EXPIRY_STATUS_TAG_TYPE,
  STORAGE_OPTIONS, ITEM_CATEGORY_OPTIONS, labelOf,
} from './options'
import UserSelect from './components/UserSelect.vue'
import ExpiryItemEditor from './ExpiryItemEditor.vue'
import { usePiggyAuth } from './usePiggyAuth'

defineOptions({ name: 'ExpiryItemList' })

const { canEdit } = usePiggyAuth('admin.expiryFood:edit')

const loading = ref(false)
const list = ref<AdminExpiryItem[]>([])
const total = ref(0)

const query = reactive<Required<Pick<ExpiryListQuery, 'page' | 'pageSize'>> & ExpiryListQuery>({
  page: 1,
  pageSize: 20,
  keyword: '',
  status: undefined,
  userId: undefined,
})

async function fetchData() {
  loading.value = true
  try {
    const res = await listExpiryItems({
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword || undefined,
      status: query.status,
      userId: query.userId,
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
  onSearch()
}

// ================ 编辑弹窗 ================
const editorVisible = ref(false)
const editingId = ref<number | null>(null)

function onCreate() {
  editingId.value = null
  editorVisible.value = true
}

function onEdit(row: AdminExpiryItem) {
  editingId.value = row.id
  editorVisible.value = true
}

function onEditorSaved() {
  editorVisible.value = false
  fetchData()
}

// ================ 删除 ================
async function onDelete(row: AdminExpiryItem) {
  await removeExpiryItem(row.id)
  ElMessage.success('已删除')
  fetchData()
}

async function onBatchClean() {
  try {
    await ElMessageBox.confirm(
      query.userId
        ? '将清理该用户所有已过期物品，是否继续？'
        : '将清理系统内所有用户的已过期物品，是否继续？',
      '批量清理已过期',
      { type: 'warning' },
    )
  }
  catch {
    return
  }
  const res = await removeExpiredItems(query.userId)
  ElMessage.success(`已清理 ${res.affected} 条`)
  fetchData()
}

// ================ 运维操作 ================
const reindexing = ref(false)
const reminding = ref(false)

async function onReindex() {
  reindexing.value = true
  try {
    const res = await reindexExpiryItems()
    if (!res.enabled) {
      ElMessage.warning('向量库未配置，语义搜索当前降级为关键词匹配')
      return
    }
    ElMessage.success(`已索引 ${res.indexed}/${res.total} 条，失败 ${res.failed} 条`)
  }
  finally {
    reindexing.value = false
  }
}

async function onRunReminder() {
  reminding.value = true
  try {
    const res = await runExpiryReminder()
    ElMessage.success(`命中 ${res.candidates} 条，推送 ${res.sent} 人，跳过 ${res.skipped} 人`)
    fetchData()
  }
  finally {
    reminding.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <FaPageMain>
    <!-- 筛选栏 -->
    <div class="flex flex-wrap gap-3 mb-4">
      <ElInput
        v-model="query.keyword"
        placeholder="按名称模糊搜索"
        clearable
        style="width: 200px"
        @keyup.enter="onSearch"
      />
      <ElSelect
        v-model="query.status"
        placeholder="状态"
        clearable
        style="width: 140px"
      >
        <ElOption
          v-for="opt in EXPIRY_STATUS_OPTIONS"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </ElSelect>
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
      <ElButton v-if="canEdit" :loading="reindexing" @click="onReindex">
        重建向量索引
      </ElButton>
      <ElButton v-if="canEdit" :loading="reminding" @click="onRunReminder">
        立即执行提醒
      </ElButton>
      <ElButton v-if="canEdit" type="primary" @click="onCreate">
        新增物品
      </ElButton>
      <ElButton v-if="canEdit" type="danger" plain @click="onBatchClean">
        清理已过期
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
      <ElTableColumn label="ID" prop="id" width="60" />
      <ElTableColumn label="图片" width="76">
        <template #default="{ row }">
          <ElImage
            v-if="row.imageUrl"
            :src="row.imageUrl"
            :preview-src-list="[row.imageUrl]"
            preview-teleported
            fit="cover"
            style="width: 48px; height: 48px; border-radius: 6px"
          />
          <span v-else class="text-xs text-muted-foreground">无</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="名称" prop="name" min-width="140" show-overflow-tooltip />
      <ElTableColumn label="所属用户" width="90" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.userNickname ?? `#${row.userId}` }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="数量" prop="quantity" width="64" />
      <ElTableColumn label="存放" width="120">
        <template #default="{ row }">
          {{ labelOf(STORAGE_OPTIONS, row.storage) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="分类" width="96">
        <template #default="{ row }">
          {{ labelOf(ITEM_CATEGORY_OPTIONS, row.category) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="到期日" prop="expiryDate" width="105" />
      <ElTableColumn label="提醒" width="150">
        <template #default="{ row }">
          <div class="text-xs">
            {{ row.remindDays > 0 ? `提前 ${row.remindDays} 天` : '当天提醒' }}
          </div>
          <div class="text-xs text-muted-foreground">
            {{ row.notifiedAt ? `已推送 ${row.notifiedAt}` : '未推送' }}
          </div>
        </template>
      </ElTableColumn>
      <ElTableColumn label="状态" width="180">
        <template #default="{ row }">
          <ElTag
            :type="EXPIRY_STATUS_TAG_TYPE[row.status]"
            effect="light"
          >
            {{ row.statusText }} · {{ row.daysText }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <template v-if="canEdit">
            <ElButton link type="primary" @click="onEdit(row as AdminExpiryItem)">
              编辑
            </ElButton>
            <ElPopconfirm
              title="确认删除？"
              width="200"
              @confirm="onDelete(row as AdminExpiryItem)"
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

    <ExpiryItemEditor
      v-if="editorVisible"
      v-model:visible="editorVisible"
      :id="editingId"
      @saved="onEditorSaved"
    />
  </FaPageMain>
</template>
