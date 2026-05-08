# 猪猪口袋后端服务

## 技术栈

- Nest.js 10.x
- MySQL 8.x
- TypeORM 0.3.x
- Swagger API 文档

## 功能模块

### 美食搭子
- 用户管理
- 菜品管理
- 饭搭子组队
- 订单管理


## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置数据库

 `.env`：修改数据库配置：

```bash
cp .env.example .env
```

### 3. 创建数据库

```sql
CREATE DATABASE nest_demo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. 启动项目

```bash
npm run start:dev
```

### 5. 访问 API 文档

打开浏览器访问: http://localhost:3000/api

## API 接口

### 美食搭子
- `/users` - 用户管理
- `/dishes` - 菜品管理
- `/dining-groups` - 饭搭子组
- `/orders` - 订单管理
