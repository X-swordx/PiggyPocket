# 绿联 NAS 一键部署方案

适用于把 PiggyPocket 后端服务部署在绿联 NAS 上，使用 Docker + Docker Compose。

## 目录结构

```text
deploy/nas/
├── docker-compose.yml      # NAS 本地服务编排
├── nginx.conf              # Nginx 配置模板
├── .env.example            # 环境变量示例
├── deploy.sh               # 一键部署脚本
├── backup.sh               # MySQL 自动备份脚本
├── frp/                    # 内网穿透方案
│   ├── README.md
│   ├── frps.toml           # FRP 服务端配置
│   ├── frpc.toml           # FRP 客户端配置
│   └── docker-compose.frp.yml
└── README.md               # 本文件
```

## 快速开始

### 1. 准备环境

- 绿联 NAS 开启 SSH
- 安装 Docker 和 Docker Compose
- 准备一个域名（微信小程序要求 HTTPS）
- 准备 SSL 证书（阿里云/腾讯云免费申请，或 Let's Encrypt）

### 2. 复制并编辑配置

```bash
cd deploy/nas
cp .env.example .env
# 编辑 .env，填写域名、密码、小程序配置等
```

### 3. 准备 SSL 证书

将证书文件放到 `.env` 中 `SSL_DIR` 指定的目录，命名格式：

```text
{SSL_DIR}/
  ├── {DOMAIN}.crt
  └── {DOMAIN}.key
```

例如域名是 `api.yourdomain.com`：

```text
/volume1/docker/piggy-pocket/ssl/
  ├── api.yourdomain.com.crt
  └── api.yourdomain.com.key
```

### 4. 配置数据库迁移

确保 `nest-service/src/data-source.ts` 已存在。如果还没有，参考项目文档配置 TypeORM 迁移。

如果暂时没有迁移，可以在首次部署时临时将 `nest-service/src/app.module.ts` 中的 `synchronize` 设为 `true`，启动一次后立刻改回 `false`。

### 5. 执行一键部署

```bash
cd deploy/nas
chmod +x deploy.sh
./deploy.sh
```

脚本会：
- 检查 `.env` 配置
- 创建数据目录
- 检查 SSL 证书
- 启动 MySQL 并初始化数据库
- 运行 TypeORM 迁移
- 构建并启动 NestJS API
- 启动 Nginx

### 6. 配置备份

```bash
chmod +x backup.sh
./backup.sh
```

加入定时任务（每天凌晨 3 点备份）：

```bash
crontab -e
# 添加：
0 3 * * * /volume1/docker/piggyPocket/deploy/nas/backup.sh
```

## 无公网 IP 方案

请参考 [frp/README.md](./frp/README.md)。

## 微信小程序配置

登录微信公众平台 → 开发 → 开发管理 → 开发设置 → 服务器域名：

- request 合法域名：`https://api.yourdomain.com`
- uploadFile 合法域名：`https://api.yourdomain.com`（如果使用服务器上传）
- downloadFile 合法域名：OSS 域名

## 常用命令

```bash
# 查看日志
docker-compose logs -f api
docker-compose logs -f mysql
docker-compose logs -f nginx

# 重启服务
docker-compose restart api

# 更新代码后重新构建
docker-compose down
docker-compose up -d --build

# 进入 MySQL
docker-compose exec mysql mysql -uroot -p
```

## 注意事项

1. **备案**：如果云服务器/域名在中国大陆，必须完成 ICP 备案
2. **安全**：不要将 MySQL 3306 暴露到公网
3. **备份**：务必配置自动备份
4. **性能**：NAS 性能有限，建议 MySQL 限制 1G 内存，Node 限制 512M
