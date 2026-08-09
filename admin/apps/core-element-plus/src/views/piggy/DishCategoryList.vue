<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import {
  ElButton, ElDialog, ElForm, ElFormItem, ElInput, ElInputNumber,
  ElMessage, ElPopconfirm, ElSwitch, ElTable, ElTableColumn, type FormInstance,
} from 'element-plus'
import {
  listDishCategories, createDishCategory, updateDishCategory,
  setDishCategoryEnabled, removeDishCategory,
  type DishCategory,
} from '@/api/modules/piggy'
import { usePiggyAuth } from './usePiggyAuth'

defineOptions({ name: 'DishCategoryList' })

const { canEdit } = usePiggyAuth('admin.dishCategory:edit')

const loading = ref(false)
const list = ref<DishCategory[]>([])

async function fetchData() {
  loading.value = true
  try {
    const res = await listDishCategories()
    list.value = res.list
  }
  finally {
    loading.value = false
  }
}

// ================ 新增 / 编辑 ================
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  name: '',
  sort: 0,
})

const rules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
}

function onCreate() {
  editingId.value = null
  form.name = ''
  form.sort = 0
  dialogVisible.value = true
}

function onEdit(row: DishCategory) {
  editingId.value = row.id
  form.name = row.name
  form.sort = row.sort
  dialogVisible.value = true
}

async function onSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (editingId.value)
      await updateDishCategory(editingId.value, { name: form.name, sort: form.sort })
    else
      await createDishCategory({ name: form.name, sort: form.sort })

    ElMessage.success('已保存')
    dialogVisible.value = false
    fetchData()
  }
  finally {
    submitting.value = false
  }
}

async function onToggleEnabled(row: DishCategory, val: number) {
  try {
    await setDishCategoryEnabled(row.id, val)
    row.enabled = val
    ElMessage.success(val === 1 ? '已启用' : '已停用')
  }
  catch {
    // 失败保持原状态，switch 自动回弹
  }
}

async function onDelete(row: DishCategory) {
  await removeDishCategory(row.id)
  ElMessage.success('已删除')
  fetchData()
}

onMounted(fetchData)
</script>

<template>
  <FaPageMain>
    <div class="flex items-center gap-3 mb-4">
      <span class="text-sm text-muted-foreground">
        小程序上传菜谱与菜单筛选只会展示「启用」的分类；已被菜品使用的分类不能删除，请改为停用。
      </span>
      <div class="flex-1" />
      <ElButton v-if="canEdit" type="primary" @click="onCreate">
        新增分类
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
      <ElTableColumn label="分类名称" prop="name" min-width="160" />
      <ElTableColumn label="排序" prop="sort" width="80" />
      <ElTableColumn label="启用" width="150">
        <template #default="{ row }">
          <ElSwitch
            :model-value="row.enabled === 1"
            :disabled="!canEdit"
            active-text="启用"
            inactive-text="停用"
            @change="(v) => onToggleEnabled(row as DishCategory, v ? 1 : 0)"
          />
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <template v-if="canEdit">
            <ElButton link type="primary" @click="onEdit(row as DishCategory)">
              编辑
            </ElButton>
            <ElPopconfirm
              title="确认删除？"
              width="200"
              @confirm="onDelete(row as DishCategory)"
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

    <ElDialog
      v-model="dialogVisible"
      :title="editingId ? '编辑分类' : '新增分类'"
      width="420px"
    >
      <ElForm
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <ElFormItem label="名称" prop="name">
          <ElInput v-model="form.name" maxlength="50" show-word-limit />
        </ElFormItem>
        <ElFormItem label="排序">
          <ElInputNumber v-model="form.sort" :min="0" :max="9999" class="w-full" />
        </ElFormItem>
      </ElForm>

      <template #footer>
        <div class="flex justify-end gap-2">
          <ElButton @click="dialogVisible = false">
            取消
          </ElButton>
          <ElButton type="primary" :loading="submitting" @click="onSubmit">
            保存
          </ElButton>
        </div>
      </template>
    </ElDialog>
  </FaPageMain>
</template>
