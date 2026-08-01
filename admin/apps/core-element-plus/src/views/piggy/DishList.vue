<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import {
  ElButton, ElInput, ElSelect, ElOption, ElTable, ElTableColumn,
  ElPagination, ElImage, ElTag, ElPopconfirm, ElMessage, ElSwitch,
} from 'element-plus'
import {
  listDishes, removeDish, setDishStatus,
  type AdminDish, type DishListQuery,
} from '@/api/modules/piggy'
import { DISH_CATEGORY_OPTIONS, DISH_STATUS_OPTIONS, labelOf } from './options'
import UserSelect from './components/UserSelect.vue'
import DishEditor from './DishEditor.vue'
import { usePiggyAuth } from './usePiggyAuth'

defineOptions({ name: 'DishList' })

const { canEdit } = usePiggyAuth('admin.dish:edit')

const loading = ref(false)
const list = ref<AdminDish[]>([])
const total = ref(0)

const query = reactive<Required<Pick<DishListQuery, 'page' | 'pageSize'>> & DishListQuery>({
  page: 1,
  pageSize: 20,
  keyword: '',
  category: undefined,
  status: undefined,
  userId: undefined,
})

async function fetchData() {
  loading.value = true
  try {
    const res = await listDishes({
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword || undefined,
      category: query.category,
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
  query.category = undefined
  query.status = undefined
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

function onEdit(row: AdminDish) {
  editingId.value = row.id
  editorVisible.value = true
}

function onEditorSaved() {
  editorVisible.value = false
  fetchData()
}

async function onDelete(row: AdminDish) {
  await removeDish(row.id)
  ElMessage.success('已删除')
  fetchData()
}

async function onToggleStatus(row: AdminDish, val: number) {
  try {
    await setDishStatus(row.id, val)
    row.status = val
    ElMessage.success(val === 1 ? '已上架' : '已下架')
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
        placeholder="按名称模糊搜索"
        clearable
        style="width: 200px"
        @keyup.enter="onSearch"
      />
      <ElSelect
        v-model="query.category"
        placeholder="分类"
        clearable
        style="width: 140px"
      >
        <ElOption
          v-for="opt in DISH_CATEGORY_OPTIONS"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </ElSelect>
      <ElSelect
        v-model="query.status"
        placeholder="上下架状态"
        clearable
        style="width: 140px"
      >
        <ElOption
          v-for="opt in DISH_STATUS_OPTIONS"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </ElSelect>
      <div style="width: 220px">
        <UserSelect v-model="query.userId" placeholder="按创建人过滤" />
      </div>
      <ElButton type="primary" @click="onSearch">
        搜索
      </ElButton>
      <ElButton @click="onReset">
        重置
      </ElButton>
      <div class="flex-1" />
      <ElButton v-if="canEdit" type="primary" @click="onCreate">
        新增菜品
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
      <ElTableColumn label="封面" width="76">
        <template #default="{ row }">
          <ElImage
            v-if="row.image"
            :src="row.image"
            :preview-src-list="[row.image]"
            preview-teleported
            fit="cover"
            style="width: 48px; height: 48px; border-radius: 6px"
          />
          <span v-else class="text-xs text-muted-foreground">无</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="名称" prop="name" min-width="140" show-overflow-tooltip />
      <ElTableColumn label="分类" width="80">
        <template #default="{ row }">
          {{ labelOf(DISH_CATEGORY_OPTIONS, row.category) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="创建人" width="90" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.userNickname ?? `#${row.userId}` }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="分组" width="64">
        <template #default="{ row }">
          {{ row.groupId ?? '-' }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="热量" prop="calories" width="70" />
      <ElTableColumn label="标签" min-width="160">
        <template #default="{ row }">
          <div class="flex flex-wrap gap-1">
            <ElTag
              v-for="t in (row.tags ?? [])"
              :key="t"
              size="small"
              effect="light"
            >
              {{ t }}
            </ElTag>
            <span v-if="!row.tags?.length" class="text-xs text-muted-foreground">-</span>
          </div>
        </template>
      </ElTableColumn>
      <ElTableColumn label="状态" width="150">
        <template #default="{ row }">
          <ElSwitch
            :model-value="row.status === 1"
            :disabled="!canEdit"
            active-text="上架"
            inactive-text="下架"
            @change="(v) => onToggleStatus(row as AdminDish, v ? 1 : 0)"
          />
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <template v-if="canEdit">
            <ElButton link type="primary" @click="onEdit(row as AdminDish)">
              编辑
            </ElButton>
            <ElPopconfirm
              title="确认删除？"
              width="200"
              @confirm="onDelete(row as AdminDish)"
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

    <DishEditor
      v-if="editorVisible"
      v-model:visible="editorVisible"
      :id="editingId"
      @saved="onEditorSaved"
    />
  </FaPageMain>
</template>
