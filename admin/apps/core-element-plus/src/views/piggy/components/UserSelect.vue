<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElSelect, ElOption, ElAvatar } from 'element-plus'
import { searchAdminUsers, type AdminUserOption } from '@/api/modules/piggy'

/**
 * 用户远程搜索下拉。
 * - 提供给筛选栏（可清空）和表单（必填）复用。
 * - 传入 initialUserId 时首次挂载会自动预取一次以显示昵称。
 */

const props = defineProps<{
  modelValue?: number | null
  placeholder?: string
  clearable?: boolean
  initialLabel?: string | null
  size?: 'small' | 'default' | 'large'
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: number | null): void
  (e: 'change', option: AdminUserOption | null): void
}>()

const loading = ref(false)
const options = ref<AdminUserOption[]>([])
const cache = new Map<number, AdminUserOption>()

async function remote(query: string) {
  loading.value = true
  try {
    options.value = await searchAdminUsers(query || undefined)
    options.value.forEach((o) => cache.set(o.id, o))
  }
  finally {
    loading.value = false
  }
}

// 初次加载先拉一批默认列表，方便点击直接展开
remote('')

function onChange(val: number | null) {
  emit('update:modelValue', val)
  emit('change', val === null ? null : cache.get(val) ?? null)
}

// 若外部传入 modelValue 但列表里还没有该项，则单独拉一次保证 label 展示
watch(
  () => props.modelValue,
  async (v) => {
    if (!v || cache.has(v)) return
    // 服务端未提供按 id 查询的下拉接口，就退化为一次搜索 + 手动占位
    if (props.initialLabel) {
      cache.set(v, {
        id: v,
        nickname: props.initialLabel,
        openidTail: null,
      })
      // 触发一次响应式刷新
      options.value = [...options.value, cache.get(v)!]
    }
  },
  { immediate: true },
)
</script>

<template>
  <ElSelect
    :model-value="props.modelValue ?? undefined"
    :placeholder="placeholder ?? '搜索用户昵称'"
    :clearable="clearable ?? true"
    :size="size"
    :disabled="disabled"
    filterable
    remote
    :remote-method="remote"
    :loading="loading"
    class="w-full"
    @change="onChange"
    @clear="onChange(null)"
  >
    <ElOption
      v-for="opt in options"
      :key="opt.id"
      :label="opt.nickname"
      :value="opt.id"
    >
      <div class="flex items-center gap-2">
        <ElAvatar :src="opt.avatar" :size="24">
          {{ opt.nickname.slice(0, 1) }}
        </ElAvatar>
        <span class="flex-1 truncate">{{ opt.nickname }}</span>
        <span v-if="opt.openidTail" class="text-xs text-muted-foreground">
          …{{ opt.openidTail }}
        </span>
      </div>
    </ElOption>
  </ElSelect>
</template>
