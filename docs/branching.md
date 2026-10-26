# 分支与发布

## 分支模型

```
feature/<task>  →  develop  →  stage  →  production
```

| 分支 | 用途 | 谁能合入 | 部署 |
| --- | --- | --- | --- |
| `feature/<task>` | 单个需求/修复，独立 worktree | 开发者 | 本地 |
| `develop` | 集成，只汇总 | PR + CI | 无 |
| `stage` | 预演，可混多个未验收任务 | PR + CI | Stage |
| `production` | 生产，只接收单个已验收 feature | PR + CI + Stage 验收 | Production |
| `main` | 主分支/镜像，不直接开发 | PR | 无 |

## 单 feature 发布

```bash
# 1. 从 develop 切 feature，在独立 worktree 实现
git switch develop
git switch -c feature/<task>
git worktree add ../PiggyPocket-<task> feature/<task>

# 2. 在 feature 分支完成 spec/AC、测试、自走查
# 3. 合入 develop
git switch develop
git merge --no-ff feature/<task> -m "Merge <task> into develop"

# 4. 提升到 stage
git switch stage
git merge --no-ff develop -m "Promote develop to stage: <task>"
cd deploy/stage && ./deploy.sh

# 5. 用户在 stage 按 AC 验收，记录到 docs/releases/<tag>.md
# 6. 只把本次 feature 合入 production
git switch production
git merge --no-ff feature/<task> -m "Merge <task> into production"
cd deploy/cloud && ./release.sh v2026.10.25-<task>
```

**禁止**：

```bash
# 不允许
git switch production
git merge stage
```

Stage 上可能混着其他未验收任务，`stage → production` 会把别人的改动一起带上线。

## 发布前检查

```bash
git log --oneline production..feature/<task>
git log --oneline production..stage
```

第二条只要出现不属于本任务的提交，就说明不能走 `stage → production`。

## 分支保护

远端仓库需要开启保护。安装 `gh` 后运行：

```bash
./scripts/setup-branch-protection.sh
```

它会要求 `main`、`production` 至少 1 个 review，`develop`、`stage` 至少走 PR；四个分支都要求 CI 绿、禁止 force push/删除。

本地还会安装 pre-push hook，阻止直接 push `main`/`production`：

```bash
./scripts/install-git-hooks.sh
```
