<script setup lang="ts">
import { ref, watch, reactive, onMounted } from 'vue'
import {
  ElDrawer, ElForm, ElFormItem, ElInput, ElInputNumber, ElSelect,
  ElOption, ElButton, ElMessage, ElRadioGroup, ElRadioButton,
  type FormInstance,
} from 'element-plus'
import {
  getDish, createDish, updateDish, listDishCategories,
  type DishIngredient, type DishCategory,
} from '@/api/modules/piggy'
import UserSelect from './components/UserSelect.vue'
import GroupSelect from './components/GroupSelect.vue'
import ImageUpload from './components/ImageUpload.vue'

const props = defineProps<{
  visible: boolean
  id: number | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'saved'): void
}>()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const initialUserNickname = ref<string | null>(null)

interface DishForm {
  userId?: number
  groupId?: number
  name: string
  description: string
  categoryId?: number
  image: string
  status: number
  calories?: number
  cookingTime: string
  ingredients: DishIngredient[]
  steps: string[]
  bgColor: string
}

const form = reactive<DishForm>({
  userId: undefined,
  groupId: undefined,
  name: '',
  description: '',
  categoryId: undefined,
  image: '',
  status: 1,
  calories: undefined,
  cookingTime: '',
  ingredients: [],
  steps: [],
  bgColor: '',
})

const rules = {
  userId: [{ required: true, message: '请选择创建人', trigger: 'change' }],
  groupId: [{ required: true, message: '请选择所属分组', trigger: 'change' }],
  name: [{ required: true, message: '请输入菜品名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择菜品分类', trigger: 'change' }],
}

const categories = ref<DishCategory[]>([])

onMounted(async () => {
  const res = await listDishCategories()
  categories.value = res.list
})

watch(
  () => [props.visible, props.id] as const,
  async ([v, id]) => {
    if (!v) return
    reset()
    if (id) {
      const dish = await getDish(id)
      Object.assign(form, {
        userId: dish.userId,
        groupId: dish.groupId ?? undefined,
        name: dish.name,
        description: dish.description ?? '',
        categoryId: dish.categoryId ?? undefined,
        image: dish.image ?? '',
        status: dish.status,
        calories: dish.calories,
        cookingTime: dish.cookingTime ?? '',
        ingredients: dish.ingredients ? [...dish.ingredients] : [],
        steps: dish.steps ? [...dish.steps] : [],
        bgColor: dish.bgColor ?? '',
      })
      initialUserNickname.value = dish.userNickname
    }
  },
  { immediate: true },
)

function reset() {
  form.userId = undefined
  form.groupId = undefined
  form.name = ''
  form.description = ''
  form.categoryId = undefined
  form.image = ''
  form.status = 1
  form.calories = undefined
  form.cookingTime = ''
  form.ingredients = []
  form.steps = []
  form.bgColor = ''
  initialUserNickname.value = null
}

// ============ 食材 ============
function addIngredient() {
  form.ingredients.push({ name: '', amount: '' })
}
function removeIngredient(idx: number) {
  form.ingredients.splice(idx, 1)
}

// ============ 步骤 ============
function addStep() {
  form.steps.push('')
}
function removeStep(idx: number) {
  form.steps.splice(idx, 1)
}
function moveStep(idx: number, delta: -1 | 1) {
  const target = idx + delta
  if (target < 0 || target >= form.steps.length) return
  const t = form.steps[idx]
  form.steps[idx] = form.steps[target]
  form.steps[target] = t
}

