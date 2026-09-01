# 阿里云服务器部署指南（Nginx Proxy Manager + 域名备案）

本方案用于将 `piggy-pocket` 的 NestJS 后端服务直接部署到**阿里云服务器**，配合**阿里云域名**和 **Nginx Proxy Manager** 实现微信小程序的外网 HTTPS 访问。

## 目录结构

```text
deploy/cloud/
├── README.md              # 本文件
├── docker-compose.yml     # Docker 服务编排
├── .env.example           # 环境变量模板
├── deploy.sh              # 一键部署脚本
└── backup.sh              # 数据库备份脚本
```

## 架构说明

```text
微信小程序
    ↓ HTTPS
api.yourdomain.com（阿里云域名）
    ↓
阿里云服务器（Nginx Proxy Manager + NestJS API + MySQL）
```

所有服务都运行在同一台阿里云服务器上，无需内网穿透，架构简单稳定。

## 前置条件

- 一台阿里云中国大陆云服务器（用于域名备案和提供服务）。
- 一个阿里云域名（已完成实名认证）。
- 域名已完成 ICP 备案（备案主体需与云服务器账号一致）。
- 已注册微信小程序，并拥有 `AppID` 和 `AppSecret`。
- 云服务器已安装 Docker 和 Docker Compose。

## 1. 云服务器选购建议

针对这个 NestJS + MySQL 的小程序后端：

| 配置项   | 建议                                                     |
| -------- | -------------------------------------------------------- |
| CPU      | 2 核                                                     |
| 内存     | 2G ~ 4G                                                  |
| 系统盘   | 40GB ~ 60GB                                              |
| 带宽     | 3Mbps 起步                                               |
| 操作系统 | Ubuntu 22.04 LTS 或 CentOS 7/8                           |
| 地域     | 选择离你用户最近的节点，如华东 1（杭州）、华南 1（深圳） |

> 提示：小程序图片通常上传到阿里云 OSS，不经过 API，所以服务器带宽压力不大。

## 2. 域名备案

如果你还没有备案，按以下流程操作：

