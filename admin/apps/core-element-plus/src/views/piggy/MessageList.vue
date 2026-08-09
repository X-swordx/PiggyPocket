<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import {
  ElButton, ElDialog, ElForm, ElFormItem, ElInput, ElInputNumber,
  ElMessage, ElOption, ElPagination, ElPopconfirm, ElSelect, ElSwitch,
  ElTable, ElTableColumn, type FormInstance,
} from 'element-plus'
import {
  listMessages, createMessage, updateMessage, setMessageEnabled, removeMessage,
  type AdminMessage,
} from '@/api/modules/piggy'

defineOptions({ name: 'MessageList' })

/** 小程序端使用 uni-icons，这里只开放抽屉里适用的几个图标。 */
const ICON_OPTIONS = [
  { label: '公告（喇叭）', value: 'sound-filled' },
  { label: '提醒（时钟）', value: 'clock' },
  { label: '进度（星标）', value: 'star-filled' },
  { label: '收藏（爱心）', value: 'heart-filled' },
  { label: '提示（感叹号）', value: 'info-filled' },
  { label: '清单', value: 'list' },
]

const loading = ref(false)
const list = ref<AdminMessage[]>([])
const total = ref(0)

const query = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
})

async function fetchData() {
  loading.value = true
  try {
    const res = await listMessages({
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

// ============ 新建 / 编辑 ============
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const submitting = ref(false)

const form = reactive({
  title: '',
  content: '',
  icon: 'sound-filled',
  bgColor: '#ffc2cc',
  sort: 0,
  enabled: 1,
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
}

function openCreate() {
  editingId.value = null
  form.title = ''
  form.content = ''
  form.icon = 'sound-filled'
  form.bgColor = '#ffc2cc'
  form.sort = 0
  form.enabled = 1
  dialogVisible.value = true
}

function openEdit(row: AdminMessage) {
  editingId.value = row.id
  form.title = row.title
  form.content = row.content
  form.icon = row.icon
  form.bgColor = row.bgColor
  form.sort = row.sort
  form.enabled = row.enabled
  dialogVisible.value = true
}

async function onSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (editingId.value) {
      await updateMessage(editingId.value, { ...form })
      ElMessage.success('已更新')
    }
    else {
      await createMessage({ ...form })
      ElMessage.success('已创建')
    }
    dialogVisible.value = false
    fetchData()
  }
  finally {
    submitting.value = false
  }
}

async function onToggleEnabled(row: AdminMessage, val: number) {
  try {
    await setMessageEnabled(row.id, val)
    row.enabled = val
    ElMessage.success(val === 1 ? '已启用' : '已停用')
  }
  catch {
    // 失败保持原状态，switch 自动回弹
  }
}

async function onDelete(row: AdminMessage) {
  await removeMessage(row.id)
  ElMessage.success('已删除')
  fetchData()
}

onMounted(fetchData)
</script>

<template>
  <FaPageMain>
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <ElInput
        v-model="query.keyword"
        placeholder="按标题搜索"
        clearable
        style="width: 220px"
        @keyup.enter="onSearch"
      />
      <ElButton type="primary" @click="onSearch">
        搜索
      </ElButton>
      <span class="text-sm text-muted-foreground">
        小程序首页只展示「启用」的消息；新增消息后用户会看到未读小红点。
      </span>
      <div class="flex-1" />
      <ElButton type="primary" @click="openCreate">
        新增消息
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
      <ElTableColumn label="标题" prop="title" min-width="140" />
      <ElTableColumn label="内容" prop="content" min-width="240" show-overflow-tooltip />
      <ElTableColumn label="图标" width="140">
        <template #default="{ row }">
          <div class="flex items-center gap-2">
            <span
              class="inline-block w-4 h-4 rounded"
              :style="{ backgroundColor: row.bgColor }"
            />
            <span class="text-xs">{{ row.icon }}</span>
          </div>
        </template>
      </ElTableColumn>
      <ElTableColumn label="排序" prop="sort" width="80" />
      <ElTableColumn label="启用" width="150">
        <template #default="{ row }">
          <ElSwitch
            :model-value="row.enabled === 1"
            active-text="启用"
            inactive-text="停用"
            @change="(v) => onToggleEnabled(row as AdminMessage, v ? 1 : 0)"
          />
        </template>
      </ElTableColumn>
      <ElTableColumn label="创建时间" width="170">
        <template #default="{ row }">
          {{ new Date(row.createdAt).toLocaleString() }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <ElButton link type="primary" @click="openEdit(row as AdminMessage)">
            编辑
          </ElButton>
          <ElPopconfirm
            title="确认删除该消息？"
            width="220"
            @confirm="onDelete(row as AdminMessage)"
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

    <ElDialog
      v-model="dialogVisible"
      :title="editingId ? '编辑消息' : '新增消息'"
      width="560px"
      destroy-on-close
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
        <ElFormItem label="标题" prop="title">
          <ElInput v-model="form.title" maxlength="100" show-word-limit />
        </ElFormItem>
        <ElFormItem label="内容" prop="content">
          <ElInput
            v-model="form.content"
            type="textarea"
            :rows="4"
            maxlength="2000"
            show-word-limit
          />
        </ElFormItem>
        <ElFormItem label="图标">
          <ElSelect v-model="form.icon" class="w-full">
            <ElOption
              v-for="opt in ICON_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="图标背景色">
          <ElInput v-model="form.bgColor" maxlength="20" placeholder="#ffc2cc" />
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber v-model="form.sort" :min="0" :max="9999" class="w-full" />
        </ElFormItem>
        <ElFormItem label="启用">
          <ElSwitch
            :model-value="form.enabled === 1"
            active-text="启用"
            inactive-text="停用"
            @change="(v) => (form.enabled = v ? 1 : 0)"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">
          取消
        </ElButton>
        <ElButton type="primary" :loading="submitting" @click="onSubmit">
          保存
        </ElButton>
      </template>
    </ElDialog>
  </FaPageMain>
</template>
