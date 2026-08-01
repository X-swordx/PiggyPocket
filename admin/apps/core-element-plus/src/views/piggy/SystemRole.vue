<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  ElAlert, ElButton, ElCard, ElCheckbox, ElCheckboxGroup, ElMessage, ElTabPane, ElTabs,
} from 'element-plus'
import {
  getRolePermissions, saveRolePermissions,
  type AdminRole, type PermissionGroup,
} from '@/api/modules/piggy'

defineOptions({ name: 'SystemRole' })

const ROLE_LABEL: Record<string, string> = {
  operator: '运营 (operator)',
  viewer: '只读 (viewer)',
}

const loading = ref(false)
const saving = ref(false)
const allPermissions = ref<PermissionGroup[]>([])
/** 各角色当前勾选值，key 为角色码 */
const selections = ref<Record<string, string[]>>({})
/** 服务端返回的原始值，用于判断是否有改动 */
const original = ref<Record<string, string[]>>({})
const activeRole = ref<AdminRole>('operator')

const roleList = computed(() => Object.keys(selections.value) as AdminRole[])

const dirty = computed(() => {
  const cur = selections.value[activeRole.value] ?? []
  const org = original.value[activeRole.value] ?? []
  if (cur.length !== org.length) {
    return true
  }
  return [...cur].sort().join(',') !== [...org].sort().join(',')
})

async function load() {
  loading.value = true
  try {
    const config = await getRolePermissions()
    allPermissions.value = config.allPermissions
    const sel: Record<string, string[]> = {}
    config.roles.forEach((r) => {
      sel[r.role] = [...r.permissions]
    })
    selections.value = sel
    original.value = JSON.parse(JSON.stringify(sel))
    if (config.roles.length && !sel[activeRole.value]) {
      activeRole.value = config.roles[0].role
    }
  }
  finally {
    loading.value = false
  }
}

async function onSave() {
  saving.value = true
  try {
    const role = activeRole.value
    const permissions = selections.value[role] ?? []
    await saveRolePermissions(role, permissions)
    original.value[role] = [...permissions]
    ElMessage.success('已保存，该角色的成员下次登录后生效')
  }
  finally {
    saving.value = false
  }
}

function onReset() {
  const role = activeRole.value
  selections.value[role] = [...(original.value[role] ?? [])]
}

/** 整组全选/全不选 */
function toggleGroup(group: PermissionGroup, checked: boolean) {
  const role = activeRole.value
  const codes = group.items.map(i => i.code)
  const cur = new Set(selections.value[role] ?? [])
  codes.forEach(c => checked ? cur.add(c) : cur.delete(c))
  selections.value[role] = [...cur]
}

function groupState(group: PermissionGroup) {
  const cur = selections.value[activeRole.value] ?? []
  const codes = group.items.map(i => i.code)
  const hit = codes.filter(c => cur.includes(c)).length
  return {
    all: hit === codes.length,
    indeterminate: hit > 0 && hit < codes.length,
  }
}

onMounted(load)
</script>

<template>
  <FaPageMain>
    <ElAlert
      type="info"
      :closable="false"
      show-icon
      class="mb-4"
    >
      <template #title>
        superadmin 固定拥有全部权限，不在此处配置。修改后需该角色成员**重新登录**才会生效。
      </template>
    </ElAlert>

    <ElTabs v-model="activeRole">
      <ElTabPane
        v-for="role in roleList"
        :key="role"
        :label="ROLE_LABEL[role] ?? role"
        :name="role"
      />
    </ElTabs>

    <div v-loading="loading" class="min-h-40">
      <div class="grid gap-3 lg:grid-cols-2">
        <ElCard
          v-for="group in allPermissions"
          :key="group.group"
          shadow="never"
        >
          <template #header>
            <ElCheckbox
              :model-value="groupState(group).all"
              :indeterminate="groupState(group).indeterminate"
              @change="(v) => toggleGroup(group, v as boolean)"
            >
              <span class="font-medium">{{ group.group }}</span>
            </ElCheckbox>
          </template>
          <ElCheckboxGroup v-model="selections[activeRole]">
            <div class="flex flex-col gap-2">
              <ElCheckbox
                v-for="item in group.items"
                :key="item.code"
                :value="item.code"
              >
                {{ item.label }}
                <span class="ml-1 text-xs text-muted-foreground">{{ item.code }}</span>
              </ElCheckbox>
            </div>
          </ElCheckboxGroup>
        </ElCard>
      </div>

      <div class="mt-4 flex gap-2">
        <ElButton
          type="primary"
          :loading="saving"
          :disabled="!dirty"
          @click="onSave"
        >
          保存
        </ElButton>
        <ElButton :disabled="!dirty" @click="onReset">
          撤销改动
        </ElButton>
        <span v-if="dirty" class="self-center text-sm text-warning">有未保存的改动</span>
      </div>
    </div>
  </FaPageMain>
</template>
