# Stage 环境

Stage 是 production 之前的预演环境。它可以同时包含多个**未验收**的任务，因此：

> **绝不能把 stage 分支直接合并/发布到 production。**
> production 只接收单个已验收的 `feature/<task>` 分支。

## 与 production 的隔离项

| 资源 | Stage | Production |
| --- | --- | --- |
| Compose 项目 | `piggy-pocket-stage` | `piggy-pocket` |
| 容器前缀 | `piggy-stage` | `piggy` |
| MySQL 数据目录 | `/home/admin/PiggyPocket/stage/data` | `/home/admin/PiggyPocket/data` |
| 数据库 | `piggy_pocket_stage` | `piggy_pocket` |
| 对外端口 | 8080 / 8081 / 8443 | 80 / 81 / 443 |
| OSS | 独立 bucket 或前缀 | production bucket |
| 微信 | 测试号/测试小程序 | 正式小程序 |
| 域名 | `stage-api.yourdomain.com` | `api.yourdomain.com` |

## 首次部署

```bash
cd deploy/stage
cp .env.stage.example .env.stage
# 编辑 .env.stage，填入 stage 的独立数据库、域名、微信测试号、OSS、AI key
chmod +x deploy.sh healthcheck.sh
./deploy.sh
```

然后在 Nginx Proxy Manager 里新增两个 Proxy Host：

- `stage-api.yourdomain.com` → `api:3000`
- `stage-admin.yourdomain.com` → `admin:80`

## 日常发布

```bash
git switch stage
git merge --no-ff develop -m "Promote develop to stage: <功能简述>"
cd deploy/stage
./deploy.sh
```

部署完成后，按当前需求的 AC 和 `BOT`/人工走查用例验证；主流程回归也要跑。

## 人工验收

在 Stage 环境验收，不要在本地 worktree 验收。验收记录写到 `docs/releases/<tag>.md`，至少包含：

- 验收环境 URL
- 每条 AC 的通过/不通过
- 测试名或 BOT 截图
- 偏离理解卡的地方及原因
- 验收人、时间

只有用户明确回复「stage 验收通过」，才允许进入 production。
