<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import {
  ElButton, ElDialog, ElForm, ElFormItem, ElInput, ElInputNumber,
  ElMessage, ElPopconfirm, ElSwitch, ElTable, ElTableColumn, ElTabs,
  ElTabPane, type FormInstance,
} from 'element-plus'
import {
  listRecipeOptions, createRecipeOption, updateRecipeOption,
  setRecipeOptionEnabled, removeRecipeOption,
  type RecipeOption, type RecipeOptionType,
} from '@/api/modules/piggy'
import { usePiggyAuth } from './usePiggyAuth'

defineOptions({ name: 'RecipeOptionList' })

const { canEdit } = usePiggyAuth('admin.recipeOption:edit')

const TABS: Array<{ type: RecipeOptionType, label: string }> = [
  { type: 'ingredient', label: '食材' },
  { type: 'spicy', label: '辣度' },
  { type: 'preference', label: '口味偏好' },
  { type: 'taboo', label: '忌口' },
]

const activeType = ref<RecipeOptionType>('ingredient')
const loading = ref(false)
const list = ref<RecipeOption[]>([])

async function fetchData() {
  loading.value = true
  try {
    const res = await listRecipeOptions(activeType.value)
    list.value = res.list
  }
  finally {
    loading.value = false
  }
}

function onTabChange(name: string | number) {
  activeType.value = name as RecipeOptionType
  fetchData()
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
  name: [{ required: true, message: '请输入选项名称', trigger: 'blur' }],
}

function onCreate() {
  editingId.value = null
  form.name = ''
  form.sort = 0
  dialogVisible.value = true
}

function onEdit(row: RecipeOption) {
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
      await updateRecipeOption(editingId.value, { name: form.name, sort: form.sort })
    else
      await createRecipeOption({ type: activeType.value, name: form.name, sort: form.sort })

    ElMessage.success('已保存')
    dialogVisible.value = false
    fetchData()
  }
  finally {
    submitting.value = false
  }
}

async function onToggleEnabled(row: RecipeOption, val: number) {
  try {
    await setRecipeOptionEnabled(row.id, val)
    row.enabled = val
    ElMessage.success(val === 1 ? '已启用' : '已停用')
  }
  catch {
    // 失败保持原状态，switch 自动回弹
  }
}

async function onDelete(row: RecipeOption) {
  await removeRecipeOption(row.id)
  ElMessage.success('已删除')
  fetchData()
}

onMounted(fetchData)
</script>

<template>
  <FaPageMain>
    <ElTabs :model-value="activeType" @tab-change="onTabChange">
      <ElTabPane
        v-for="tab in TABS"
        :key="tab.type"
        :label="tab.label"
        :name="tab.type"
      />
    </ElTabs>

    <div class="flex items-center gap-3 mb-4">
      <span class="text-sm text-muted-foreground">
        小程序「灵感菜谱」页展示当前分类下「启用」的选项，用户也可以自行输入；停用后对老菜品无影响。
      </span>
      <div class="flex-1" />
      <ElButton v-if="canEdit" type="primary" @click="onCreate">
        新增选项
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
      <ElTableColumn label="ID" prop="id" width="80" />
      <ElTableColumn label="名称" prop="name" min-width="200" />
      <ElTableColumn label="排序" prop="sort" width="100" />
      <ElTableColumn label="启用" width="150">
        <template #default="{ row }">
          <ElSwitch
            :model-value="row.enabled === 1"
            :disabled="!canEdit"
            active-text="启用"
            inactive-text="停用"
            @change="(v) => onToggleEnabled(row as RecipeOption, v ? 1 : 0)"
          />
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <template v-if="canEdit">
            <ElButton link type="primary" @click="onEdit(row as RecipeOption)">
              编辑
            </ElButton>
            <ElPopconfirm
              title="确认删除？"
              width="200"
              @confirm="onDelete(row as RecipeOption)"
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
      :title="editingId ? '编辑选项' : `新增选项（${TABS.find(t => t.type === activeType)?.label}）`"
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
