# CLAUDE.md

## 1. 编码前思考

**不要假设。不要隐藏困惑。权衡利弊。**

实施前：
- 明确陈述你的假设。如果不确定，请问。
- 如果存在多种解释，请提出它们——不要默默选择。
- 如果存在更简单的方法，请说明。必要时提出反对意见。
- 如果有不清楚的地方，停下来。说出困惑所在。请问。

## 2. 简洁优先

**解决问题的最少代码。不作任何推测。**

- 不添加超出要求的功能。
- 不为单次使用的代码创建抽象。
- 不添加未被要求的"灵活性"或"可配置性"。
- 不为不可能发生的场景添加错误处理。
- 如果你写了 200 行代码，而其实 50 行就能解决，请重写。

问问自己："高级工程师会说这过于复杂吗？"如果答案是肯定的，请简化。

## 3. 精准修改

**只碰必须碰的内容。只清理自己造成的混乱。**

编辑现有代码时：
- 不要"改进"相邻代码、注释或格式。
- 不要重构未损坏的内容。
- 匹配现有风格，即使你会用不同方式写。
- 如果你注意到不相关的死代码，请提出来——不要删除。

当你的修改产生孤儿时：
- 移除因你的修改而变得未使用的导入/变量/函数。
- 除非被要求，否则不要移除预先存在的死代码。

测试：每一行修改都应直接追溯到用户的请求。

## 4. 目标驱动执行

**定义成功标准。循环直到验证通过。**

将任务转化为可验证的目标：
- "添加验证" → "为无效输入编写测试，然后让测试通过"
- "修复 bug" → "编写重现测试，然后让测试通过"
- "重构 X" → "确保重构前后测试都通过"

对于多步骤任务，陈述简要计划：
```
1. [步骤] → 验证：[检查项]
2. [步骤] → 验证：[检查项]
3. [步骤] → 验证：[检查项]
```

强大的成功标准让你能独立循环。薄弱的标准（"让它工作"）需要不断澄清。

## 5. 项目交付流程（P0 必读）

### 5.1 开工前

- 读 `docs/specs/README.md`，按改动大小选择模板：
  - 新页面/新组件/接口契约变更 → `docs/specs/templates/spec.md`
  - 小功能 → `docs/specs/templates/feature-card.md`
  - Bug → `docs/specs/templates/bugfix.md`
- 每条 AC 必须有「怎么验」；需要真实全栈才能判定的 AC 必须有 BOT 用例。
- Spec/理解卡/复现契约确认后才能写代码。

### 5.2 分支与环境

```
feature/<task>  →  develop  →  stage  →  production
```

- `feature/*` 从 `develop` 切；AI 在独立 worktree 里改，不直接改 main/develop 主检出。
- `develop` 只做集成；`stage` 做预演，允许混多个未验收任务。
- `production` 只接收**单个已验收**的 `feature/<task>`。
- **禁止 `stage → production`**。发布前检查：

```bash
git log --oneline production..feature/<task>
git log --oneline production..stage
```

第二条里出现不属于本任务的提交，就不能把 stage 合进 production。

### 5.3 常用命令

```bash
# 后端
cd nest-service
npm ci
npm run build
npm test

# 管理后台
cd admin
corepack pnpm install --frozen-lockfile
corepack pnpm --filter @fantastic-admin/core-element-plus build

# 本地健康检查（API 已启动时）
curl -fsS http://127.0.0.1:3000/api/health/ready

# Stage 部署（必须在 stage 分支）
cd deploy/stage
./deploy.sh

# Production 发布（必须在 production 分支；会构建 admin、打 tag、备份、部署、健康检查）
cd deploy/cloud
./release.sh v2026.10.25-<feature>

# 回滚到某个已发布 tag
cd deploy/cloud
./rollback.sh v2026.10.24-<previous-feature>

# 手动健康检查 + 告警
cd deploy/cloud
./healthcheck.sh
```

### 5.4 完成定义（DoD）

- [ ] AC 全部有「怎么验」，并且实际通过
- [ ] BOT/人工走查有截图或记录
- [ ] 后端 build/test、admin build 通过
- [ ] 已部署到 stage，并完成 stage 人工验收
- [ ] production 只合并了本次已验收的 feature 分支
- [ ] 发布后 `/api/health/ready` 通过，观察日志/错误率
- [ ] 有 release tag、release manifest 和可回滚目标

### 5.5 硬性禁止

- 不直接 push `main` / `production`；不 force push。
- 不把 `stage` 合进 `production`。
- 不提交 `.env`、token、密钥、真实模板 ID；`.env.example` 只能放占位符。
- 不在没有测试/没有复现的情况下声称修完。
- 不在 production 验证通过前删除 feature 分支/worktree。

---

