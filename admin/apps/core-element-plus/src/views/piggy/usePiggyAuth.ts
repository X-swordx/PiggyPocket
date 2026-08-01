import { computed } from 'vue'

/**
 * 页面写权限判定。
 * 约定：列表页的写按钮统一用对应的 `xxx:edit` 权限码控制。
 * superadmin 的 permissions 是 ['*']，useAppAuth 已做通配处理。
 */
export function usePiggyAuth(editPermission: string) {
  const { auth } = useAppAuth()
  const canEdit = computed(() => auth(editPermission))
  return { canEdit }
}
