# 发布记录

每次 production 发布对应一份 `docs/releases/<tag>.md`，记录这次到底发了什么、怎么验的、出问题怎么回滚。

不要把真实密钥写进这里。

## 文件命名

```
docs/releases/v2026.10.25-<feature>.md
```

## 最低内容

- release tag、commit、发布时间
- 本次包含的 feature 分支/PR
- Stage 验收记录（每条 AC 的通过/不通过、截图/测试名）
- 数据库 migration 列表
- 发布后健康检查结果
- 回滚目标 tag
- 已知风险/观察项

模板见 `TEMPLATE.md`。
