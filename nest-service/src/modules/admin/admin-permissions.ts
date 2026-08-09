import type { AdminRole } from './entities/admin-user.entity';

/**
 * 全部可分配的权限码清单，后台「角色权限」页据此渲染勾选框。
 * 新增业务模块时在这里补一行，同时在前端路由 meta.auth 里引用。
 */
export const ALL_PERMISSIONS: Array<{
  group: string;
  items: Array<{ code: string; label: string }>;
}> = [
  {
    group: '数据概览',
    items: [{ code: 'admin.dashboard:view', label: '查看概览' }],
  },
  {
    group: '用户管理',
    items: [
      { code: 'admin.user:view', label: '查看用户' },
      { code: 'admin.user:edit', label: '编辑/禁用用户' },
    ],
  },
  {
    group: '临期食品',
    items: [
      { code: 'admin.expiryFood:view', label: '查看食品' },
      { code: 'admin.expiryFood:edit', label: '增删改食品' },
    ],
  },
  {
    group: '心愿清单',
    items: [
      { code: 'admin.wish:view', label: '查看心愿' },
      { code: 'admin.wish:edit', label: '增删改心愿' },
    ],
  },
  {
    group: '菜品库',
    items: [
      { code: 'admin.dish:view', label: '查看菜品' },
      { code: 'admin.dish:edit', label: '增删改菜品' },
      { code: 'admin.dishCategory:view', label: '查看菜品分类' },
      { code: 'admin.dishCategory:edit', label: '增删改菜品分类' },
    ],
  },
  {
    group: '订单管理',
    items: [
      { code: 'admin.order:view', label: '查看订单' },
      { code: 'admin.order:edit', label: '状态流转/删除' },
    ],
  },
  {
    group: '饭搭子分组',
    items: [
      { code: 'admin.diningGroup:view', label: '查看分组' },
      { code: 'admin.diningGroup:edit', label: '增删改分组与成员' },
    ],
  },
];

/** 扁平化的权限码集合，用于校验提交值合法性。 */
export const PERMISSION_CODES = new Set(
  ALL_PERMISSIONS.flatMap((g) => g.items.map((i) => i.code)),
);

/**
 * 角色 → 权限码的**默认值**。
 * 运行时实际取值来自 `admin_role_permissions` 表（见 AdminRolePermissionService），
 * 这里仅用于首次初始化与表数据缺失时的兜底。
 *
 * `*` 代表全部权限，superadmin 固定如此、不可在后台修改。
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  superadmin: ['*'],
  operator: [
    'admin.dashboard:view',
    'admin.user:view',
    'admin.user:edit',
    'admin.expiryFood:view',
    'admin.expiryFood:edit',
    'admin.wish:view',
    'admin.wish:edit',
    'admin.dish:view',
    'admin.dish:edit',
    'admin.dishCategory:view',
    'admin.dishCategory:edit',
    'admin.order:view',
    'admin.order:edit',
    'admin.diningGroup:view',
    'admin.diningGroup:edit',
  ],
  viewer: [
    'admin.dashboard:view',
    'admin.user:view',
    'admin.expiryFood:view',
    'admin.wish:view',
    'admin.dish:view',
    'admin.dishCategory:view',
    'admin.order:view',
    'admin.diningGroup:view',
  ],
};
