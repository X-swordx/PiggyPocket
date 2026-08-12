# 猪猪生活本 · 后台管理系统需求规格

- 版本：v1.0
- 日期：2026-07-28
- 前端框架：[fantastic-admin/basic](https://github.com/fantastic-admin/basic.git)（Vue 3 + Vite + Element Plus + Pinia）
- 后端复用：[nest-service](../nest-service/)（现有 REST API，共用数据库）
- 目标：为 [mobile](../mobile/) 小程序提供一套 Web 后台，用于内容维护、用户/订单管理、数据巡检。

---

## 1. 范围界定

### 1.1 移动端页面 → 后台管理映射

| 移动端页面 | 后台对应模块 | 主要动作 |
| --- | --- | --- |
| [pages/expiry](../mobile/src/pages/expiry) | 临期食品管理 | CRUD、按用户筛选、批量清理已过期 |
| [pages/add-food](../mobile/src/pages/add-food) | 临期食品管理（新增表单参照字段） | — |
| [pages/wishlist](../mobile/src/pages/wishlist) | 心愿清单管理 | CRUD、按状态筛选 |
| [pages/fulfilled-wishes](../mobile/src/pages/fulfilled-wishes) | 心愿清单管理（已完成筛选） | — |
| [pages/food-menu](../mobile/src/pages/food-menu) | 菜品管理 | CRUD、上/下架、封面预览 |
| [pages/recipe-upload](../mobile/src/pages/recipe-upload) | 菜品管理（新增/编辑） | 富文本步骤、食材、标签、封面 OSS |
| [pages/dish-detail](../mobile/src/pages/dish-detail) | 菜品管理（详情预览） | 只读展示 |
| [pages/history-menu](../mobile/src/pages/history-menu) | 订单管理 | 列表 |
| [pages/order](../mobile/src/pages/order) | 订单管理 | 列表、状态流转、详情 |
| [pages/foodie-buddy](../mobile/src/pages/foodie-buddy) | 饭搭子分组管理 | 群 CRUD、成员管理 |
| [pages/profile](../mobile/src/pages/profile) | 用户管理 | 列表、封禁、昵称/头像纠错 |
| [pages/index](../mobile/src/pages/index) | 首页数据看板（可选） | 统计卡片 |
| [pages/profile](../mobile/src/pages/profile) 设置弹窗 | 系统配置 | 备案信息、版本号 |

### 1.2 不在本期范围
- 微信小程序端功能（保持现状）
- 消息推送、支付、审批流
- 多租户、多语言

---

## 2. 数据实体（源自 nest-service 与 mobile services）

来源：[mobile/src/services/foodieBuddy.ts](../mobile/src/services/foodieBuddy.ts)、[mobile/src/services/expiry.ts](../mobile/src/services/expiry.ts)、[mobile/src/services/wishlist.ts](../mobile/src/services/wishlist.ts)。

| 实体 | 关键字段 | 后台管理点 |
| --- | --- | --- |
| `FoodieUser` | id, openid, nickname, avatar, createdAt | 列表、搜索、禁用 |
| `ExpiryFood` | id, userId, name, imageUrl, expiryDate, quantity, storage(fridge/freezer/pantry), category(8 类), notes, bgColor, status(fresh/expiring/expired) | 分组织人筛选、批量删除已过期 |
| `Wish` | id, userId, title, category, tagClass, filter, completed | 完成状态切换、按分类过滤 |
| `FoodieDish` | id, userId, groupId, name, description, category, image, status, calories, cookingTime, ingredients(name+amount 数组), steps(有序), tags, bgColor | 富表单编辑、软删除 |
| `FoodieOrder` | id, orderNo, userId, groupId, status(pending/confirming/cooking/completed), remark, items[] | 列表 + 状态流转 |
| `FoodieOrderItem` | id, orderId, dishId, quantity, remark | 只在订单详情内展示 |
| `DiningGroup` | id, name, creatorId | 群列表、成员 CRUD |
| `DiningGroupMember` | id, groupId, userId, nickname, joinedAt | 移除成员 |
| `AdminUser`（新增） | id, username, passwordHash, roleId, status, lastLoginAt | 后台独有 |
| `AdminRole`（新增） | id, name, menuCodes[] | 后台独有 |

---

## 3. 后台模块与页面

### 3.1 登录与权限
- 用户名密码登录（bcrypt）+ 图形验证码；JWT 存储于 fantastic-admin 的 `useUserStore`。
- 角色：`superadmin`（全部）、`operator`（内容 + 订单，不含用户/系统）、`viewer`（只读）。
- 菜单路由动态下发，走 fantastic-admin `route/asyncRoutes` 机制。

### 3.2 首页 Dashboard
- 卡片：今日新增用户、今日新订单、待处理订单数、临期(≤3 天) 食品数、心愿完成率。
- 折线：近 30 天订单数；柱状：菜品分类分布。
- 允许后期屏蔽，非核心。

### 3.3 用户管理 `/user`
- 列表：id / 头像 / 昵称 / openid（脱敏） / 创建时间 / 关联心愿数 / 关联食品数。
- 搜索：昵称、openid 精确、创建时间区间。
- 操作：查看详情（展示该用户的临期食品、心愿、菜品、订单 Tab）、修改昵称、禁用（软删除，前端登录后 403）。

### 3.4 临期食品管理 `/expiry-food`
- 列表：图片缩略 / 名称 / 用户 / 数量 / 储存位置 / 分类 / 到期日 / 剩余天数 / 状态。
- 搜索：用户 id / 名称模糊 / 状态（`fresh|expiring|expired`）/ 到期日区间。
- 状态由 `expiryDate` 计算，只读展示，参照 [expiry.ts:4](../mobile/src/services/expiry.ts#L4)。
- 操作：新增、编辑、删除、批量删除已过期。
- 表单字段与 `createExpiryFood` 一致，图片走后端已有 OSS 接口 [oss module](../nest-service/src/modules/oss/)。

### 3.5 心愿清单管理 `/wish`
- 列表：id / 用户 / 标题 / 分类 / 标签样式 / 筛选值 / 状态。
- 搜索：用户 / 分类 / 完成状态。
- 操作：新增、编辑、切换完成/未完成、删除。

### 3.6 菜品管理 `/dish`
- 列表：封面 / 名称 / 分类 / 所属用户 / 分组 / 状态 / 卡路里 / 更新时间。
- 搜索：名称、分类、用户、分组、上/下架状态。
- 详情/编辑抽屉：
  - 基本信息（对应 [FoodieDish](../mobile/src/services/foodieBuddy.ts#L21)）
  - 食材列表：`{name, amount}` 动态行
  - 步骤：可拖拽排序的文本行
  - 标签：Tag input
  - 封面：OSS 上传，预览
- 操作：新增、编辑、上/下架（改 status）、删除。

### 3.7 订单管理 `/order`
- 列表：orderNo / 下单人 / 分组 / 状态 / 菜品数 / 备注 / 创建时间。
- 搜索：orderNo、用户、分组、状态、时间区间。
- 详情：订单基础信息 + `items` 表（菜品名、数量、备注）。
- 操作：更新状态（`pending → confirming → cooking → completed`，仅允许向后流转，UI 强制约束）；导出 CSV。

### 3.8 饭搭子分组管理 `/dining-group`
- 列表：分组名 / 创建人 / 成员数 / 创建时间。
- 详情：成员表（可移除；显示 nickname / 加入时间 / openid 脱敏）。
- 操作：新建分组、改名、删除分组、添加/移除成员。

### 3.9 系统管理 `/system`（super only）
- 管理员账号管理：CRUD、重置密码、分配角色。
- 角色管理：菜单权限勾选。
- 操作日志：登录、写操作留痕（who / when / target / action）。

---

## 4. 后端接口（实际实现）

全部新建独立 controller，统一前缀 `/api/admin/*`，鉴权走 `AdminAuthGuard` + `AdminRoleGuard`。
移动端 `/foodie-buddy/*` 接口未做任何改动。

实现文件：[admin-auth.controller.ts](../nest-service/src/modules/admin/admin-auth.controller.ts)、
[admin-resource.controller.ts](../nest-service/src/modules/admin/admin-resource.controller.ts)、
[admin-system.controller.ts](../nest-service/src/modules/admin/admin-system.controller.ts)

### 4.1 认证

```
POST   /api/admin/auth/login          { username, password } → { id, token, username, role, permissions[] }
GET    /api/admin/auth/profile
POST   /api/admin/auth/logout
```

### 4.2 业务数据

```
GET    /api/admin/users/options?keyword=            用户下拉搜索（脱敏）
GET    /api/admin/oss/upload-token?dir=             OSS 直传签名

GET    /api/admin/users                             列表（含 4 项关联计数）
GET    /api/admin/users/:id
PUT    /api/admin/users/:id                         改昵称/头像
PUT    /api/admin/users/:id/status                  启用/禁用

GET    /api/admin/expiry-foods                      page/pageSize/userId/keyword/status
GET    /api/admin/expiry-foods/:id
POST   /api/admin/expiry-foods
PUT    /api/admin/expiry-foods/:id
DELETE /api/admin/expiry-foods/:id
DELETE /api/admin/expiry-foods/expired/batch?userId= 批量清理已过期

GET    /api/admin/wishes                            + completed/category
GET    /api/admin/wishes/:id
POST   /api/admin/wishes
PUT    /api/admin/wishes/:id
PUT    /api/admin/wishes/:id/completed
DELETE /api/admin/wishes/:id

GET    /api/admin/dishes                            + category/status/groupId
GET    /api/admin/dishes/:id
POST   /api/admin/dishes
PUT    /api/admin/dishes/:id
PUT    /api/admin/dishes/:id/status                 上/下架
DELETE /api/admin/dishes/:id

GET    /api/admin/orders                            + status/groupId/startDate/endDate
GET    /api/admin/orders/:id                        含 items + dish
PUT    /api/admin/orders/:id/status                 状态流转
PUT    /api/admin/orders/:id/remark
DELETE /api/admin/orders/:id                        连带删子项

GET    /api/admin/dining-groups
GET    /api/admin/dining-groups/:id
POST   /api/admin/dining-groups                     创建者自动入组
PUT    /api/admin/dining-groups/:id
DELETE /api/admin/dining-groups/:id                 解散时把 orders/dishes 的 groupId 置 NULL
GET    /api/admin/dining-groups/:id/members
POST   /api/admin/dining-groups/:id/members
PUT    /api/admin/dining-groups/:id/members/:memberId
DELETE /api/admin/dining-groups/:id/members/:memberId  创建者不可移除
```

### 4.3 Dashboard 与系统

```
GET    /api/admin/dashboard/overview                统计卡片
GET    /api/admin/dashboard/order-status            订单状态分布
GET    /api/admin/dashboard/order-trend?days=7      近 N 天趋势

GET    /api/admin/admins                            管理员列表
POST   /api/admin/admins
PUT    /api/admin/admins/:id
PUT    /api/admin/admins/:id/status                 不能停用自己
PUT    /api/admin/admins/:id/password               重置密码
DELETE /api/admin/admins/:id                        不能删自己/内置 superadmin

GET    /api/admin/oplogs                            + action/resource/adminId/日期范围

GET    /api/admin/role-permissions                  权限码清单 + 各角色当前配置
PUT    /api/admin/role-permissions                  { role, permissions[] } 保存某角色权限
```

### 4.4 响应格式

管理端接口用 [AdminResponseInterceptor](../nest-service/src/modules/admin/admin-response.interceptor.ts)
包成 fantastic-admin 前端约定的 `{ status: 1, error: '', data }`。

全局 [TransformInterceptor](../nest-service/src/common/interceptors/transform.interceptor.ts) 已加判断，
识别到该结构就不再二次包装（移动端仍返回 `{ code, data, message }`）。

### 4.5 角色权限规则

[AdminRoleGuard](../nest-service/src/modules/admin/admin-role.guard.ts)：

| 角色 | 规则 |
| --- | --- |
| `superadmin` | 无限制 |
| `operator` | 可写业务数据；禁止访问 `/admin/admins*`、`/admin/oplogs`、`/admin/role-permissions` |
| `viewer` | 只读，所有 `POST/PUT/PATCH/DELETE` 返回 403 |

> 上表是**后端硬性拦截**（按 HTTP 方法 + 路径），不可在后台修改。
> 后台「角色权限」页配的是**前端菜单/按钮可见性的权限码**，两者是两层防护：
> 即使把 viewer 的权限码勾满，后端仍会拦掉它的写请求。

---

## 5. 非功能需求

- **兼容性**：Chrome/Edge 最近 2 个大版本；最小分辨率 1366×768。
- **性能**：列表接口 500ms 内、页面首屏 < 2s；大表分页 20/50/100。
- **安全**：JWT 有效期 2h + refresh；写接口全部走 `AdminAuthGuard`；敏感字段（openid）列表默认脱敏、详情才展示完整。
- **可观测**：接入 nest-service 现有日志；后台前端记录路由级 PV。
- **国际化**：仅中文，保留 fantastic-admin 的 i18n 键位以便扩展。
- **主题**：使用 fantastic-admin 默认 Element Plus 主题；主色沿用移动端 `#F8F5F6` 相配的粉调（如 `#E86B8F`）。

---

## 6. 目录结构建议

在仓库根新增 `admin/`（与 [mobile/](../mobile/)、[nest-service/](../nest-service/) 平级）：

```
admin/
├─ src/
│  ├─ api/               # 按模块拆分的 axios 封装
│  ├─ views/
│  │   ├─ dashboard/
│  │   ├─ user/
│  │   ├─ expiry-food/
│  │   ├─ wish/
│  │   ├─ dish/
│  │   ├─ order/
│  │   ├─ dining-group/
│  │   └─ system/
│  ├─ router/
│  └─ store/
├─ .env.development       # VITE_API_BASE=http://localhost:3000
├─ .env.production
└─ vite.config.ts
```

从 `fantastic-admin/basic` 克隆后：
1. `pnpm install`
2. 替换 `src/mock` 与 `src/api` 为真实 nest-service 调用。
3. `src/router/modules` 按上文模块创建路由文件。
4. 在 nest-service 增加 `admin` 子路径与守卫。

---

## 7. 里程碑

| 阶段 | 交付 | 预估 | 状态 |
| --- | --- | --- | --- |
| M0 脚手架 | fantastic-admin 接入、登录、菜单权限、部署脚本 | 2 天 | ✅ 已完成 |
| M1 内容管理 | 临期食品、心愿、菜品三大 CRUD | 4 天 | ✅ 已完成 |
| M2 交易管理 | 订单、饭搭子、用户管理 | 3 天 | ✅ 已完成 |
| M3 系统与看板 | 管理员/角色/日志、Dashboard | 2 天 | ✅ 已完成 |
| M4 联调上线 | 权限拦截、构建验证、QA 用例、文档 | 2 天 | ✅ 已完成 |

### 7.1 实际实现与本文档的差异

规划阶段的设计在落地时有以下调整，均已在代码中生效：

| 项 | 原计划 | 实际实现 | 原因 |
| --- | --- | --- | --- |
| 角色权限 | 建 `admin_roles` 表 + 菜单勾选 | 3 个角色写死在 [admin-permissions.ts](../nest-service/src/modules/admin/admin-permissions.ts) 的 `ROLE_PERMISSIONS` 常量 | 只有 3 个固定角色，建表属过度设计（CLAUDE.md §2） |
| 权限校验粒度 | 每个路由标注权限码 | [AdminRoleGuard](../nest-service/src/modules/admin/admin-role.guard.ts) 按 HTTP 方法 + 路径前缀判定 | 同上，逐个标注啰嗦且易漏 |
| Dashboard 图表 | 折线 + 柱状图 | 手写 CSS 进度条 + 轻量 SVG 折线，未引 echarts | 避免为两张图引入重依赖 |
| 后端接口路径 | 部分复用 `/foodie-buddy/*` | 全部新建 `/api/admin/*` 独立 controller | 管理端语义不同（跨用户查询、无 membership 校验），改动 mobile 接口会破坏其权限边界 |
| 用户下拉接口 | `GET /admin/users` | `GET /admin/users/options` | M2 里 `/admin/users` 改作列表接口，下拉让路 |
| 后台建订单 | 未明确 | 不提供，只做管理 | 订单应由小程序发起 |
| 数据库 schema | 按 InitSchema migration | 发现 `dishes` 表缺 `userId`/`groupId`（历史 `synchronize` 遗留），补了 4 个 migration | 见下方「已知问题」 |

### 7.2 新增的 migration

| 文件 | 作用 |
| --- | --- |
| [1720000001000-AddAdminUsers](../nest-service/src/migrations/1720000001000-AddAdminUsers.ts) | `admin_users` 表 + 默认超管 |
| [1720000002000-AddDishOwnership](../nest-service/src/migrations/1720000002000-AddDishOwnership.ts) | 补 `dishes.userId` / `dishes.groupId`（修历史 schema 漂移） |
| [1720000003000-DishGroupNullable](../nest-service/src/migrations/1720000003000-DishGroupNullable.ts) | `dishes.groupId` 改可空（支持解散组时置 NULL） |
| [1720000004000-AddUserStatus](../nest-service/src/migrations/1720000004000-AddUserStatus.ts) | `users.status` 启用/禁用 |
| [1720000005000-AddAdminOperationLogs](../nest-service/src/migrations/1720000005000-AddAdminOperationLogs.ts) | `admin_operation_logs` 操作日志表 |
| [1720000006000-AddAdminRolePermissions](../nest-service/src/migrations/1720000006000-AddAdminRolePermissions.ts) | `admin_role_permissions` 角色权限配置表，并灌入与原硬编码一致的初始值 |

> ⚠️ `InitSchema1720000000000` 在本项目从未真正执行过 —— 现有业务表是早期 `synchronize: true` 建的。
> 该 migration 已被手动标记为「已执行」以解除阻塞。后续如需对老表做 ALTER，务必先核对实际 schema。

---

## 8. 验收标准（对应 CLAUDE.md §4）

每个模块交付时须满足：
1. 列表：分页、搜索、排序在真实数据下可用；空态、错误态有兜底 UI。
2. 表单：字段与移动端对应服务定义一致，必填/长度校验齐全，提交后列表刷新。
3. 权限：`viewer` 角色进入页面看不到写按钮；接口层 403 时 UI 提示。
4. 与移动端联动：后台改动的记录能在小程序刷新后正确显示；后台无法删除的（如已下单菜品）需给出明确原因。
5. 每个页面都有一条端到端手工用例记录在 `docs/qa/` 中。

验收用例见 [docs/qa/admin-e2e-cases.md](qa/admin-e2e-cases.md)（TC-01 ~ TC-19，覆盖全部页面 + 角色权限 + 构建部署）。

### 8.1 已通过的自动化验证

| 检查 | 命令 | 结果 |
| --- | --- | --- |
| 后端编译 | `cd nest-service && npm run build` | ✅ 通过 |
| 前端类型检查 + 打包 | `cd admin && pnpm --filter @fantastic-admin/core-element-plus run build` | ✅ 通过（产物 4.1 MB） |
| Docker 镜像构建 | `cd admin && docker build .` | ⚠️ 本机因 Docker Hub 网络超时未验证；构建阶段已用上一行等价验证 |

### 8.2 遗留项处理情况

M4 收口时已全部处理：

| 项 | 处理方式 |
| --- | --- |
| 小程序端未校验 `users.status` | ✅ [user.service.ts](../nest-service/src/modules/foodie-buddy/user/user.service.ts) 的 `wechatLogin` 命中已有用户时先判 `status !== 1` → 抛 403「账号已被禁用，请联系管理员」；[mobile 的 refreshCurrentUser](../mobile/src/services/foodieBuddy.ts) 捕获该错误时清除本地用户缓存，避免用旧身份继续访问 |
| 角色不可动态配置 | ✅ 新增 `admin_role_permissions` 表 + 「系统管理 → 角色权限」页，operator/viewer 的权限码可在后台勾选调整。角色本身仍是固定枚举（3 个够用），superadmin 固定全权限不可改 |
| `dishes.groupId` 空值导致小程序不可见 | ✅ [DishEditor.vue](../admin/apps/core-element-plus/src/views/piggy/DishEditor.vue) 的「分组 ID」手填数字改为 [GroupSelect.vue](../admin/apps/core-element-plus/src/views/piggy/components/GroupSelect.vue) 下拉且设为必填，默认值由 `0` 改为 `undefined`，杜绝建出无分组菜品 |
| Dashboard 无自动刷新 | ⏸️ 未做 —— 需手动刷新页面。数据量小、非高频看板，加轮询收益不大 |

### 8.3 角色权限配置说明

- 权限码清单集中在 [admin-permissions.ts](../nest-service/src/modules/admin/admin-permissions.ts) 的 `ALL_PERMISSIONS`（分 7 组），新增业务模块时在此补一行，并在前端路由 `meta.auth` 引用。
- 运行时取值来自 `admin_role_permissions` 表；表数据缺失或 JSON 损坏时回落到 `DEFAULT_ROLE_PERMISSIONS`，不会导致登录失败。
- 权限随 `permissions[]` 在登录/`profile` 时下发，**修改后需该角色成员重新登录才生效**（不做实时推送）。
- `AdminRoleGuard` 的 operator 禁访问路径已含 `role-permissions`，防止 operator 自行提权。
