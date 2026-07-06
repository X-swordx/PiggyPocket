# FRP 内网穿透部署说明

适用于 NAS 没有公网 IP 的场景。需要一台有公网 IP 的云服务器作为 frp 服务端。

## 架构

```
用户 → 域名 → 云服务器（frps + Nginx）→ frp 隧道 → NAS（frpc + 本项目的 Nginx）
```

## 前提条件

- 一台有公网 IP 的云服务器（阿里云/腾讯云轻量即可）
- 一个已备案的域名（如果云服务器在中国大陆）
- 绿联 NAS 能访问互联网

## 1. 云服务器部署 frps

### 1.1 下载 frp

```bash
# 以 frp 0.61.0 为例，请去 GitHub 查看最新版本
wget https://github.com/fatedier/frp/releases/download/v0.61.0/frp_0.61.0_linux_amd64.tar.gz
tar -xzf frp_0.61.0_linux_amd64.tar.gz
cd frp_0.61.0_linux_amd64
sudo cp frps /usr/local/bin/
```

### 1.2 配置 frps

编辑 `/etc/frp/frps.toml`：

```toml
bindPort = 7000
auth.method = "token"
auth.token = "你的强Token"

# Web 管理面板（可选）
webServer.addr = "0.0.0.0"
webServer.port = 7500
webServer.user = "admin"
webServer.password = "你的管理密码"
```

### 1.3 使用 systemd 启动

创建 `/etc/systemd/system/frps.service`：

```ini
[Unit]
Description=FRP Server
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/frps -c /etc/frp/frps.toml
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable frps
sudo systemctl start frps
```

### 1.4 开放云服务器端口

安全组放行：

| 端口 | 说明 |
|------|------|
| 7000 | frp 通信端口 |
| 7500 | frp 管理面板（可选） |
| 80/443 | HTTP/HTTPS |

## 2. NAS 部署 frpc

### 2.1 方式一：Docker 运行（推荐）

在 NAS 上新建 `docker-compose.frp.yml`：

```yaml
version: '3.8'

services:
  frpc:
    image: snowdreamtech/frpc:0.61.0
    container_name: piggy_frpc
    restart: always
    volumes:
      - ./frpc.toml:/etc/frp/frpc.toml:ro
    network_mode: host
```

`frpc.toml` 配置见本目录下的 [frpc.toml](./frpc.toml) 文件。

启动：

```bash
cd /你的NAS路径/PiggyPocket/deploy/nas/frp
docker-compose -f docker-compose.frp.yml up -d
```

### 2.2 方式二：二进制运行

```bash
wget https://github.com/fatedier/frp/releases/download/v0.61.0/frp_0.61.0_linux_amd64.tar.gz
tar -xzf frp_0.61.0_linux_amd64.tar.gz
sudo cp frp_0.61.0_linux_amd64/frpc /usr/local/bin/

# 配置
sudo mkdir -p /etc/frp
sudo cp frpc.toml /etc/frp/

# systemd
sudo tee /etc/systemd/system/frpc.service > /dev/null <<EOF
[Unit]
Description=FRP Client
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/frpc -c /etc/frp/frpc.toml
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable frpc
sudo systemctl start frpc
```

## 3. 云服务器 Nginx 反向代理

在云服务器上安装 Nginx，配置：

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/cert.crt;
    ssl_certificate_key /path/to/key.key;

    location / {
        proxy_pass https://127.0.0.1:8443;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

> 注意：frpc 映射到本地的 8443 端口是 HTTPS，所以 `proxy_pass` 用 `https://`。

## 4. 域名解析

将 `api.yourdomain.com` 解析到云服务器公网 IP。

## 5. 验证

```bash
# 云服务器查看 frp 连接
frps verify --config /etc/frp/frps.toml

# 查看 frpc 日志
docker logs piggy_frpc
# 或
sudo journalctl -u frpc -f

# 测试访问
curl https://api.yourdomain.com
```

## 6. 安全建议

- 务必修改 `auth.token`，不要使用默认 Token
- 限制 frps 的 7000 端口只允许 NAS 出口 IP 访问
- frp 管理面板不要暴露到公网，或限制 IP
- 定期更新 frp 版本

## 7. 备案说明

如果云服务器在中国大陆，域名必须备案。如果无法备案，可以考虑：

- 使用香港/新加坡/海外云服务器
- 使用 Cloudflare Tunnel（免费，但国内访问可能不稳定）