1. 登录 [阿里云 ICP 备案系统](https://beian.aliyun.com/)。
2. 填写备案主体信息（个人或企业）。
3. 填写网站信息，网站域名填写 `api.yourdomain.com` 或顶级域名 `yourdomain.com`。
4. 提交初审，按提示完成短信核验、人脸识别等。
5. 管局审核通常需要 7 ~ 20 个工作日。
6. 备案成功后，在网站底部添加备案号并链接到工信部网站。

> 备案期间域名不能解析到大陆服务器，可以先完成服务器环境准备，备案通过后再解析域名。

## 3. 安装 Docker 和 Docker Compose

以 CentOS 8.2 为例：

```bash
# 安装 yum 工具包
sudo yum install -y yum-utils

# 添加 Docker CE 软件源（使用阿里云镜像加速）
sudo yum-config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

# 安装 Docker CE、容器运行时和 Docker Compose 插件
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动并开机自启 Docker
sudo systemctl enable docker
sudo systemctl start docker

# 验证
docker --version
docker compose version
```

> 提示：CentOS 8 已停止维护，如果安装过程中出现软件源错误，建议将系统替换为 **CentOS Stream 8**、**Rocky Linux 8** 或 **AlmaLinux 8**，命令基本相同。

### 3.1 配置 Docker 镜像加速

国内服务器直接拉 Docker Hub 镜像会超时（`registry-1.docker.io: Client.Timeout exceeded`），必须配置镜像加速器。

1. 登录 [阿里云容器镜像服务](https://cr.console.aliyun.com/) → **镜像工具 → 镜像加速器**，复制你的专属加速器地址（形如 `https://xxxxxxxx.mirror.aliyuncs.com`）。

2. 写入 `/etc/docker/daemon.json`：

   ```bash
   sudo mkdir -p /etc/docker

   sudo tee /etc/docker/daemon.json <<EOF
   {
     "registry-mirrors": [
       "https://xxxxxxxx.mirror.aliyuncs.com",
       "https://docker.m.daocloud.io",
       "https://dockerproxy.com",
       "https://mirror.baidubce.com"
     ]
   }
   EOF
   ```

   > 把 `https://xxxxxxxx.mirror.aliyuncs.com` 换成你在阿里云获取到的专属地址。后面几个是公开备用镜像。

3. 重启 Docker：

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart docker
   ```

4. 验证：

   ```bash
   docker info | grep -A5 "Registry Mirrors"
   docker pull hello-world
   ```

   能拉下 `hello-world` 即配置成功。

### 3.2 将当前用户加入 docker 组

避免每次都用 `sudo`：

```bash
sudo usermod -aG docker $USER
newgrp docker
docker ps
```

`newgrp docker` 让当前 shell 立即生效；重新 SSH 登录后自动生效，无需再执行。

## 4. 上传项目代码到云服务器

推荐直接在云服务器上使用 **Git SSH 拉取**，后续更新代码也最方便。

### 4.1 安装 Git

CentOS 8.2 默认可能没有 Git：

```bash
sudo yum install -y git
git --version
```

### 4.2 生成 SSH 密钥

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
# 一路回车即可
```

查看公钥内容：

```bash
cat ~/.ssh/id_ed25519.pub
```

### 4.3 将公钥添加到 GitHub

1. 登录 GitHub → 右上角头像 → **Settings**。
2. 左侧 **SSH and GPG keys** → **New SSH key**。
3. Title 随便填（例如 `Aliyun Server`），Key 粘贴刚才的公钥内容。
4. 点击 **Add SSH key**。

### 4.4 克隆代码

```bash
sudo mkdir -p /home/admin
cd /home/admin
sudo git clone git@github.com:你的用户名/PiggyPocket.git PiggyPocket
sudo chown -R $(whoami):$(whoami) /home/admin/PiggyPocket
```

### 4.5 后续更新代码

每次本地更新并 push 到 GitHub 后，在服务器上执行：

```bash
cd /home/admin/PiggyPocket
git pull

cd deploy/cloud
docker compose -p piggy-pocket down
docker compose -p piggy-pocket up -d --build
```

> API 容器启动时会自动执行数据库迁移，**无需手动跑 migration**。
> 如果 api 起不来，先看日志确认是不是迁移失败：
> `docker compose -p piggy-pocket logs api`
>
> 上面的 `--build` 会连 admin 一起重建，而 admin 镜像依赖服务器上已存在的
> `admin/apps/core-element-plus/dist`（不进 git）。前端有改动时，先按
> [14.1](#141-构建方式本地构建产物服务器只跑-nginx) 本地构建并上传产物。

### 4.6 只有后端接口修改时的快速部署

适用于：**只改了 `nest-service/src` 下的接口代码**（controller / service / dto / 业务逻辑），没有新增 migration，没有改 `mobile`、`admin`、`.env`、`docker-compose.yml`。

这种情况**不需要 `down` 整套服务**，只重建 api 一个容器，MySQL 和 Nginx Proxy Manager 保持运行，外网只在 api 重启的几秒内短暂 502：

```bash
cd /home/admin/PiggyPocket
git pull

cd deploy/cloud
docker compose -p piggy-pocket up -d --build api
```

验证：

```bash
# 看启动日志，确认没有报错
docker compose -p piggy-pocket logs -f api

# 本地打一下接口
curl http://127.0.0.1:3000/api
```

> api 容器启动时依然会执行 `migration:run:prod`，迁移是幂等的，没有新迁移就直接跳过，不影响数据。

小程序端无需重新发布（接口地址没变），除了以下情况：

| 改动内容                                | 额外操作                                                        |
| --------------------------------------- | --------------------------------------------------------------- |
| 改了接口路径 / 出入参结构               | mobile 端需同步改并重新 `npm run build:mp-weixin` 发布          |
| 新增了 `.env` 环境变量                  | 先编辑 `.env`，再执行上面的 `up -d --build api`（会重建容器生效）|
| 新增了 migration（表结构变更）          | 同样用上面的命令即可，启动时自动迁移；建议先 `./backup.sh` 备份 |
| 改了 `docker-compose.yml`               | 用 `docker compose -p piggy-pocket up -d` 让所有受影响服务生效  |
| 只改了 `admin` 前端                     | 需先本地构建并上传 `dist`，见 [14.1](#141-构建方式本地构建产物服务器只跑-nginx) |

回滚到上一个版本：

```bash
cd /home/admin/PiggyPocket
git log --oneline -5          # 找到上一个正常的 commit
git checkout <commit-id>
cd deploy/cloud
docker compose -p piggy-pocket up -d --build api
```

### 4.7 其他方式

| 方式                        | 适用场景                                        |
| --------------------------- | ----------------------------------------------- |
| **Git HTTPS + Token**       | 不想配置 SSH，可用 GitHub Personal Access Token |
| **下载 ZIP 上传**           | 一次性部署，用 SFTP/宝塔面板上传                |
| **GitHub Actions 自动部署** | 代码 push 后自动部署到服务器                    |
| **Docker 镜像仓库**         | 构建镜像推送到阿里云镜像仓库，服务器只拉镜像    |

## 5. 配置环境变量

进入项目目录：

```bash
cd /home/admin/PiggyPocket/deploy/cloud
cp .env.example .env
# 使用 vim/nano 编辑 .env
```

> 注意：`.env.example` 是模板文件（已提交到代码仓库），**真实密码、AppID、OSS 密钥等敏感信息请只填写在 `.env` 中**。`.env` 已被 Git 忽略，不会提交，可安全存放真实配置。

重点填写以下项：

| 变量                                  | 说明                                                            |
| ------------------------------------- | --------------------------------------------------------------- |
| `DOMAIN`                              | 微信小程序最终访问的 HTTPS 域名，例如 `api.yourdomain.com`      |
| `DATA_DIR`                            | 云服务器上的数据持久化目录，例如 `/home/admin/PiggyPocket/data` |
| `BACKUP_DIR`                          | 数据库备份目录，例如 `/home/admin/PiggyPocket/backup`           |
| `MYSQL_ROOT_PASSWORD` / `DB_PASSWORD` | 数据库密码                                                      |
| `WECHAT_APPID` / `WECHAT_SECRET`      | 微信小程序凭证                                                  |
| `ADMIN_JWT_SECRET` / `ADMIN_JWT_EXPIRES_IN` | 后台管理员 JWT 密钥与有效期（建议设置长随机字符串）        |
| `OSS_*`                               | 阿里云 OSS 配置                                                 |
| `MODEL_NAME` / `OPENAI_API_KEY` / `OPENAI_BASE_URL` | AI 大模型配置（菜谱流式生成）                     |
| `WECHAT_EXPIRY_TEMPLATE_ID`           | 到期管家的订阅消息模板 ID，留空则不推送微信通知                  |
| `MILVUS_ADDRESS` / `MILVUS_TOKEN`     | Zilliz Cloud 连接信息，留空则语义搜索降级为关键词匹配            |
| `EMBEDDING_MODEL_NAME` / `EMBEDDING_DIM` | 向量模型及其维度，默认 `doubao-embedding-vision` / `2048`，两者必须匹配 |

## 6. 一键部署

```bash
cd /home/admin/PiggyPocket/deploy/cloud
chmod +x deploy.sh backup.sh
./deploy.sh
```

脚本会依次完成：

1. 检查 `.env` 配置。
2. 创建数据与备份目录。
3. 启动 MySQL 并等待健康检查。
4. 启动 NestJS API、admin 后台与 Nginx Proxy Manager。

> API 容器**启动时会自动执行数据库迁移**（见 `nest-service/Dockerfile` 的 `CMD`），
> 迁移失败则不启动服务，避免用旧表结构运行。所以无需手动跑 migration。

## 7. 配置 Nginx Proxy Manager

1. 打开 `http://<服务器IP>:81`，使用默认账号登录：
   - 邮箱：`admin@example.com`
   - 密码：`changeme`
2. 首次登录后请立即修改管理员密码。
3. 添加小程序 API 的 **Proxy Host**：
   - **Domain Names**：`api.yourdomain.com`
   - **Forward Hostname / IP**：`api`
   - **Forward Port**：`3000`
   - **Scheme**：`http`
   - 建议开启 **Block Common Exploits**
4. 切换到 **SSL** 标签页：
   - 选择 **Request a new SSL Certificate**（Let's Encrypt）。
   - 勾选同意条款，开启 **Force SSL**。
   - 保存。
5. 再添加后台管理的 **Proxy Host**：
   - **Domain Names**：`admin.yourdomain.com`
   - **Forward Hostname / IP**：`admin`
   - **Forward Port**：`80`
   - **Scheme**：`http`
   - 同样申请 SSL 并开启 **Force SSL**。

> 如果你使用阿里云免费 SSL 证书，选择 **Custom** 并上传证书文件。

## 8. 阿里云域名解析

1. 登录阿里云控制台 → 域名解析。
2. 找到你的域名，添加两条 A 记录：
   - **主机记录**：`api`
     - **记录类型**：`A`
     - **记录值**：你的云服务器公网 IP
   - **主机记录**：`admin`
     - **记录类型**：`A`
     - **记录值**：你的云服务器公网 IP
3. 等待解析生效（通常几分钟到几小时）。

## 9. 微信小程序配置

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)。
2. 进入 **开发 → 开发管理 → 开发设置 → 服务器域名**。
3. 配置：
   - `request 合法域名`：`https://api.yourdomain.com`
   - `uploadFile 合法域名`：`https://api.yourdomain.com`（如果直接上传到 API）
   - `downloadFile 合法域名`：你的 OSS 域名
4. 保存并等待生效。

## 10. 修改小程序 API 基地址

编辑 [mobile/src/services/request.ts](../../mobile/src/services/request.ts)，已改为读取环境变量：

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
```

新增/编辑 `mobile/.env.production`：

```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

重新构建并发布小程序：

```bash
cd mobile
npm run build:mp-weixin
```

## 11. 验证

1. **服务器本地访问**：
   ```bash
   curl http://127.0.0.1:3000/api
   ```
   确认 API 已启动。

2. **公网 HTTPS 访问**：
   ```bash
   curl -v https://api.yourdomain.com/api
   ```
   应返回 Swagger 文档或 API 响应。

3. **后台管理访问**：
   ```bash
   curl -I https://admin.yourdomain.com
   ```
   应返回 200；浏览器打开后能用 `superadmin / admin123456` 登录。

4. **微信小程序真机调试**：确认接口请求成功。

## 12. 数据库备份

手动备份：

```bash
cd /home/admin/PiggyPocket/deploy/cloud
./backup.sh
```

定时备份（每天凌晨 3 点）：

```bash
sudo crontab -e
# 添加以下行：
0 3 * * * /home/admin/PiggyPocket/deploy/cloud/backup.sh
```

## 13. 常用命令

```bash
cd /home/admin/PiggyPocket/deploy/cloud

# 查看日志
docker compose -p piggy-pocket logs -f api
docker compose -p piggy-pocket logs -f admin
docker compose -p piggy-pocket logs -f mysql
docker compose -p piggy-pocket logs -f npm

# 重启服务
docker compose -p piggy-pocket restart api
docker compose -p piggy-pocket restart admin

# 更新代码后重新构建
docker compose -p piggy-pocket down
docker compose -p piggy-pocket up -d --build

# 数据库迁移（正常由 api 容器启动时自动执行，以下为手动排查用）
docker compose -p piggy-pocket exec api npm run migration:show:prod
docker compose -p piggy-pocket exec api npm run migration:run:prod

# 进入 MySQL
docker compose -p piggy-pocket exec mysql mysql -uroot -p
```

## 14. 后台管理系统（admin）

后台是与小程序共用同一台服务器的静态站点，使用 nginx 提供，`/api/*` 反代到 `api:3000`。

### 14.1 构建方式：本地构建产物，服务器只跑 nginx

admin 的静态产物**在本地构建**，服务器上的 admin 镜像只做一件事：把 `dist` 塞进 nginx。

原因：`@iconify/json` 这一个依赖解压后就有 **437MB**，pnpm 需要把它整块读进内存。服务器总内存 1.7G，4 个容器常态占用 ~900M，剩余不足以完成分配，`pnpm install` 会卡在重试上（10 秒 → 1 分钟）然后失败：

```text
[ERR_PNPM_TARBALL_EXTRACT] Failed to add tarball from
  ".../@iconify/json/-/json-2.2.500.tgz" to store: Array buffer allocation failed
```

注意这**不是带宽问题**（日志里 30 秒就下完了 1030 个包），也不是加 swap 能解决的——`ArrayBuffer` 分配失败是硬性上限。本地构建只要 30 秒左右。

**第 1 步**，本地构建（在项目根目录）：

```bash
cd admin
pnpm --filter @fantastic-admin/core-element-plus run build
```

产物生成在 `admin/apps/core-element-plus/dist`。

**第 2 步**，上传到服务器的同一相对路径：

> 注意用**公网 IP**（本项目为 `8.138.163.42`，也可直接用 `api.piggy-pocket.xyz`）。
> 阿里云控制台上还会显示一个 `172.x.x.x` 的**私网 IP**，那是 VPC 内网地址，
> 从本地连它只会得到 `ssh: connect to host 172.x.x.x port 22: Connection timed out`。

```bash
# 先删掉服务器上的旧产物，否则 scp -r 会把新目录套成 dist/dist
ssh <SSH用户>@8.138.163.42 'rm -rf /home/admin/PiggyPocket/admin/apps/core-element-plus/dist'

# 在本地项目根目录执行
scp -r admin/apps/core-element-plus/dist \
  <SSH用户>@8.138.163.42:/home/admin/PiggyPocket/admin/apps/core-element-plus/
```

**第 3 步**，服务器上重建容器（秒级完成）：

```bash
cd /home/admin/PiggyPocket/deploy/cloud
docker compose -p piggy-pocket up -d --build admin
```

> `dist` 已被 `admin/.gitignore` 忽略，**服务器上 `git pull` 拿不到产物**，每次前端有改动都必须重新走上面三步。
> 若服务器上缺少 `dist`，构建会直接失败并提示 `"/apps/core-element-plus/dist": not found`——补传产物即可。

### 14.2 首次部署

1. 按 14.1 构建并上传 `dist`，再启动 admin 容器。
2. admin 相关 migration（含默认超管账号）在 api 容器启动时已自动执行。
   默认账号：`superadmin / admin123456`（**上线后立即改密码**）。
3. 在 NPM（Nginx Proxy Manager）中新增站点，例如 `admin.yourdomain.com`：
   - Forward Hostname/IP：`admin`
   - Forward Port：`80`
   - Scheme：`http`
   - 打开 SSL、Force SSL。
4. 本地浏览器访问 `https://admin.yourdomain.com`，用 `superadmin / admin123456` 登录验证。

> admin 容器内 nginx 已经把 `/api/*` 反代到 `api:3000`，所以前端只需要访问 `https://admin.yourdomain.com/api/*`，无需额外配置 CORS。

### 14.3 环境变量

后台 nest-service 端建议在 `.env` 中显式设置 JWT 密钥，避免使用默认值：

```env
ADMIN_JWT_SECRET=<32 字符以上随机字符串>
ADMIN_JWT_EXPIRES_IN=2h
```

修改后重启 api：`docker compose -p piggy-pocket restart api`。

## 15. 数据库变更记录

`synchronize: false`，所有表结构变更都通过 `nest-service/src/migrations/` 下的 migration 文件管理。
**api 容器启动时会自动执行 `migration:run:prod`**（见 `nest-service/Dockerfile` 的 `CMD`），
迁移是幂等的，容器每次重启都会跳过已执行的部分；迁移失败则服务不启动。

| Migration                     | 变更内容                                                      |
| ----------------------------- | ------------------------------------------------------------- |
| `AddOrderCookDate`            | `orders` 表新增 `cookDate`（做菜日期，date，可空）+ 索引      |
| `RenameExpiryFoodsToItems`    | `expiry_foods` 改名为 `expiry_items`，新增 `remindDays`/`notifiedAt`，旧食品分类合并为 `food`，新建 `wechat_subscribe_quotas` |

### AddOrderCookDate（做菜日期）

美食菜单模块新增「下单时选择做菜日期」，猪猪订单与历史菜单按做菜日期分组展示。

字段可空，历史订单保持 `NULL`，小程序端展示时回退用 `createdAt` 的日期分组，**无需数据回填**。

验证字段已生效：

```bash
docker compose -p piggy-pocket exec mysql \
  mysql -u"$DB_USERNAME" -p"$DB_PASSWORD" "$DB_DATABASE" \
  -e "SHOW COLUMNS FROM orders LIKE 'cookDate';"
```

应输出一行 `cookDate | date | YES`。

### RenameExpiryFoodsToItems（临期食品 → 到期管家）

「临期食品」升级为「到期管家」，可记录家里所有需要关注到期时间的物品（药品、化妆品、滤芯、卡券等）。

迁移做了四件事，全部幂等：

1. `RENAME TABLE expiry_foods TO expiry_items`（新表已存在则跳过）。
2. 新增 `remindDays`（提前几天提醒，默认 3）与 `notifiedAt`（最近推送日期，可空）。
3. 旧的 7 个食品分类（`dairy`/`meat`/`vegetable`/`fruit`/`seafood`/`condiment`/`snack`）统一并入新分类 `food`。
4. 新建 `wechat_subscribe_quotas` 表，累计每个用户的订阅消息可推送次数。

> `down()` 是有损的：合并掉的食品细分类无法还原，回滚后全部变成 `other`。

验证：

```bash
docker compose -p piggy-pocket exec mysql \
  mysql -u"$DB_USERNAME" -p"$DB_PASSWORD" "$DB_DATABASE" \
  -e "SHOW COLUMNS FROM expiry_items LIKE 'remindDays'; SELECT DISTINCT category FROM expiry_items;"
```

## 16. 安全建议

- 云服务器安全组只放行必要的端口：`22`（SSH）、`80`、`443`、`81`（NPM 管理界面，建议限制 IP）。
- 修改 SSH 默认端口，使用密钥登录，关闭密码登录。
- NPM 管理界面不要长期暴露在公网，或限制访问 IP。
- MySQL 3306 仅绑定 `127.0.0.1`，避免暴露到公网。
- 定期更新系统补丁和 Docker 镜像。

## 17. 备案与合规

- 域名必须完成 ICP 备案才能解析到中国大陆服务器。
- 小程序上线前，需要在网站底部展示备案号并链接到 [工信部](https://beian.miit.gov.cn/)。
- 如果涉及用户个人信息收集，需在微信小程序后台完善隐私协议。

## 18. 故障排查

| 现象                                                    | 可能原因                         | 排查方法                                                          |
| ------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------- |
| 拉镜像超时（`registry-1.docker.io ... Client.Timeout`） | 国内直连 Docker Hub 被墙         | 参考 [3.1 配置 Docker 镜像加速](#31-配置-docker-镜像加速)         |
| `permission denied ... docker.sock`                     | 当前用户不在 docker 组           | 参考 [3.2 将当前用户加入 docker 组](#32-将当前用户加入-docker-组) |
| `.env: line N: xxx: command not found`                  | `.env` 中值含空格未加引号        | 编辑 `.env` 去掉占位符空格或用引号包起来                          |
| 公网无法访问                                            | 域名未解析 / 安全组未放行 80/443 | `ping api.yourdomain.com`；检查安全组                             |
| NPM 返回 502                                            | 目标容器未启动                   | API 502 看 `logs api`；admin 502 看 `logs admin`                  |
| SSL 证书申请失败                                        | 域名未解析 / 80 端口未放行       | 检查解析和安全组                                                  |
| 小程序提示域名不合法                                    | 未在微信后台配置                 | 检查微信公众平台服务器域名                                        |
| api 容器反复重启 / 起不来                               | 启动时数据库迁移失败             | `docker compose -p piggy-pocket logs api` 看迁移报错              |
| 数据库连接失败                                          | MySQL 未就绪 / 密码错误          | `docker compose -p piggy-pocket logs mysql`                       |
| 到期提醒没推送                                          | 模板 ID 未配 / 用户没授权 / 配额用完 | `logs api | grep -i subscribe`；后台点「立即执行提醒」看返回的 `skipped` |
| 搜索结果像是关键词匹配                                  | 向量库不可用，已降级             | 接口返回的 `semantic` 为 `false`；`logs api | grep -i milvus`      |

## 19. 到期管家配置（订阅消息 + 语义搜索）

这两项都是**可选增强**：不配置时后端照常启动，提醒不推送、搜索退化为数据库关键词匹配。

### 19.1 微信订阅消息模板

1. 微信公众平台 → 功能 → 订阅消息 → 公共模板库，搜索「到期提醒」类模板并添加。
2. 选择三个关键词，顺序需与代码一致：**物品名称**、**到期时间**、**备注**。
3. 把模板 ID 填到 `.env` 的 `WECHAT_EXPIRY_TEMPLATE_ID`。
4. 如果你选的模板字段编号不是 `thing1` / `time2` / `thing3`，改
   [nest-service/src/modules/wechat/wechat.service.ts](../../nest-service/src/modules/wechat/wechat.service.ts)
   里的 `buildExpiryData` 一处即可。

> 微信规则：用户**每授权一次只能收到一条**消息。小程序端每次保存物品都会弹一次授权，
> 后端把授权次数累加到 `wechat_subscribe_quotas`，每日 9:00（Asia/Shanghai）扫描时消耗一次。
> 因此配额为 0 的用户会被跳过，发送失败会把配额退回。

### 19.2 Zilliz Cloud（托管 Milvus）

不在自己服务器上跑 Milvus——standalone 版官方建议 8GB 内存，会挤掉 MySQL 和 API。

1. 注册 [Zilliz Cloud](https://zilliz.com.cn/)，创建 Serverless 免费集群（选与服务器同区域，如华东）。
2. 复制 **Public Endpoint** 填 `MILVUS_ADDRESS`，创建 **API Key** 填 `MILVUS_TOKEN`。
3. 向量模型复用 `OPENAI_API_KEY` / `OPENAI_BASE_URL`（方舟 Agent Plan，`https://ark.cn-beijing.volces.com/api/plan/v3`），无需额外的 Key。该端点目前仅放通 `doubao-embedding-vision`（输出 2048 维），填别的向量模型会返回 `404 UnsupportedModel`；换模型时 `EMBEDDING_DIM` 必须同步改成新模型的维度，并删掉旧集合重建。
4. 集合 `expiry_items` 由 API 启动时自动创建（`AUTOINDEX` + `COSINE`），无需手工建表。
5. 历史数据补向量：后台「到期管家」列表页点 **重建向量索引**，或调
   `POST /api/admin/expiry-items/reindex`。

> 维度填错会导致建集合失败并降级，`logs api` 里会有 warn；改对后重启 api 容器即可。
