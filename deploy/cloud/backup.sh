#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="piggy-pocket"

# 加载环境变量
if [ -f "$SCRIPT_DIR/.env" ]; then
  set -a
  source "$SCRIPT_DIR/.env"
  set +a
else
  echo "[ERROR] 缺少 .env 文件"
  exit 1
fi

BACKUP_PATH="$BACKUP_DIR/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_PATH/${DB_DATABASE}_${DATE}.sql"

mkdir -p "$BACKUP_PATH"

echo "[INFO] 开始备份数据库 $DB_DATABASE..."

if docker compose version &>/dev/null; then
  COMPOSE_CMD="docker compose -p $PROJECT_NAME"
elif command -v docker-compose &>/dev/null; then
  COMPOSE_CMD="docker-compose -p $PROJECT_NAME"
else
  echo "[ERROR] 未检测到 docker compose"
  exit 1
fi

$COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" exec -T mysql \
  mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" \
  --single-transaction \
  --routines \
  --triggers \
  "$DB_DATABASE" > "$BACKUP_FILE"

# 压缩
GZIP_FILE="${BACKUP_FILE}.gz"
gzip -f "$BACKUP_FILE"

# 删除 7 天前的备份
find "$BACKUP_PATH" -name "*.sql.gz" -mtime +7 -delete

echo "[INFO] 备份完成: $GZIP_FILE"
