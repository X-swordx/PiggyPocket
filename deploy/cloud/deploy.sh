#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/.env}"
PROJECT_NAME="${PROJECT_NAME:-piggy-pocket}"
COMPOSE_FILE="${COMPOSE_FILE:-$SCRIPT_DIR/docker-compose.yml}"
ENV_NAME="${ENV_NAME:-production}"

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
if [ ! -f "$ENV_FILE" ]; then
  log_error "缺少环境变量文件：$ENV_FILE"
  if [ -f "${ENV_FILE}.example" ]; then
    cp "${ENV_FILE}.example" "$ENV_FILE"
    log_info "已从 ${ENV_FILE}.example 生成，请先编辑后再运行"
  fi
  exit 1
fi

# 加载环境变量
set -a
source "$ENV_FILE"
set +a

# 检查必要变量
if [ -z "${DOMAIN:-}" ] || [[ "$DOMAIN" == *yourdomain.com* ]]; then
  log_error "请先在 $ENV_FILE 中配置 DOMAIN"
  exit 1
fi

if [ -z "${WECHAT_APPID:-}" ] || [[ "$WECHAT_APPID" == wxYour* ]]; then
  log_error "请先在 $ENV_FILE 中配置 WECHAT_APPID 和 WECHAT_SECRET"
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

compose() {
  $COMPOSE_CMD -f "$COMPOSE_FILE" "$@"
}

# 创建必要目录前先判断 MySQL 是否已有数据，只有已有数据才做部署前备份
if [ -d "$DATA_DIR/mysql" ] && [ -n "$(ls -A "$DATA_DIR/mysql" 2>/dev/null)" ]; then
  MYSQL_DATA_EXISTED=1
else
  MYSQL_DATA_EXISTED=0
fi

log_info "创建数据目录..."
mkdir -p "$DATA_DIR/mysql"
mkdir -p "$DATA_DIR/npm-data"
mkdir -p "$DATA_DIR/npm-letsencrypt"
mkdir -p "$BACKUP_DIR/mysql"

# 启动 MySQL
log_info "[$ENV_NAME] 启动 MySQL..."
compose up -d mysql

# 等待 MySQL 健康检查通过
log_info "等待 MySQL 就绪..."
for i in {1..30}; do
  if compose ps mysql | grep -q "healthy"; then
    log_info "MySQL 已就绪"
    break
  fi
  if [ "$i" -eq 30 ]; then
    log_error "MySQL 启动超时，请检查日志"
    compose logs --tail=100 mysql
    exit 1
  fi
  sleep 2
done

# 部署前备份：备份失败就不继续发布，避免把可恢复性押在未验证的备份上
if [ "$MYSQL_DATA_EXISTED" = "1" ] && [ "${SKIP_PRE_DEPLOY_BACKUP:-0}" != "1" ]; then
  log_info "部署前备份数据库..."
  ENV_FILE="$ENV_FILE" PROJECT_NAME="$PROJECT_NAME" COMPOSE_FILE="$COMPOSE_FILE" \
    "$SCRIPT_DIR/backup.sh"
else
  log_warn "未检测到已有数据库数据，跳过部署前备份"
fi

# 启动 API、admin 后台与 Nginx Proxy Manager
# API 容器启动时会自动执行数据库迁移（见 nest-service/Dockerfile）
log_info "启动 API、admin 后台与 Nginx Proxy Manager..."
compose up -d api admin npm

# 等待 API 就绪；不是只看容器 Up，而是真的打到 /api/health/ready
log_info "等待 API 健康检查通过..."
for i in {1..40}; do
  if compose exec -T api node -e "fetch('http://127.0.0.1:3000/api/health/ready').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))" >/dev/null 2>&1; then
    log_info "API 已就绪"
    break
  fi
  if [ "$i" -eq 40 ]; then
    log_error "API 健康检查超时，请检查日志"
    compose logs --tail=150 api
    exit 1
  fi
  sleep 3
done

# admin 是静态站点，至少确认 nginx 能返回页面
if ! compose exec -T admin wget -qO- http://127.0.0.1/ >/dev/null 2>&1; then
  log_error "admin 静态站点健康检查失败"
  compose logs --tail=100 admin
  exit 1
fi

GIT_SHA="$(git -C "$SCRIPT_DIR/../.." rev-parse --short HEAD 2>/dev/null || echo unknown)"
log_info "[$ENV_NAME] 部署完成，版本：$GIT_SHA"
log_info "Nginx Proxy Manager 管理界面：http://<服务器IP>:${NPM_ADMIN_PORT:-81}"
log_info "默认账号：admin@example.com / changeme"
log_info "请在 NPM 中添加 Proxy Host："
log_info "  小程序 API:"
log_info "    Domain Names: $DOMAIN"
log_info "    Forward Hostname/IP: api"
log_info "    Forward Port: 3000"
log_info "    Scheme: http"
log_info "  后台管理:"
log_info "    Domain Names: admin.$DOMAIN"
log_info "    Forward Hostname/IP: admin"
log_info "    Forward Port: 80"
log_info "    Scheme: http"
