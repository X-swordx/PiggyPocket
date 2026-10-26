# P0 交付质量闸门

## 问题陈述

当前 AI 交付流程缺少可执行验收、Stage 环境、健康检查/告警和一键回滚；同时 `deploy/cloud/.env.example` 曾包含真实 Milvus token。结果是：需求是否做完靠感觉、上线后是否健康靠用户反馈、出问题回滚靠手工 `git checkout`。

## 解决方案

先建立最小可用的交付闭环：

1. 需求 spec/理解卡/复现契约模板，AC 必须可执行；
2. `feature/* → develop → stage → production` 分支模型和 Stage 环境；
3. `/api/health/live`、`/api/health/ready`、Docker healthcheck、健康检查脚本；
4. 部署前自动备份、production 发布 tag + manifest、一键回滚；
5. 清理当前工作区的真实密钥，加入 secret scan，并记录轮换步骤。

## 用户故事

- **US-1** 作为开发者，我想要在写代码前把 AC 写成可执行的检查，以便 AI 和我对「做完」有同一个标准。
- **US-2** 作为发布者，我想要在 production 之前有一个真实 Stage 环境，以便在部署后验收而不是在本地验收。
- **US-3** 作为值班者，我想要快速判断线上是否健康，并在出问题时回滚到上一个稳定版本。
- **US-4** 作为仓库维护者，我想要 production 只包含单个已验收 feature，且密钥不再进入版本库。

## 验收标准

- **AC-1** 新需求有 spec/理解卡/复现契约，且每条 AC 都有「怎么验」。〔覆盖 US-1〕
  - **怎么验**：人工走查 `docs/specs/` 模板和本次 spec；检查每条 AC 都有测试类型。
- **AC-2** `nest-service` 暴露 `/api/health/live` 和 `/api/health/ready`，后者在 DB 不可用时返回 503。〔覆盖 US-3〕
  - **怎么验**：后台测试 `health.controller.spec.ts`；部署后用 `curl` 验证 200/503。
- **AC-3** Docker Compose 为 api/admin 配置 healthcheck，并给所有服务配置日志轮转。〔覆盖 US-3〕
  - **怎么验**：`docker compose config` + 人工检查 `docker-compose.yml`。
- **AC-4** `deploy.sh` 在已有数据时先备份；备份失败不继续部署；部署后等待 API ready 并检查 admin。〔覆盖 US-3〕
  - **怎么验**：脚本语法检查 + Stage 部署演练 + 查看备份文件。
- **AC-5** `release.sh` 从 production 分支构建 admin、打 tag、写 manifest、部署；`rollback.sh` 能用该 tag 和 admin 产物回滚。〔覆盖 US-3, US-4〕
  - **怎么验**：Stage/测试环境演练一次 release + rollback；检查 manifest 和健康检查。
- **AC-6** Stage 有独立 compose 项目、数据库、端口、OSS/微信配置示例和部署脚本。〔覆盖 US-2〕
  - **怎么验**：人工走查 `deploy/stage/`；在测试机执行 `./deploy.sh`。
- **AC-7** `main`/`production` 不能直接 push；有分支保护脚本、pre-push hook 和 CI。〔覆盖 US-4〕
  - **怎么验**：`git push` 到 main 被 hook 拒绝；CI 三个 job 绿；远端保护设置截图/命令输出。
- **AC-8** 当前工作区不再包含真实 Milvus token/模板 ID；CI 有 secret-scan；轮换步骤有文档。〔覆盖 US-4〕
  - **怎么验**：`git grep` 无真实值；`gitleaks detect --source . --no-git` 通过；按 `docs/security/secret-rotation.md` 完成轮换。
- **AC-9** 后端 `npm run build` 和 `npm test` 通过，admin build 通过。〔覆盖 US-1, US-4〕
  - **怎么验**：本地/CI 执行命令。

## 测试决策

### 接缝

- 后端健康检查：Nest controller 单测（mock `DataSource`）。
- 部署脚本：`bash -n` 语法检查 + Stage 环境演练。
- 密钥：gitleaks working-tree 扫描。
- 分支保护：pre-push hook 本地验证 + GitHub 分支保护 API。

### BOT 用例

本 P0 主要是基础设施，不涉及用户页面，不新增 BOT。Stage 验收时对现有 P0 用户流程做冒烟走查。

### 主流程回归

会影响部署启动流程（healthcheck、migration、admin 静态站点），因此 Stage 首次部署后必须走一遍登录、菜品列表、AI 菜谱入口、到期管家列表。

## 实现决策

- 健康检查不引入 Terminus，直接用 `DataSource.query('SELECT 1')`，少一个依赖。
- Stage 与 production 共用 `docker-compose.yml`，通过 `COMPOSE_PROJECT_NAME` / `CONTAINER_PREFIX` / 端口环境变量隔离。
- production 回滚在临时 worktree 中检出 tag，避免切换当前分支或运行中被旧脚本替换。
- admin 仍是本地构建产物，但 release 时打包并记录 sha256；rollback 恢复该产物，保证回滚前后端一致。

## 涉及层与路径

- 路径：D（不碰 UI）+ 部署/CI 基础设施。
- 涉及层：NestJS health controller、Docker Compose、部署脚本、GitHub Actions、文档。
- 设计产物：无。

## 不在范围内

- 完整 Playwright/小程序自动化测试套件（P1）。
- Prometheus/Grafana/Sentry 全量指标（P1/P2）。
- 自动 restore drill（P2）。
- 重写 git 历史（破坏性，需团队确认后单独执行）。

## 补充说明

泄露 token 的轮换必须在 Zilliz 控制台人工完成；清理当前工作区不能替代轮换。
