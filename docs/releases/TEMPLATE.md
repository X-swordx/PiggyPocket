# Release <tag>

- 发布时间：
- Commit：
- Feature 分支/PR：
- 发布人：
- 回滚目标：<previous-tag>

## 本次包含

- …

## Stage 验收

| AC | 结果 | 证据（测试名/截图/URL） |
| --- | --- | --- |
| AC-1 | 通过 / 不通过 | |
| AC-UI-1 | 通过 / 不通过 | |

验收人：
验收时间：
结论：stage 验收通过 / 未通过

## 数据库变更

- [ ] 无
- [ ] migration：…

部署前备份文件：
恢复演练：未做 / 已做（时间）

## 发布后检查

- [ ] `/api/health/ready` 返回 200
- [ ] admin 页面可打开
- [ ] 关键接口返回预期数据
- [ ] 日志无新增 error 峰值
- [ ] 观察窗口：发布后 30 分钟

## 回滚预案

```bash
cd deploy/cloud
./rollback.sh <previous-tag>
```

## 已知风险

- …
