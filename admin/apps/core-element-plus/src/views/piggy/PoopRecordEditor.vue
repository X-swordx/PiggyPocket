<script setup lang="ts">
import { ref, watch, reactive } from 'vue'
import {
  ElDialog, ElForm, ElFormItem, ElInput, ElSelect,
  ElOption, ElDatePicker, ElButton, ElMessage, type FormInstance,
} from 'element-plus'
import {
  getPoopRecord, createPoopRecord, updatePoopRecord,
  type AdminPoopRecord,
} from '@/api/modules/piggy'
import { BRISTOL_OPTIONS } from './options'
import UserSelect from './components/UserSelect.vue'

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

const form = reactive<{
  userId: number | undefined
  occurredAt: Date | null
  bristolType: number | undefined
  notes: string
}>({
  userId: undefined,
  occurredAt: null,
  bristolType: undefined,
  notes: '',
})

const initialUserNickname = ref<string | null>(null)

const rules = {
  userId: [{ required: true, message: '请选择所属用户', trigger: 'change' }],
  occurredAt: [{ required: true, message: '请选择排便时间', trigger: 'change' }],
  bristolType: [{ required: true, message: '请选择布里斯托分型', trigger: 'change' }],
}

/** 不能选未来时间 */
function disableFutureDate(date: Date) {
  return date.getTime() > Date.now()
}

watch(
  () => [props.visible, props.id] as const,
  async ([v, id]) => {
    if (!v) return
    resetForm()
    if (id) {
      const item = await getPoopRecord(id)
      form.userId = item.userId
      form.occurredAt = new Date(item.occurredAt)
      form.bristolType = item.bristolType
      form.notes = item.notes ?? ''
      initialUserNickname.value = item.userNickname
    }
  },
  { immediate: true },
)

function resetForm() {
  form.userId = undefined
  form.occurredAt = null
  form.bristolType = undefined
  form.notes = ''
  initialUserNickname.value = null
}

async function onSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    // 日期选择器的 Date 按浏览器本地时区转 ISO，服务端据此重算东八区日历日
    const payload: Partial<AdminPoopRecord> = {
      occurredAt: form.occurredAt!.toISOString(),
      bristolType: form.bristolType,
      notes: form.notes || undefined,
    }
    if (props.id) {
      await updatePoopRecord(props.id, payload)
      ElMessage.success('已更新')
    }
    else {
      await createPoopRecord({ userId: form.userId, ...payload })
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
    :title="id ? '编辑排便记录' : '新增排便记录'"
    width="560px"
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
  >
    <ElForm
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="110px"
    >
      <ElFormItem label="所属用户" prop="userId">
        <UserSelect
          v-model="form.userId"
          :disabled="!!id"
          :initial-label="initialUserNickname"
        />
      </ElFormItem>
      <ElFormItem label="排便时间" prop="occurredAt">
        <ElDatePicker
          v-model="form.occurredAt"
          type="datetime"
          :disabled-date="disableFutureDate"
          placeholder="选择排便时间"
          style="width: 100%"
        />
      </ElFormItem>
      <ElFormItem label="布里斯托分型" prop="bristolType">
        <ElSelect v-model="form.bristolType" placeholder="选择分型" class="w-full">
          <ElOption
            v-for="opt in BRISTOL_OPTIONS"
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
          maxlength="200"
          show-word-limit
          placeholder="腹痛、带血等异常情况可在此记录"
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
