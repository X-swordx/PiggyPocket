#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="piggy-pocket"
BACKEND_DIR="$(cd "$SCRIPT_DIR/../../nest-service" && pwd)"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 .env 文件
if [ ! -f "$SCRIPT_DIR/.env" ]; then
  log_error "缺少 .env 文件，请复制 .env.example 并修改"
  cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
  log_info "已生成 .env 文件，请先编辑后再运行"
  exit 1
fi

# 加载环境变量
set -a
source "$SCRIPT_DIR/.env"
set +a

# 检查必要变量
if [ -z "$DOMAIN" ] || [ "$DOMAIN" = "api.yourdomain.com" ]; then
  log_error "请先在 .env 中配置 DOMAIN"
  exit 1
fi

if [ -z "$WECHAT_APPID" ] || [ "$WECHAT_APPID" = "wxYourAppId" ]; then
  log_error "请先在 .env 中配置 WECHAT_APPID 和 WECHAT_SECRET"
  exit 1
fi

# 检查 Docker 和 Docker Compose
if ! command -v docker &>/dev/null; then
  log_error "未检测到 Docker，请先安装"
  exit 1
fi

if docker compose version &>/dev/null; then
  COMPOSE_CMD="docker compose -p $PROJECT_NAME"
elif command -v docker-compose &>/dev/null; then
  COMPOSE_CMD="docker-compose -p $PROJECT_NAME"
else
  log_error "未检测到 docker compose，请先安装"
  exit 1
fi

# 创建必要目录
log_info "创建数据目录..."
mkdir -p "$DATA_DIR/mysql"
mkdir -p "$DATA_DIR/npm-data"
mkdir -p "$DATA_DIR/npm-letsencrypt"
mkdir -p "$BACKUP_DIR/mysql"

# 启动 MySQL
log_info "启动 MySQL..."
$COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" up -d mysql

# 等待 MySQL 健康检查通过
log_info "等待 MySQL 就绪..."
for i in {1..30}; do
  if $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" ps mysql | grep -q "healthy"; then
    log_info "MySQL 已就绪"
    break
  fi
  if [ "$i" -eq 30 ]; then
    log_error "MySQL 启动超时，请检查日志"
    $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" logs mysql
    exit 1
  fi
  sleep 2
done

# 运行数据库迁移
log_info "执行数据库迁移..."
docker run --rm \
  --network "${PROJECT_NAME}_piggy-network" \
  -v "$BACKEND_DIR:/app" \
  -w /app \
  -e DB_HOST=mysql \
  -e DB_PORT=3306 \
  -e DB_USERNAME="$DB_USERNAME" \
  -e DB_PASSWORD="$DB_PASSWORD" \
  -e DB_DATABASE="$DB_DATABASE" \
  node:20-alpine \
  sh -c "npm ci && npm run migration:run"

# 启动 API 和 Nginx Proxy Manager
log_info "启动 API 与 Nginx Proxy Manager..."
$COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" up -d api npm

log_info "部署完成！"
log_info "Nginx Proxy Manager 管理界面：http://<服务器IP>:81"
log_info "默认账号：admin@example.com / changeme"
log_info "请在 NPM 中添加 Proxy Host："
log_info "  Domain Names: $DOMAIN"
log_info "  Forward Hostname/IP: api"
log_info "  Forward Port: 3000"
log_info "  Scheme: http"
