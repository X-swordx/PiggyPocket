#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="piggy-pocket"

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

if [ -z "$WECHAT_APPID" ] || [ "$WECHAT_APPID" = "wx your appid" ]; then
  log_error "请先在 .env 中配置 WECHAT_APPID 和 WECHAT_SECRET"
  exit 1
fi

# 创建必要目录
log_info "创建数据目录..."
mkdir -p "$DATA_DIR/mysql"
mkdir -p "$BACKUP_DIR/mysql"
mkdir -p "$SSL_DIR"
mkdir -p "$SCRIPT_DIR/certbot"

# 检查 SSL 证书
if [ ! -f "$SSL_DIR/$DOMAIN.crt" ] || [ ! -f "$SSL_DIR/$DOMAIN.key" ]; then
  log_warn "未找到 SSL 证书: $SSL_DIR/$DOMAIN.crt 或 $DOMAIN.key"
  log_warn "请将证书文件放入 $SSL_DIR 目录"
  log_warn "证书文件命名: $DOMAIN.crt 和 $DOMAIN.key"
  exit 1
fi

# 替换 Nginx 配置中的域名占位符
log_info "生成 Nginx 配置..."
sed "s|#DOMAIN#|$DOMAIN|g" "$SCRIPT_DIR/nginx.conf" > "$SCRIPT_DIR/nginx.runtime.conf"

# 检查 Docker 和 Docker Compose
if ! command -v docker &>/dev/null; then
  log_error "未检测到 Docker，请先安装"
  exit 1
fi

if ! command -v docker-compose &>/dev/null && ! docker compose version &>/dev/null; then
  log_error "未检测到 docker-compose，请先安装"
  exit 1
fi

# 使用 docker compose 或 docker-compose
if docker compose version &>/dev/null; then
  COMPOSE_CMD="docker compose"
else
  COMPOSE_CMD="docker-compose"
fi

# 停止并清理旧容器
log_info "停止旧容器..."
$COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" down --remove-orphans

# 启动 MySQL
log_info "启动 MySQL..."
$COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" up -d mysql

# 等待 MySQL 就绪
log_info "等待 MySQL 就绪..."
for i in {1..30}; do
  if $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" exec -T mysql \
    mysqladmin ping -h localhost -u root -p"$MYSQL_ROOT_PASSWORD" --silent; then
    log_info "MySQL 已就绪"
    break
  fi
  echo -n "."
  sleep 2
  if [ "$i" -eq 30 ]; then
    log_error "MySQL 启动超时，请检查日志"
    $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" logs mysql
    exit 1
  fi
done

# 创建数据库（如果不存在）
log_info "初始化数据库..."
$COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" exec -T mysql \
  mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e \
  "CREATE DATABASE IF NOT EXISTS \`$DB_DATABASE\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" \
  2>&1 | grep -v "Using a password" || true

# 运行数据库迁移
MIGRATION_FILE="$SCRIPT_DIR/../../nest-service/src/data-source.ts"
if [ -f "$MIGRATION_FILE" ]; then
  log_info "运行数据库迁移..."
  $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" run --rm api \
    npx typeorm migration:run -d dist/data-source.js \
    2>&1 | grep -v "Using a password" || true
else
  log_warn "未找到 $MIGRATION_FILE"
  log_warn "请先在 nest-service 中配置 TypeORM 迁移"
fi

# 启动全部服务
log_info "启动所有服务..."
$COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" up -d --build

# 等待服务启动
log_info "等待 API 服务启动..."
sleep 5

# 健康检查
if curl -sf http://127.0.0.1:3000 >/dev/null 2>&1 || true; then
  log_info "API 服务已启动"
else
  log_warn "API 健康检查未通过，请查看日志"
fi

log_info "部署完成"
log_info "API 地址: https://$DOMAIN"
log_info "查看日志: $COMPOSE_CMD -f $SCRIPT_DIR/docker-compose.yml logs -f api"
