<script setup lang="ts">
import { ref, watch, reactive } from 'vue'
import {
  ElDialog, ElForm, ElFormItem, ElInput, ElInputNumber, ElSelect,
  ElOption, ElDatePicker, ElButton, ElMessage, type FormInstance,
} from 'element-plus'
import {
  getExpiryItem, createExpiryItem, updateExpiryItem,
  type AdminExpiryItem,
} from '@/api/modules/piggy'
import { STORAGE_OPTIONS, ITEM_CATEGORY_OPTIONS } from './options'
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

const form = reactive<Partial<AdminExpiryItem>>({
  userId: undefined,
  name: '',
  imageUrl: '',
  expiryDate: '',
  quantity: 1,
  remindDays: 3,
  storage: undefined,
  category: undefined,
  notes: '',
  bgColor: '',
})

const initialUserNickname = ref<string | null>(null)

const rules = {
  userId: [{ required: true, message: '请选择所属用户', trigger: 'change' }],
  name: [{ required: true, message: '请输入物品名称', trigger: 'blur' }],
  expiryDate: [{ required: true, message: '请选择到期日期', trigger: 'change' }],
}

watch(
  () => [props.visible, props.id] as const,
  async ([v, id]) => {
    if (!v) return
    resetForm()
    if (id) {
      const item = await getExpiryItem(id)
      Object.assign(form, {
        userId: item.userId,
        name: item.name,
        imageUrl: item.imageUrl ?? '',
        expiryDate: item.expiryDate,
        quantity: item.quantity,
        remindDays: item.remindDays,
        storage: item.storage,
        category: item.category,
        notes: item.notes ?? '',
        bgColor: item.bgColor ?? '',
      })
      initialUserNickname.value = item.userNickname
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
  form.remindDays = 3
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
      await updateExpiryItem(props.id, rest)
      ElMessage.success('已更新')
    }
    else {
      await createExpiryItem(form)
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
    :title="id ? '编辑到期物品' : '新增到期物品'"
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
      <ElFormItem label="到期日期" prop="expiryDate">
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
      <ElFormItem label="提前提醒">
        <ElInputNumber v-model="form.remindDays" :min="0" :max="365" />
        <span class="ml-2 text-xs text-muted-foreground">天，0 表示到期当天才提醒</span>
      </ElFormItem>
      <ElFormItem label="存放位置">
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
            v-for="opt in ITEM_CATEGORY_OPTIONS"
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
