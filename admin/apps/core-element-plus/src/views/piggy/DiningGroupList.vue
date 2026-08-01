<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import {
  ElButton, ElInput, ElTable, ElTableColumn, ElPagination,
  ElPopconfirm, ElMessage, ElMessageBox,
} from 'element-plus'
import {
  listDiningGroups, removeDiningGroup, createDiningGroup, updateDiningGroup,
  type AdminDiningGroup,
} from '@/api/modules/piggy'
import UserSelect from './components/UserSelect.vue'
import DiningGroupMembers from './DiningGroupMembers.vue'
import { usePiggyAuth } from './usePiggyAuth'

defineOptions({ name: 'DiningGroupList' })

const { canEdit } = usePiggyAuth('admin.diningGroup:edit')

const loading = ref(false)
const list = ref<AdminDiningGroup[]>([])
const total = ref(0)

const query = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
})

async function fetchData() {
  loading.value = true
  try {
    const res = await listDiningGroups({
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

// ============ 新建 ============
const createVisible = ref(false)
const createForm = reactive<{ name: string; creatorId: number | null }>({
  name: '',
  creatorId: null,
})

function openCreate() {
  createForm.name = ''
  createForm.creatorId = null
  createVisible.value = true
}

async function onCreate() {
  if (!createForm.name.trim()) {
    ElMessage.warning('请输入组名')
    return
  }
  if (!createForm.creatorId) {
    ElMessage.warning('请选择创建者')
    return
  }
  await createDiningGroup({
    name: createForm.name.trim(),
    creatorId: createForm.creatorId,
  })
  ElMessage.success('已创建')
  createVisible.value = false
  fetchData()
}

// ============ 改名 ============
async function onRename(row: AdminDiningGroup) {
  try {
    const { value } = await ElMessageBox.prompt('新的组名', '重命名', {
      inputValue: row.name,
      inputPattern: /\S/,
      inputErrorMessage: '组名不能为空',
    })
    await updateDiningGroup(row.id, { name: value })
    ElMessage.success('已更新')
    fetchData()
  }
  catch {
    // 用户取消
  }
}

async function onDelete(row: AdminDiningGroup) {
  await removeDiningGroup(row.id)
  ElMessage.success('已删除')
  fetchData()
}

// ============ 成员抽屉 ============
const memberVisible = ref(false)
const currentGroup = ref<AdminDiningGroup | null>(null)

function onManageMembers(row: AdminDiningGroup) {
  currentGroup.value = row
  memberVisible.value = true
}

function onMemberChanged() {
  fetchData()
}

onMounted(fetchData)
</script>

<template>
  <FaPageMain>
    <div class="flex flex-wrap gap-3 mb-4">
      <ElInput
        v-model="query.keyword"
        placeholder="按组名搜索"
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
      <div class="flex-1" />
      <ElButton v-if="canEdit" type="primary" @click="openCreate">
        新建饭搭子
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
      <ElTableColumn label="组名" prop="name" min-width="180" show-overflow-tooltip />
      <ElTableColumn label="创建者" width="120" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.creatorNickname ?? `#${row.creatorId}` }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="成员数" prop="memberCount" width="90" />
      <ElTableColumn label="创建时间" width="170">
        <template #default="{ row }">
          {{ new Date(row.createdAt).toLocaleString() }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="230" fixed="right">
        <template #default="{ row }">
          <ElButton link type="primary" @click="onManageMembers(row as AdminDiningGroup)">
            成员
          </ElButton>
          <template v-if="canEdit">
            <ElButton link @click="onRename(row as AdminDiningGroup)">
              改名
            </ElButton>
            <ElPopconfirm
              title="解散该组？成员会被一并移除，关联订单与菜品的分组将清空。"
              width="280"
              @confirm="onDelete(row as AdminDiningGroup)"
            >
              <template #reference>
                <ElButton link type="danger">
                  解散
                </ElButton>
              </template>
            </ElPopconfirm>
          </template>
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

    <!-- 新建对话框（简洁版，直接内嵌） -->
    <el-dialog v-model="createVisible" title="新建饭搭子" width="480px">
      <el-form label-width="80px">
        <el-form-item label="组名" required>
          <ElInput v-model="createForm.name" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="创建者" required>
          <UserSelect v-model="createForm.creatorId" />
        </el-form-item>
      </el-form>
      <template #footer>
        <ElButton @click="createVisible = false">
          取消
        </ElButton>
        <ElButton type="primary" @click="onCreate">
          创建
        </ElButton>
      </template>
    </el-dialog>

    <DiningGroupMembers
      v-if="memberVisible && currentGroup"
      v-model:visible="memberVisible"
      :group="currentGroup"
      @changed="onMemberChanged"
    />
  </FaPageMain>
</template>
