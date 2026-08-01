<script setup lang="ts">
import { ref, watch, reactive } from 'vue'
import {
  ElDialog, ElForm, ElFormItem, ElInput, ElInputNumber, ElSelect,
  ElOption, ElDatePicker, ElButton, ElMessage, type FormInstance,
} from 'element-plus'
import {
  getExpiryFood, createExpiryFood, updateExpiryFood,
  type AdminExpiryFood,
} from '@/api/modules/piggy'
import { STORAGE_OPTIONS, FOOD_CATEGORY_OPTIONS } from './options'
import UserSelect from './components/UserSelect.vue'
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

const form = reactive<Partial<AdminExpiryFood>>({
  userId: undefined,
  name: '',
  imageUrl: '',
  expiryDate: '',
  quantity: 1,
  storage: undefined,
  category: undefined,
  notes: '',
  bgColor: '',
})

const initialUserNickname = ref<string | null>(null)

const rules = {
  userId: [{ required: true, message: '请选择所属用户', trigger: 'change' }],
  name: [{ required: true, message: '请输入食品名称', trigger: 'blur' }],
  expiryDate: [{ required: true, message: '请选择保质期', trigger: 'change' }],
}

watch(
  () => [props.visible, props.id] as const,
  async ([v, id]) => {
    if (!v) return
    resetForm()
    if (id) {
      const food = await getExpiryFood(id)
      Object.assign(form, {
        userId: food.userId,
        name: food.name,
        imageUrl: food.imageUrl ?? '',
        expiryDate: food.expiryDate,
        quantity: food.quantity,
        storage: food.storage,
        category: food.category,
        notes: food.notes ?? '',
        bgColor: food.bgColor ?? '',
      })
      initialUserNickname.value = food.userNickname
    }
  },
  { immediate: true },
)

function resetForm() {
  form.userId = undefined
  form.name = ''
  form.imageUrl = ''
  form.expiryDate = ''
  form.quantity = 1
  form.storage = undefined
  form.category = undefined
  form.notes = ''
  form.bgColor = ''
  initialUserNickname.value = null
}

async function onSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    if (props.id) {
      // 更新时后端不接受 userId 字段
      const { userId, ...rest } = form
      await updateExpiryFood(props.id, rest)
      ElMessage.success('已更新')
    }
    else {
      await createExpiryFood(form)
      ElMessage.success('已创建')
    }
    emit('saved')
  }
  finally {
    submitting.value = false
  }
}

function onClose() {
  emit('update:visible', false)
}
</script>

<template>
  <ElDialog
    :model-value="visible"
    :title="id ? '编辑临期食品' : '新增临期食品'"
    width="640px"
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
  >
    <ElForm
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="90px"
    >
      <ElFormItem label="所属用户" prop="userId">
        <UserSelect
          v-model="form.userId"
          :disabled="!!id"
          :initial-label="initialUserNickname"
        />
      </ElFormItem>
      <ElFormItem label="名称" prop="name">
        <ElInput v-model="form.name" maxlength="100" show-word-limit />
      </ElFormItem>
      <ElFormItem label="图片">
        <ImageUpload v-model="form.imageUrl" dir="admin/expiry" />
      </ElFormItem>
      <ElFormItem label="保质期" prop="expiryDate">
        <ElDatePicker
          v-model="form.expiryDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="选择到期日"
          style="width: 100%"
        />
      </ElFormItem>
      <ElFormItem label="数量">
        <ElInputNumber v-model="form.quantity" :min="1" :max="999" />
      </ElFormItem>
      <ElFormItem label="储存位置">
        <ElSelect v-model="form.storage" clearable class="w-full">
          <ElOption
            v-for="opt in STORAGE_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="分类">
        <ElSelect v-model="form.category" clearable class="w-full">
          <ElOption
            v-for="opt in FOOD_CATEGORY_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="备注">
        <ElInput
          v-model="form.notes"
          type="textarea"
          :rows="3"
          maxlength="500"
          show-word-limit
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="onClose">
        取消
      </ElButton>
      <ElButton type="primary" :loading="submitting" @click="onSubmit">
        保存
      </ElButton>
    </template>
  </ElDialog>
</template>
