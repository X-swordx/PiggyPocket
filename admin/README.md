# 猪猪生活本 · 后台管理系统（admin）

基于 [fantastic-admin/basic](https://github.com/fantastic-admin/basic) 的 Element Plus 模板搭建，为 [mobile](../mobile/) 小程序提供后台数据管理。

## 技术栈

- Vue 3 + Vite 8 + TypeScript
- Element Plus 2
- Pinia + Vue Router 5
- UnoCSS
- axios（对接 [nest-service](../nest-service/) 的 `/api` 前缀）

## 目录结构

- `apps/core-element-plus/` — 前端主工程（原模板 Element Plus 变体，其余 UI 变体已裁剪）
- `packages/` — fantastic-admin 官方通用组件、类型、hooks（不做修改）

## 本地开发

依赖 pnpm（fantastic-admin 强制要求）：

```bash
npm install -g pnpm
cd d:/piggy-pocket/admin
pnpm install
pnpm dev              # 交互式选择 app（当前只有 core-element-plus）
```

默认监听 `http://localhost:5174`。开发时 `VITE_ENABLE_PROXY=true`，前端 `/proxy/*` → `http://localhost:3000/api/*`（见 [.env.development](apps/core-element-plus/.env.development)）。

首次使用需先在后端执行 migration 建表并植入超管账号：

```bash
cd ../nest-service
npm run migration:run
```

默认账号 `superadmin / admin123456`（**上线后立即改密码**）。

## 功能模块

代码集中在 [apps/core-element-plus/src/views/piggy/](apps/core-element-plus/src/views/piggy/)，
路由定义在 [router/modules/piggy.ts](apps/core-element-plus/src/router/modules/piggy.ts)，
接口封装在 [api/modules/piggy.ts](apps/core-element-plus/src/api/modules/piggy.ts)。

| 模块 | 页面 |
| --- | --- |
| 数据概览 | `Dashboard.vue` — 统计卡片、订单状态分布、7 天趋势 |
| 临期食品 | `ExpiryFoodList.vue` + `ExpiryFoodEditor.vue` |
| 心愿清单 | `WishList.vue` + `WishEditor.vue` |
| 菜品库 | `DishList.vue` + `DishEditor.vue`（食材/步骤/标签/封面） |
| 订单管理 | `OrderList.vue` + `OrderDetail.vue`（状态流转） |
| 饭搭子分组 | `DiningGroupList.vue` + `DiningGroupMembers.vue` |
| 用户管理 | `UserList.vue` + `UserDetail.vue` |
| 系统管理 | `SystemAdmin.vue`（管理员账号）、`SystemLog.vue`（操作日志） |

公共组件：`components/UserSelect.vue`（用户远程搜索下拉）、`components/ImageUpload.vue`（OSS 直传）。
写权限判定统一走 [usePiggyAuth.ts](apps/core-element-plus/src/views/piggy/usePiggyAuth.ts)。

## 角色权限

| 角色 | 能力 |
| --- | --- |
| `superadmin` | 全部 |
| `operator` | 业务数据读写，无系统管理 |
| `viewer` | 只读，写按钮隐藏；后端也会拦（403） |

角色 ↔ 权限码映射在后端 [admin-permissions.ts](../nest-service/src/modules/admin/admin-permissions.ts)，
登录时随 `permissions[]` 下发；前端 `meta.auth` 控制菜单可见性。

## 后端约定

- 全部走 `/api/admin/*`。
- 登录：`POST /api/admin/auth/login { username, password }` → `{ id, token, username, role, permissions[] }`
- 鉴权：请求头 `Token: <jwt>`（fantastic-admin 前端内置约定）。
- 响应体：`{ status: 1, error: '', data: ... }`（fantastic-admin 拦截器要求，与 nest-service 移动端的 `{ code, data, message }` 不同 — 管理端接口用独立拦截器包装）。

完整接口清单见 [../docs/admin-requirements.md §4](../docs/admin-requirements.md)。

## 构建

```bash
pnpm --filter @fantastic-admin/core-element-plus run build
```

产物在 `apps/core-element-plus/dist`（约 4.1 MB）。该命令包含 `vue-tsc` 类型检查 —— `pnpm dev` 不做类型检查，提交前务必跑一次 build。

## 注意事项

- **el-table 插槽类型**：`el-table-column` 的默认插槽把 `row` 固定推断为 `DefaultRow`，不跟随泛型。模板里给强类型函数传 `row` 需要 `as` 断言（现有页面已处理），不要试图给插槽标注 `#default="{ row }: { row: T }"` —— 会因逆变产生更多错误。
- **图片预览层级**：`ElImage` 的 `preview-src-list` 必须配 `preview-teleported`，否则预览层会被表格 fixed 列遮挡。

## 部署

见 [../deploy/cloud/README.md §14](../deploy/cloud/README.md)。
验收用例见 [../docs/qa/admin-e2e-cases.md](../docs/qa/admin-e2e-cases.md)。
