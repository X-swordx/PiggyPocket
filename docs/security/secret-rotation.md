# 密钥泄露处置：Milvus Token

## 结论

`deploy/cloud/.env.example` 曾把 `MILVUS_TOKEN` 和真实模板 ID 当示例值提交。该 token 从 commit `2c3fda9` 起进入 git 历史，仅在当前工作区删除**不等于**风险已解除。

**必须先在 Zilliz 控制台轮换 token，再清理 git 历史。** 顺序不能反：历史清理不会让已经泄露的 token 失效。

## 1. 立即轮换（必须人工执行）

1. 登录 Zilliz Cloud 控制台，找到对应集群/Collection。
2. 吊销旧 token，创建新 token（只给最小权限）。
3. 更新 production 服务器上的 `deploy/cloud/.env`：
   ```bash
   MILVUS_TOKEN=<new-token>
   ```
4. 重启 API，确认语义搜索恢复：
   ```bash
   cd /home/admin/PiggyPocket/deploy/cloud
   docker compose -p piggy-pocket up -d api
   ./healthcheck.sh
   ```
5. 如果仓库是公开的，检查 Zilliz 的访问/审计日志，确认旧 token 是否被外部使用。

> 模板 ID 不是密钥，但也不应该出现在示例文件里；已在 `.env.example` 改为占位符。

## 2. 清理当前工作区

已完成：`deploy/cloud/.env.example` 里的 token、实例地址、模板 ID 已替换为占位符。

确认当前树没有残留：

```bash
git grep -n "MILVUS_TOKEN=" -- . ':!docs/security/secret-rotation.md'
gitleaks detect --source . --no-git --redact
```

## 3. 清理 git 历史（破坏性，需团队确认）

> 这一步会改写 commit hash，所有协作者都必须重新 clone。执行前先备份仓库，并确认没有未推送的本地分支。

安装 `git-filter-repo` 后：

```bash
# replacements.txt 里写：literal:<旧 token>==>REMOVED
# 不要把旧 token 写进任何会提交的文件
git filter-repo --replace-text replacements.txt
git push --force --all
git push --force --tags
```

如果只想移除该文件的全部历史（更粗暴，但更简单）：

```bash
git filter-repo --path deploy/cloud/.env.example --invert-paths
```

清理后让所有协作者重新 clone，旧 clone 仍然保留泄露内容。

## 4. 防止再次发生

- `.env.example` 只允许占位符；真实值只放 `.env`（已被 `.gitignore` 忽略）。
- CI 跑 `secret-scan`（gitleaks），当前工作树扫描失败就阻止合并。
- 本地安装 pre-push hook：
  ```bash
  ./scripts/install-git-hooks.sh
  ```
- 任何新接入的云服务，先确认密钥只通过环境变量注入，不写进文档/示例/测试。

## 5. 记录

| 项目 | 内容 |
| --- | --- |
| 发现时间 | 2026-10-25 |
| 泄露载体 | `deploy/cloud/.env.example` |
| 首次进入历史 | `2c3fda9` |
| 轮换完成时间 | 待填 |
| 历史清理完成时间 | 待填（需团队确认） |
| 执行人 | 待填 |
