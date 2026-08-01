<script setup lang="ts">
import { ref } from 'vue'
import { ElOption, ElSelect } from 'element-plus'
import { listDiningGroups, type AdminDiningGroup } from '@/api/modules/piggy'

/**
 * 饭搭子分组下拉。
 * 用列表接口的前 100 条充当选项（分组数量通常很少，无需远程搜索）。
 */

const props = defineProps<{
  modelValue?: number | null
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: number | null): void
}>()

const loading = ref(false)
const options = ref<AdminDiningGroup[]>([])

async function load(keyword?: string) {
  loading.value = true
  try {
    const res = await listDiningGroups({ page: 1, pageSize: 100, keyword })
    options.value = res.list
  }
  finally {
    loading.value = false
  }
}

load()
</script>

<template>
  <ElSelect
    :model-value="props.modelValue ?? undefined"
    :placeholder="placeholder ?? '选择饭搭子分组'"
    :clearable="clearable ?? true"
    :disabled="disabled"
    :loading="loading"
    filterable
    remote
    :remote-method="load"
    class="w-full"
    @change="(v) => emit('update:modelValue', (v ?? null) as number | null)"
    @clear="emit('update:modelValue', null)"
  >
    <ElOption
      v-for="opt in options"
      :key="opt.id"
      :label="opt.name"
      :value="opt.id"
    >
      <div class="flex items-center justify-between gap-2">
        <span class="flex-1 truncate">{{ opt.name }}</span>
        <span class="text-xs text-muted-foreground">
          {{ opt.memberCount }} 人
        </span>
      </div>
    </ElOption>
  </ElSelect>
</template>
