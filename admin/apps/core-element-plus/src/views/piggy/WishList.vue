<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import {
  ElButton, ElInput, ElSelect, ElOption, ElTable, ElTableColumn,
  ElPagination, ElTag, ElPopconfirm, ElMessage, ElSwitch,
} from 'element-plus'
import {
  listWishes, removeWish, toggleWishCompleted,
  type AdminWish, type WishListQuery,
} from '@/api/modules/piggy'
import { WISH_CATEGORY_OPTIONS, labelOf } from './options'
import UserSelect from './components/UserSelect.vue'
import WishEditor from './WishEditor.vue'
import { usePiggyAuth } from './usePiggyAuth'

defineOptions({ name: 'WishList' })

const { canEdit } = usePiggyAuth('admin.wish:edit')

const loading = ref(false)
const list = ref<AdminWish[]>([])
const total = ref(0)

const query = reactive<Required<Pick<WishListQuery, 'page' | 'pageSize'>> & WishListQuery>({
  page: 1,
  pageSize: 20,
  keyword: '',
  completed: undefined,
  category: undefined,
  userId: undefined,
})

const completedOptions = [
  { label: '未完成', value: false },
  { label: '已完成', value: true },
]

async function fetchData() {
  loading.value = true
  try {
    const res = await listWishes({
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword || undefined,
      completed: query.completed,
      category: query.category,
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
  query.completed = undefined
  query.category = undefined
  query.userId = undefined
  onSearch()
}

// ================ 编辑 ================
const editorVisible = ref(false)
const editingId = ref<number | null>(null)

function onCreate() {
  editingId.value = null
  editorVisible.value = true
}

function onEdit(row: AdminWish) {
  editingId.value = row.id
  editorVisible.value = true
}

function onEditorSaved() {
  editorVisible.value = false
  fetchData()
}

async function onDelete(row: AdminWish) {
  await removeWish(row.id)
  ElMessage.success('已删除')
  fetchData()
}

async function onToggleCompleted(row: AdminWish, val: boolean) {
  try {
    await toggleWishCompleted(row.id, val)
    row.completed = val
    ElMessage.success(val ? '已标记完成' : '已恢复为未完成')
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
        placeholder="按标题模糊搜索"
        clearable
        style="width: 200px"
        @keyup.enter="onSearch"
      />
      <ElSelect
        v-model="query.completed"
        placeholder="完成状态"
        clearable
        style="width: 140px"
      >
        <ElOption
          v-for="opt in completedOptions"
          :key="String(opt.value)"
          :label="opt.label"
          :value="opt.value"
        />
      </ElSelect>
      <ElSelect
        v-model="query.category"
        placeholder="分类"
        clearable
        style="width: 140px"
      >
        <ElOption
          v-for="opt in WISH_CATEGORY_OPTIONS"
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
      <ElButton v-if="canEdit" type="primary" @click="onCreate">
        新增心愿
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
      <ElTableColumn label="ID" prop="id" width="60" />
      <ElTableColumn label="标题" prop="title" min-width="180" show-overflow-tooltip />
      <ElTableColumn label="所属用户" width="90" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.userNickname ?? `#${row.userId}` }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="分类" width="80">
        <template #default="{ row }">
          {{ labelOf(WISH_CATEGORY_OPTIONS, row.category) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="标签样式" width="100">
        <template #default="{ row }">
          <ElTag effect="plain">
            {{ row.tagClass || '-' }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="筛选序号" prop="filter" width="88" />
      <ElTableColumn label="状态" width="190">
        <template #default="{ row }">
          <ElSwitch
            :model-value="row.completed"
            :disabled="!canEdit"
            active-text="已完成"
            inactive-text="未完成"
            @change="(v) => onToggleCompleted(row as AdminWish, v as boolean)"
          />
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <template v-if="canEdit">
            <ElButton link type="primary" @click="onEdit(row as AdminWish)">
              编辑
            </ElButton>
            <ElPopconfirm
              title="确认删除？"
              width="200"
              @confirm="onDelete(row as AdminWish)"
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

    <WishEditor
      v-if="editorVisible"
      v-model:visible="editorVisible"
      :id="editingId"
      @saved="onEditorSaved"
    />
  </FaPageMain>
</template>
