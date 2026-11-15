# 🐷 猪猪生活本 (PiggyPocket)

> 私人百宝箱小程序 - 你的生活好帮手

🌐 **官网：** https://admin.piggy-pocket.xyz/site/

猪猪生活本是一个私人百宝箱小程序，围绕家庭日常生活提供便捷工具。目前覆盖**到期管家**、**美食菜单**、**心愿清单**、**搭伙管理**、**拉粑粑么**、**我的 · 历史菜单**六个模块。

## 🌐 官网

- 线上地址：https://admin.piggy-pocket.xyz/site/
- 官网使用真实产品截图与真实页面元素坐标制作，包含 9 幕滚动故事和 6 张功能模块卡

## 📱 项目构成

| 模块       | 技术栈              | 说明                                     |
| ---------- | ------------------- | ---------------------------------------- |
| 小程序前端 | UniApp (Vue3)       | 跨平台小程序，目前主要发布微信小程序     |
| 后端服务   | NestJS + TypeScript | 提供 RESTful API，负责业务逻辑与数据存储 |
| 管理后台   | Vue3 + Element Plus | 运营管理后台，支持数据配置与用户管理     |
| 产品官网   | React 19 + Vite     | 真实截图驱动的滚动叙事介绍页             |

## ✨ 核心功能

### 功能模块

- **🕐 到期管家**：食品药品化妆品，家里什么时候到期我都替你记着；提前几天微信提醒，还能语义搜索找物品
- **🍽️ 美食菜单**：上传菜谱、生成今日菜单，按食材和口味推荐下一顿
- **💝 心愿清单**：管理你的购物愿望，旅行计划，实现目标的成就感
- **👫 搭伙管理**：与另一半或者好友组成搭子，共享菜单、订单和生活记录
- **🚽 拉粑粑么**：记录时间与状态，查看月度日历和健康建议
- **📖 我的 · 历史菜单**：查看订单、历史菜单、评分和个人统计

## 🛠 技术栈一览

| 层级     | 技术                               | 备注                 |
| -------- | ---------------------------------- | -------------------- |
| 小程序   | UniApp、Vue 3、Pinia、Vite         | 一套代码多端运行     |
| 后端     | NestJS、TypeORM、MySQL、Redis、JWT | 模块化架构，依赖注入 |
| 管理后台 | Vue 3、Vite、Element Plus、Pinia   | 响应式管理界面       |
| 产品官网 | React 19、Vite、Motion、Playwright | 滚动叙事与自动化验收 |
| 部署     | Docker、阿里云广州、NPM            | 国内直连 HTTPS 入口  |

## 📁 项目结构
PiggyPocket/
- miniProgram/ # UniApp 小程序源码
- nest-service/ # NestJS 后端服务
- admin/ # Vue3 管理后台
- site/ # 产品官网源码与验收脚本
- README.md

## 📝 开发规范
后端使用 ESLint + Prettier 统一代码风格

提交信息遵循 Conventional Commits（如 feat: 添加心愿清单模块）

## 🚦 交付与发布

- 产品官网：[https://admin.piggy-pocket.xyz/site/](https://admin.piggy-pocket.xyz/site/)
- 分支模型与单 feature 发布：[docs/branching.md](docs/branching.md)
- 需求 spec / AC / BOT 模板：[docs/specs/README.md](docs/specs/README.md)
- 生产发布、健康检查、回滚：[deploy/cloud/README.md](deploy/cloud/README.md)
- 告警值班手册：[docs/runbooks/health.md](docs/runbooks/health.md)
- Stage 环境：[deploy/stage/README.md](deploy/stage/README.md)
- 密钥泄露处置：[docs/security/secret-rotation.md](docs/security/secret-rotation.md)

## 📄 License
MIT

## 🙏 致谢
使用过程有任何问题和建议，欢迎PR互相学习交流。