async function onSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    // 清理空的食材/步骤
    const payload = {
      ...form,
      ingredients: form.ingredients.filter((i) => i.name.trim()),
      steps: form.steps.filter((s) => s.trim()),
    }
    if (props.id) {
      const { userId, groupId, ...rest } = payload
      await updateDish(props.id, rest)
      ElMessage.success('已更新')
    }
    else {
      await createDish(payload)
      ElMessage.success('已创建')
    }
    emit('saved')
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <ElDrawer
    :model-value="visible"
    :title="id ? '编辑菜品' : '新增菜品'"
    size="720px"
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
  >
    <ElForm
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="90px"
    >
      <div class="grid grid-cols-2 gap-x-4">
        <ElFormItem label="创建人" prop="userId">
          <UserSelect
            v-model="form.userId"
            :disabled="!!id"
            :initial-label="initialUserNickname"
          />
        </ElFormItem>
        <ElFormItem label="所属分组" prop="groupId">
          <GroupSelect
            v-model="form.groupId"
            :disabled="!!id"
            :clearable="false"
          />
        </ElFormItem>
        <ElFormItem label="名称" prop="name">
          <ElInput v-model="form.name" maxlength="100" show-word-limit />
        </ElFormItem>
        <ElFormItem label="分类" prop="categoryId">
          <ElSelect v-model="form.categoryId" class="w-full">
            <ElOption
              v-for="opt in categories.filter((c) => c.enabled === 1 || c.id === form.categoryId)"
              :key="opt.id"
              :label="opt.enabled === 1 ? opt.name : `${opt.name}（停用）`"
              :value="opt.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="热量">
          <ElInputNumber v-model="form.calories" :min="0" :max="9999" class="w-full" />
        </ElFormItem>
        <ElFormItem label="烹饪时间">
          <ElInput v-model="form.cookingTime" placeholder="如：30 分钟" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElRadioGroup v-model="form.status">
            <ElRadioButton :value="1">
              上架
            </ElRadioButton>
            <ElRadioButton :value="0">
              下架
            </ElRadioButton>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem label="背景色">
          <ElInput v-model="form.bgColor" placeholder="如：#F8E1E4" />
        </ElFormItem>
      </div>

      <ElFormItem label="封面">
        <ImageUpload v-model="form.image" dir="admin/dish" :size="140" />
      </ElFormItem>

      <ElFormItem label="描述">
        <ElInput v-model="form.description" type="textarea" :rows="2" maxlength="500" show-word-limit />
      </ElFormItem>

      <!-- 食材 -->
      <ElFormItem label="食材">
        <div class="w-full space-y-2">
          <div
            v-for="(item, idx) in form.ingredients"
            :key="idx"
            class="flex gap-2"
          >
            <ElInput v-model="item.name" placeholder="食材名称" class="flex-1" />
            <ElInput v-model="item.amount" placeholder="用量" style="width: 160px" />
            <ElButton link type="danger" @click="removeIngredient(idx)">
              删除
            </ElButton>
          </div>
          <ElButton size="small" @click="addIngredient">
            + 添加食材
          </ElButton>
        </div>
      </ElFormItem>

      <!-- 步骤 -->
      <ElFormItem label="步骤">
        <div class="w-full space-y-2">
          <div
            v-for="(_step, idx) in form.steps"
            :key="idx"
            class="flex gap-2 items-start"
          >
            <span class="mt-2 w-6 text-center text-muted-foreground">{{ idx + 1 }}.</span>
            <ElInput
              v-model="form.steps[idx]"
              type="textarea"
              :rows="2"
              class="flex-1"
              placeholder="描述这一步操作"
            />
            <div class="flex flex-col gap-1">
              <ElButton size="small" :disabled="idx === 0" @click="moveStep(idx, -1)">
                上移
              </ElButton>
              <ElButton size="small" :disabled="idx === form.steps.length - 1" @click="moveStep(idx, 1)">
                下移
              </ElButton>
              <ElButton size="small" type="danger" plain @click="removeStep(idx)">
                删除
              </ElButton>
            </div>
          </div>
          <ElButton size="small" @click="addStep">
            + 添加步骤
          </ElButton>
        </div>
      </ElFormItem>

    </ElForm>

    <template #footer>
      <div class="flex justify-end gap-2">
        <ElButton @click="emit('update:visible', false)">
          取消
        </ElButton>
        <ElButton type="primary" :loading="submitting" @click="onSubmit">
          保存
        </ElButton>
      </div>
    </template>
  </ElDrawer>
</template>
