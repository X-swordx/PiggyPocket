<script setup lang="ts">
import { ref, watch, reactive } from 'vue'
import {
  ElDialog, ElForm, ElFormItem, ElInput, ElInputNumber, ElSelect,
  ElOption, ElButton, ElMessage, type FormInstance,
} from 'element-plus'
import {
  getWish, createWish, updateWish,
  type AdminWish,
} from '@/api/modules/piggy'
import { WISH_CATEGORY_OPTIONS, WISH_TAG_CLASS_OPTIONS } from './options'
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
const initialUserNickname = ref<string | null>(null)

const form = reactive<Partial<AdminWish>>({
  userId: undefined,
  title: '',
  category: '',
  tagClass: '',
  filter: 0,
})

const rules = {
  userId: [{ required: true, message: '请选择所属用户', trigger: 'change' }],
  title: [{ required: true, message: '请输入心愿标题', trigger: 'blur' }],
}

watch(
  () => [props.visible, props.id] as const,
  async ([v, id]) => {
    if (!v) return
    reset()
    if (id) {
      const wish = await getWish(id)
      Object.assign(form, {
        userId: wish.userId,
        title: wish.title,
        category: wish.category,
        tagClass: wish.tagClass,
        filter: wish.filter,
      })
      initialUserNickname.value = wish.userNickname
    }
  },
  { immediate: true },
)

function reset() {
  form.userId = undefined
  form.title = ''
  form.category = ''
  form.tagClass = ''
  form.filter = 0
  initialUserNickname.value = null
}

async function onSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    if (props.id) {
      const { userId, ...rest } = form
      await updateWish(props.id, rest)
      ElMessage.success('已更新')
    }
    else {
      await createWish(form)
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
  <ElDialog
    :model-value="visible"
    :title="id ? '编辑心愿' : '新增心愿'"
    width="560px"
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
      <ElFormItem label="标题" prop="title">
        <ElInput v-model="form.title" maxlength="100" show-word-limit />
      </ElFormItem>
      <ElFormItem label="分类">
        <ElSelect v-model="form.category" clearable class="w-full">
          <ElOption
            v-for="opt in WISH_CATEGORY_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="标签样式">
        <ElSelect v-model="form.tagClass" clearable class="w-full">
          <ElOption
            v-for="opt in WISH_TAG_CLASS_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="筛选序号">
        <ElInputNumber v-model="form.filter" :min="0" :max="99" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="emit('update:visible', false)">
        取消
      </ElButton>
      <ElButton type="primary" :loading="submitting" @click="onSubmit">
        保存
      </ElButton>
    </template>
  </ElDialog>
</template>
