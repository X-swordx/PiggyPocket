<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import {
  ElButton, ElInput, ElTable, ElTableColumn, ElPagination, ElTag,
  ElPopconfirm, ElMessage, ElMessageBox, ElSwitch, ElDialog,
  ElForm, ElFormItem, ElSelect, ElOption, type FormInstance,
} from 'element-plus'
import {
  listAdmins, createAdmin, updateAdmin, setAdminStatus,
  resetAdminPassword, removeAdmin,
  type AdminAccount, type AdminRole,
} from '@/api/modules/piggy'

defineOptions({ name: 'SystemAdmin' })

const ROLE_OPTIONS: Array<{ label: string; value: AdminRole; desc: string }> = [
  { label: '超级管理员', value: 'superadmin', desc: '全部权限，含系统管理' },
  { label: '运营', value: 'operator', desc: '内容 + 交易管理，无系统管理' },
  { label: '只读', value: 'viewer', desc: '只能查看，不能修改' },
]

const ROLE_TAG: Record<AdminRole, 'danger' | 'primary' | 'info'> = {
  superadmin: 'danger',
  operator: 'primary',
  viewer: 'info',
}

const roleLabel = (r: AdminRole) =>
  ROLE_OPTIONS.find(o => o.value === r)?.label ?? r

const loading = ref(false)
const list = ref<AdminAccount[]>([])
const total = ref(0)

const query = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
})

async function fetchData() {
  loading.value = true
  try {
    const res = await listAdmins({
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword || undefined,
    })
    list.value = res.list
    total.value = res.total
  }
  finally {
    loading.value = false
  }
}

function onSearch() {
  query.page = 1
  fetchData()
}

// ============ 新建 / 编辑 ============
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const submitting = ref(false)

const form = reactive<{
  username: string
  password: string
  nickname: string
  role: AdminRole
}>({
  username: '',
  password: '',
  nickname: '',
  role: 'operator',
})

const rules = {
  username: [{ required: true, message: '请输入用户名（至少 3 位）', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码（至少 6 位）', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

function openCreate() {
  editingId.value = null
  form.username = ''
  form.password = ''
  form.nickname = ''
  form.role = 'operator'
  dialogVisible.value = true
}

function openEdit(row: AdminAccount) {
  editingId.value = row.id
  form.username = row.username
  form.password = ''
  form.nickname = row.nickname ?? ''
  form.role = row.role
  dialogVisible.value = true
}

async function onSubmit() {
  // 编辑时不校验密码
  const valid = editingId.value
    ? await formRef.value?.validateField(['username', 'role']).catch(() => false)
    : await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (editingId.value) {
      await updateAdmin(editingId.value, {
        nickname: form.nickname,
        role: form.role,
      })
      ElMessage.success('已更新')
    }
    else {
      await createAdmin({
        username: form.username,
        password: form.password,
        nickname: form.nickname || undefined,
        role: form.role,
      })
      ElMessage.success('已创建')
    }
    dialogVisible.value = false
    fetchData()
  }
  finally {
    submitting.value = false
  }
}

// ============ 启停 / 重置密码 / 删除 ============
async function onToggleStatus(row: AdminAccount, enabled: boolean) {
  try {
    await setAdminStatus(row.id, enabled ? 1 : 0)
    row.status = enabled ? 1 : 0
    ElMessage.success(enabled ? '已启用' : '已停用')
  }
  catch {
    // 失败时保持原状态（switch 是受控的，不改 row.status 即自动回弹）
  }
}

async function onResetPassword(row: AdminAccount) {
  try {
    const { value } = await ElMessageBox.prompt(
      `为 ${row.username} 设置新密码（至少 6 位）`,
      '重置密码',
      {
        inputType: 'password',
        inputPattern: /.{6,}/,
        inputErrorMessage: '密码至少 6 位',
      },
    )
    await resetAdminPassword(row.id, value)
    ElMessage.success('密码已重置')
  }
  catch {
    // cancel
  }
}

async function onDelete(row: AdminAccount) {
  await removeAdmin(row.id)
  ElMessage.success('已删除')
  fetchData()
}

onMounted(fetchData)
</script>

<template>
  <FaPageMain>
    <div class="flex flex-wrap gap-3 mb-4">
      <ElInput
        v-model="query.keyword"
        placeholder="按用户名搜索"
        clearable
        style="width: 220px"
        @keyup.enter="onSearch"
      />
      <ElButton type="primary" @click="onSearch">
        搜索
      </ElButton>
      <div class="flex-1" />
      <ElButton type="primary" @click="openCreate">
        新建管理员
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
      <ElTableColumn label="用户名" prop="username" min-width="130" />
      <ElTableColumn label="昵称" min-width="120">
        <template #default="{ row }">
          {{ row.nickname || '-' }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="角色" width="130">
        <template #default="{ row }">
          <ElTag :type="ROLE_TAG[(row as AdminAccount).role]" effect="light">
            {{ roleLabel(row.role) }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="状态" width="140">
        <template #default="{ row }">
          <ElSwitch
            :model-value="row.status === 1"
            active-text="启用"
            inactive-text="停用"
            @change="(v) => onToggleStatus(row as AdminAccount, v as boolean)"
          />
        </template>
      </ElTableColumn>
      <ElTableColumn label="最后登录" width="170">
        <template #default="{ row }">
          {{ row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString() : '从未登录' }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <ElButton link type="primary" @click="openEdit(row as AdminAccount)">
            编辑
          </ElButton>
          <ElButton link @click="onResetPassword(row as AdminAccount)">
            改密
          </ElButton>
          <ElPopconfirm
            title="确认删除该管理员？"
            width="220"
            @confirm="onDelete(row as AdminAccount)"
          >
            <template #reference>
              <ElButton link type="danger">
                删除
              </ElButton>
            </template>
          </ElPopconfirm>
        </template>
      </ElTableColumn>
    </ElTable>

    <div class="flex justify-end mt-4">
      <ElPagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="fetchData"
        @size-change="fetchData"
      />
    </div>

    <ElDialog
      v-model="dialogVisible"
      :title="editingId ? '编辑管理员' : '新建管理员'"
      width="520px"
      destroy-on-close
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
        <ElFormItem label="用户名" prop="username">
          <ElInput v-model="form.username" :disabled="!!editingId" maxlength="50" />
        </ElFormItem>
        <ElFormItem v-if="!editingId" label="密码" prop="password">
          <ElInput v-model="form.password" type="password" show-password maxlength="50" />
        </ElFormItem>
        <ElFormItem label="昵称">
          <ElInput v-model="form.nickname" maxlength="50" />
        </ElFormItem>
        <ElFormItem label="角色" prop="role">
          <ElSelect v-model="form.role" class="w-full">
            <ElOption
              v-for="opt in ROLE_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            >
              <div class="flex justify-between items-center gap-4">
                <span>{{ opt.label }}</span>
                <span class="text-xs text-muted-foreground">{{ opt.desc }}</span>
              </div>
            </ElOption>
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">
          取消
        </ElButton>
        <ElButton type="primary" :loading="submitting" @click="onSubmit">
          保存
        </ElButton>
      </template>
    </ElDialog>
  </FaPageMain>
</template>
