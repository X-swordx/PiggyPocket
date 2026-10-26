# 健康告警值班手册

## 告警来源

`deploy/cloud/healthcheck.sh` 每 5 分钟检查：

1. API `/api/health/ready`（DB 可查询）
2. admin 静态站点
3. 可选：`PUBLIC_HEALTH_URL` 公网入口

失败时写日志，并在配置了 `ALERT_WEBHOOK_URL` 时发企业微信/钉钉消息。

## 收到告警后的 5 分钟

```bash
cd /home/admin/PiggyPocket/deploy/cloud

# 1. 看容器状态
docker compose -p piggy-pocket ps

# 2. 看 API 日志
docker compose -p piggy-pocket logs --tail=150 api

# 3. 看数据库
docker compose -p piggy-pocket logs --tail=100 mysql

# 4. 手动打健康检查
./healthcheck.sh
```

判断：

- API 容器反复重启 → 看 migration/DB 连接/环境变量。
- `/api/health/ready` 503 但容器 Up → DB 不可用或连接池耗尽。
- admin 打不开但 API 正常 → nginx/dist/证书问题。
- 公网入口失败但容器正常 → NPM/域名/证书问题。

## 15 分钟内无法定位

优先恢复服务，不要在现场长时间调试：

```bash
cd deploy/cloud
./rollback.sh <上一个稳定 tag>
```

回滚后：

- 确认 `/api/health/ready` 200
- 确认 admin 页面打开
- 在 `docs/releases/<tag>.md` 记录事故时间线
- 保留日志和容器状态，再排查根因

## 责任与响应

| 级别 | 例子 | 响应 | 缓解 |
| --- | --- | --- | --- |
| P0 | API 全挂、DB 不可用、数据丢失风险 | 5 分钟内确认 | 30 分钟内恢复或回滚 |
| P1 | 单个功能不可用、错误率升高 | 30 分钟内确认 | 当天下班前 |
| P2 | 告警噪音、非核心页面异常 | 次工作日 | 排期 |

值班人：待指定  
升级路径：待指定
