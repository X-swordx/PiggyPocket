---
name: merge-modules-into-foodie-buddy
description: 将四个独立模块（user, dish, dining-group, order）合并为一个 foodie-buddy 模块
---

# 模块合并设计文档

## 背景

当前项目有四个独立的 NestJS 模块处理美食搭子相关功能：
- user - 用户管理
- dish - 菜品管理
- dining-group - 饭搭子组队
- order - 订单管理

这些模块功能紧密相关，属于同一个业务域"美食搭子"，因此合并为一个模块可以更好地组织代码。

## 设计决策

### 1. 目录结构 - 选项A

在 `foodie-buddy` 下保留子目录，保持功能分离：

```
nest-service/src/modules/foodie-buddy/
├── foodie-buddy.module.ts
├── user/
│   ├── user.controller.ts
│   ├── user.service.ts
│   ├── entities/
│   │   └── user.entity.ts
│   └── dto/
│       ├── create-user.dto.ts
│       └── update-user.dto.ts
├── dish/
│   ├── dish.controller.ts
│   ├── dish.service.ts
│   ├── entities/
│   └── dto/
├── dining-group/
│   ├── dining-group.controller.ts
│   ├── dining-group.service.ts
│   ├── entities/
│   └── dto/
└── order/
    ├── order.controller.ts
    ├── order.service.ts
    ├── entities/
    └── dto/
```

**理由：** 保持功能边界清晰，便于维护。

### 2. API 路由 - 选项B

统一前缀 `/foodie-buddy`，使用 NestJS 的路由前缀功能：

- `/foodie-buddy/users` - 用户管理
- `/foodie-buddy/dishes` - 菜品管理
- `/foodie-buddy/dining-groups` - 饭搭子组
- `/foodie-buddy/orders` - 订单管理

**理由：** 路由结构与模块结构对应，清晰明了。

### 3. 模块导出策略 - 选项C

不导出任何内部服务，所有服务仅在 `FoodieBuddyModule` 内部使用。

**理由：** 用户确认这些服务只在模块内使用，外部模块不会依赖。

### 4. 实体引用 - 选项A

所有引用直接使用新路径，不使用 index.ts 聚合导出。

**理由：** 引用路径与实际文件位置对应，便于定位。

## 实现步骤

### 阶段一：创建新结构
1. 创建 `foodie-buddy` 目录及其子目录
2. 创建 `foodie-buddy.module.ts`

### 阶段二：移动文件
1. 移动 user 模块文件到新位置
2. 移动 dish 模块文件到新位置
3. 移动 dining-group 模块文件到新位置
4. 移动 order 模块文件到新位置

### 阶段三：更新引用
1. 更新 `foodie-buddy.module.ts` 内的相对路径引用
2. 更新各 service 之间的相对路径引用（dining-group -> user）
3. 更新 dto 和 entity 的内部引用

### 阶段四：更新模块配置
1. 在 `foodie-buddy.module.ts` 中整合四个子模块的配置
2. 更新所有控制器的路由前缀为 `/foodie-buddy`

### 阶段五：更新 AppModule
1. 替换旧模块导入为 `FoodieBuddyModule`

### 阶段六：清理
1. 删除旧的四个模块目录
2. 运行 TypeScript 编译检查
3. 运行测试

## 依赖关系

当前模块间依赖：
- `dining-group` 依赖 `user` 模块的 `UserService`

合并后，两个 service 在同一模块下，直接相对路径引用即可。

## 风险评估

1. **路径引用错误** - 大量文件移动可能导致路径引用错误
   - 缓解：编译检查 + 测试验证

2. **路由变更影响** - API 路径变更可能影响前端
   - 缓解：已确认用户接受此变更，需同步通知前端团队

3. **测试文件同步更新** - 测试文件也需要更新路径
   - 缓解：移动测试文件并更新导入

## 验证标准

1. TypeScript 编译无错误
2. 所有单元测试通过
3. API 文档可正常访问，路由前缀正确
4. 所有接口功能正常
