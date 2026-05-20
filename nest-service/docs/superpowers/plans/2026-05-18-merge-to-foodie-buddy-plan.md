# Merge Modules to FoodieBuddy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将四个独立模块（user, dish, dining-group, order）合并为一个 foodie-buddy 模块，更新所有相关引用和路由

**Architecture:** 在 foodie-buddy 目录下保留各功能子目录，通过统一的 FoodieBuddyModule 整合，所有控制器添加 /foodie-buddy 路由前缀

**Tech Stack:** Nest.js 10.x, TypeScript, TypeORM 0.3.x

---

## File Structure Mapping

**New Files:**
- `nest-service/src/modules/foodie-buddy/foodie-buddy.module.ts

**Files to Move:**
- `nest-service/src/modules/user/* → `nest-service/src/modules/foodie-buddy/user/*
- `nest-service/src/modules/dish/* → `nest-service/src/modules/foodie-buddy/dish/*
- `nest-service/src/modules/dining-group/* → `nest-service/src/modules/foodie-buddy/dining-group/*
- `nest-service/src/modules/order/* → `nest-service/src/modules/foodie-buddy/order/*

**Files to Modify:**
- `nest-service/src/app.module.ts
- All controllers - update import paths and add route prefix

---

## Task 1: Create foodie-buddy Module File

**Files:**
- Create: `nest-service/src/modules/foodie-buddy/foodie-buddy.module.ts`

- [ ] **Step 1: Create the module file**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// User
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { User } from './user/entities/user.entity';

// Dish
import { DishController } from './dish/dish.controller';
import { DishService } from './dish/dish.service';
import { Dish } from './dish/entities/dish.entity';

// Dining Group
import { DiningGroupController } from './dining-group/dining-group.controller';
import { DiningGroupService } from './dining-group/dining-group.service';
import { DiningGroup } from './dining-group/entities/dining-group.entity';
import { DiningGroupMember } from './dining-group/entities/dining-group-member.entity';

// Order
import { OrderController } from './order/order.controller';
import { OrderService } from './order/order.service';
import { Order } from './order/entities/order.entity';
import { OrderItem } from './order/entities/order-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Dish,
      DiningGroup,
      DiningGroupMember,
      Order,
      OrderItem,
    ]),
  ],
  controllers: [
    UserController,
    DishController,
    DiningGroupController,
    OrderController,
  ],
  providers: [
    UserService,
    DishService,
    DiningGroupService,
    OrderService,
  ],
})
export class FoodieBuddyModule {}
```

- [ ] **Step 2: Verify directory structure**

Run: `ls -la nest-service/src/modules/foodie-buddy/`
Expected: Directory structure is created, no TypeScript errors at this point

- [ ] **Step 3: Commit**

```bash
git add nest-service/src/modules/foodie-buddy/foodie-buddy.module.ts
git commit -m "feat: create foodie-buddy module skeleton"
```

---

## Task 2: Move User Module Files

**Files:**
- Move: `nest-service/src/modules/user/*` → `nest-service/src/modules/foodie-buddy/user/*`
- Modify: `nest-service/src/modules/foodie-buddy/user/user.controller.ts` - add route prefix

- [ ] **Step 1: Create user subdirectory**

```bash
mkdir -p nest-service/src/modules/foodie-buddy/user
mkdir -p nest-service/src/modules/foodie-buddy/user/entities
mkdir -p nest-service/src/modules/foodie-buddy/user/dto
```

- [ ] **Step 2: Move files**

```bash
mv nest-service/src/modules/user/user.controller.ts nest-service/src/modules/foodie-buddy/user/user.controller.ts
mv nest-service/src/modules/user/user.service.ts nest-service/src/modules/foodie-buddy/user/user.service.ts
mv nest-service/src/modules/user/user.module.ts nest-service/src/modules/foodie-buddy/user/user.module.ts
mv nest-service/src/modules/user/entities/user.entity.ts nest-service/src/modules/foodie-buddy/user/entities/user.entity.ts
mv nest-service/src/modules/user/dto/create-user.dto.ts nest-service/src/modules/foodie-buddy/user/dto/create-user.dto.ts
mv nest-service/src/modules/user/dto/update-user.dto.ts nest-service/src/modules/foodie-buddy/user/dto/update-user.dto.ts
mv nest-service/src/modules/user/*.spec.ts nest-service/src/modules/foodie-buddy/user/ 2>/dev/null || true
```

- [ ] **Step 3: Update controller route prefix**

Modify `nest-service/src/modules/foodie-buddy/user/user.controller.ts`:
Change `@Controller('users')` → `@Controller('foodie-buddy/users')`

- [ ] **Step 4: Commit**

```bash
git add nest-service/src/modules/foodie-buddy/user/
git commit -m "feat: move user module to foodie-buddy"
```

---

## Task 3: Move Dish Module Files

**Files:**
- Move: `nest-service/src/modules/dish/*` → `nest-service/src/modules/foodie-buddy/dish/*`
- Modify: `nest-service/src/modules/foodie-buddy/dish/dish.controller.ts` - add route prefix

- [ ] **Step 1: Create dish subdirectory**

```bash
mkdir -p nest-service/src/modules/foodie-buddy/dish
mkdir -p nest-service/src/modules/foodie-buddy/dish/entities
mkdir -p nest-service/src/modules/foodie-buddy/dish/dto
```

- [ ] **Step 2: Move files**

```bash
mv nest-service/src/modules/dish/dish.controller.ts nest-service/src/modules/foodie-buddy/dish/dish.controller.ts
mv nest-service/src/modules/dish/dish.service.ts nest-service/src/modules/foodie-buddy/dish/dish.service.ts
mv nest-service/src/modules/dish/dish.module.ts nest-service/src/modules/foodie-buddy/dish/dish.module.ts
mv nest-service/src/modules/dish/entities/dish.entity.ts nest-service/src/modules/foodie-buddy/dish/entities/dish.entity.ts
mv nest-service/src/modules/dish/dto/create-dish.dto.ts nest-service/src/modules/foodie-buddy/dish/dto/create-dish.dto.ts
mv nest-service/src/modules/dish/dto/update-dish.dto.ts nest-service/src/modules/foodie-buddy/dish/dto/update-dish.dto.ts
mv nest-service/src/modules/dish/*.spec.ts nest-service/src/modules/foodie-buddy/dish/ 2>/dev/null || true
```

- [ ] **Step 3: Update controller route prefix**

Modify `nest-service/src/modules/foodie-buddy/dish/dish.controller.ts`:
Change `@Controller('dishes')` → `@Controller('foodie-buddy/dishes')`

- [ ] **Step 4: Commit**

```bash
git add nest-service/src/modules/foodie-buddy/dish/
git commit -m "feat: move dish module to foodie-buddy"
```

---

## Task 4: Move Dining-Group Module Files

**Files:**
- Move: `nest-service/src/modules/dining-group/*` → `nest-service/src/modules/foodie-buddy/dining-group/*`
- Modify: `nest-service/src/modules/foodie-buddy/dining-group/dining-group.controller.ts` - add route prefix
- Modify: `nest-service/src/modules/foodie-buddy/dining-group/dining-group.service.ts` - update UserService import

- [ ] **Step 1: Create dining-group subdirectory**

```bash
mkdir -p nest-service/src/modules/foodie-buddy/dining-group
mkdir -p nest-service/src/modules/foodie-buddy/dining-group/entities
mkdir -p nest-service/src/modules/foodie-buddy/dining-group/dto
```

- [ ] **Step 2: Move files**

```bash
mv nest-service/src/modules/dining-group/dining-group.controller.ts nest-service/src/modules/foodie-buddy/dining-group/dining-group.controller.ts
mv nest-service/src/modules/dining-group/dining-group.service.ts nest-service/src/modules/foodie-buddy/dining-group/dining-group.service.ts
mv nest-service/src/modules/dining-group/dining-group.module.ts nest-service/src/modules/foodie-buddy/dining-group/dining-group.module.ts
mv nest-service/src/modules/dining-group/entities/dining-group.entity.ts nest-service/src/modules/foodie-buddy/dining-group/entities/dining-group.entity.ts
mv nest-service/src/modules/dining-group/entities/dining-group-member.entity.ts nest-service/src/modules/foodie-buddy/dining-group/entities/dining-group-member.entity.ts
mv nest-service/src/modules/dining-group/dto/*.ts nest-service/src/modules/foodie-buddy/dining-group/dto/
mv nest-service/src/modules/dining-group/*.spec.ts nest-service/src/modules/foodie-buddy/dining-group/ 2>/dev/null || true
```

- [ ] **Step 3: Update controller route prefix**

Modify `nest-service/src/modules/foodie-buddy/dining-group/dining-group.controller.ts`:
Change `@Controller('dining-groups')` → `@Controller('foodie-buddy/dining-groups')`

- [ ] **Step 4: Update UserService import in service**

Modify `nest-service/src/modules/foodie-buddy/dining-group/dining-group.service.ts`:
Change `import { UserService } from '../user/user.service';` → `import { UserService } from '../../user/user.service';`

- [ ] **Step 5: Commit**

```bash
git add nest-service/src/modules/foodie-buddy/dining-group/
git commit -m "feat: move dining-group module to foodie-buddy"
```

---

## Task 5: Move Order Module Files

**Files:**
- Move: `nest-service/src/modules/order/*` → `nest-service/src/modules/foodie-buddy/order/*`
- Modify: `nest-service/src/modules/foodie-buddy/order/order.controller.ts` - add route prefix

- [ ] **Step 1: Create order subdirectory**

```bash
mkdir -p nest-service/src/modules/foodie-buddy/order
mkdir -p nest-service/src/modules/foodie-buddy/order/entities
mkdir -p nest-service/src/modules/foodie-buddy/order/dto
```

- [ ] **Step 2: Move files**

```bash
mv nest-service/src/modules/order/order.controller.ts nest-service/src/modules/foodie-buddy/order/order.controller.ts
mv nest-service/src/modules/order/order.service.ts nest-service/src/modules/foodie-buddy/order/order.service.ts
mv nest-service/src/modules/order/order.module.ts nest-service/src/modules/foodie-buddy/order/order.module.ts
mv nest-service/src/modules/order/entities/order.entity.ts nest-service/src/modules/foodie-buddy/order/entities/order.entity.ts
mv nest-service/src/modules/order/entities/order-item.entity.ts nest-service/src/modules/foodie-buddy/order/entities/order-item.entity.ts
mv nest-service/src/modules/order/dto/*.ts nest-service/src/modules/foodie-buddy/order/dto/
mv nest-service/src/modules/order/*.spec.ts nest-service/src/modules/foodie-buddy/order/ 2>/dev/null || true
```

- [ ] **Step 3: Update controller route prefix**

Modify `nest-service/src/modules/foodie-buddy/order/order.controller.ts`:
Change `@Controller('orders')` → `@Controller('foodie-buddy/orders')`

- [ ] **Step 4: Commit**

```bash
git add nest-service/src/modules/foodie-buddy/order/
git commit -m "feat: move order module to foodie-buddy"
```

---

## Task 6: Update AppModule

**Files:**
- Modify: `nest-service/src/app.module.ts`

- [ ] **Step 1: Update imports**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodieBuddyModule } from './modules/foodie-buddy/foodie-buddy.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 3306),
        username: configService.get('DB_USERNAME', 'root'),
        password: configService.get('DB_PASSWORD', ''),
        database: configService.get('DB_DATABASE', 'nest_demo'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: true,
        timezone: '+08:00',
      }),
      inject: [ConfigService],
    }),
    FoodieBuddyModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 2: Verify no syntax errors**

Run: `cd nest-service && npx tsc --noEmit 2>&1 | head -50`
Expected: No import errors related to the modules

- [ ] **Step 3: Commit**

```bash
git add nest-service/src/app.module.ts
git commit -m "feat: update AppModule to use FoodieBuddyModule"
```

---

## Task 7: Fix Relative Import Paths in Services and DTOs

**Files:**
- Modify: All service files for entity and dto imports within foodie-buddy

- [ ] **Step 1: Fix user service/dto imports**

Check and fix any relative imports in:
- `nest-service/src/modules/foodie-buddy/user/user.service.ts`
- `nest-service/src/modules/foodie-buddy/user/user.controller.ts`
- `nest-service/src/modules/foodie-buddy/user/dto/*.ts`

Verify they use correct relative paths like `./entities/user.entity`, `./dto/create-user.dto.ts`

- [ ] **Step 2: Fix dish service/dto imports**

Check and fix any relative imports in:
- `nest-service/src/modules/foodie-buddy/dish/dish.service.ts`
- `nest-service/src/modules/foodie-buddy/dish/dish.controller.ts`
- `nest-service/src/modules/foodie-buddy/dish/dto/*.ts`

- [ ] **Step 3: Fix dining-group service/dto imports**

Check and fix any relative imports in:
- `nest-service/src/modules/foodie-buddy/dining-group/dining-group.service.ts`
- `nest-service/src/modules/foodie-buddy/dining-group/dining-group.controller.ts`
- `nest-service/src/modules/foodie-buddy/dining-group/dto/*.ts`
- `nest-service/src/modules/foodie-buddy/dining-group/entities/*.ts`

- [ ] **Step 4: Fix order service/dto imports**

Check and fix any relative imports in:
- `nest-service/src/modules/foodie-buddy/order/order.service.ts`
- `nest-service/src/modules/foodie-buddy/order/order.controller.ts`
- `nest-service/src/modules/foodie-buddy/order/dto/*.ts`
- `nest-service/src/modules/foodie-buddy/order/entities/*.ts`

- [ ] **Step 5: Commit**

```bash
git add nest-service/src/modules/foodie-buddy/
git commit -m "fix: update relative import paths"
```

---

## Task 8: Fix Test File Imports

**Files:**
- Modify: All `*.spec.ts` files under foodie-buddy

- [ ] **Step 1: Update user test imports**

Fix imports in `nest-service/src/modules/foodie-buddy/user/*.spec.ts`
Update paths to match new directory structure

- [ ] **Step 2: Update dish test imports**

Fix imports in `nest-service/src/modules/foodie-buddy/dish/*.spec.ts`

- [ ] **Step 3: Update dining-group test imports**

Fix imports in `nest-service/src/modules/foodie-buddy/dining-group/*.spec.ts`

- [ ] **Step 4: Update order test imports**

Fix imports in `nest-service/src/modules/foodie-buddy/order/*.spec.ts`

- [ ] **Step 5: Commit**

```bash
git add nest-service/src/modules/foodie-buddy/**/*.spec.ts
git commit -m "fix: update test file import paths"
```

---

## Task 9: Delete Old Module Directories

**Files:**
- Delete: `nest-service/src/modules/user/`
- Delete: `nest-service/src/modules/dish/`
- Delete: `nest-service/src/modules/dining-group/`
- Delete: `nest-service/src/modules/order/`

- [ ] **Step 1: Remove old directories**

```bash
rm -rf nest-service/src/modules/user
rm -rf nest-service/src/modules/dish
rm -rf nest-service/src/modules/dining-group
rm -rf nest-service/src/modules/order
```

- [ ] **Step 2: Verify deletion**

Run: `ls nest-service/src/modules/`
Expected: Only `foodie-buddy` directory remains

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "cleanup: remove old module directories"
```

---

## Task 10: Verify Build and Run Tests

**Files:**
- Verify: TypeScript compilation
- Run: Unit tests

- [ ] **Step 1: Run TypeScript compilation check**

```bash
cd nest-service
npx tsc --noEmit
```
Expected: No TypeScript errors

- [ ] **Step 2: Run unit tests**

```bash
npm run test
```
Expected: All tests pass

- [ ] **Step 3: Start dev server and verify API routes**

```bash
npm run start:dev
```
Then verify: http://localhost:3000/api shows all routes under /foodie-buddy prefix

- [ ] **Step 4: Commit verification note**

```bash
git commit --allow-empty -m "verify: build passes, all tests green, API routes updated"
```

---

## Post-Implementation Checklist

- [ ] All four modules moved to foodie-buddy directory
- [ ] All controllers have `/foodie-buddy` route prefix
- [ ] All relative import paths updated
- [ ] AppModule imports FoodieBuddyModule instead of four separate modules
- [ ] Old module directories deleted
- [ ] TypeScript compilation passes
- [ ] All unit tests pass
- [ ] Swagger API documentation shows correct route prefixes
