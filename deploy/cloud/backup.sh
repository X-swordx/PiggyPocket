#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/.env}"
PROJECT_NAME="${PROJECT_NAME:-piggy-pocket}"
COMPOSE_FILE="${COMPOSE_FILE:-$SCRIPT_DIR/docker-compose.yml}"

# 加载环境变量
if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
else
  echo "[ERROR] 缺少环境变量文件：$ENV_FILE"
  exit 1
fi

if [ -z "${BACKUP_DIR:-}" ] || [ -z "${DB_DATABASE:-}" ]; then
  echo "[ERROR] BACKUP_DIR 或 DB_DATABASE 未配置"
  exit 1
fi

BACKUP_PATH="$BACKUP_DIR/mysql"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
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

$COMPOSE_CMD -f "$COMPOSE_FILE" exec -T mysql \
  mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" \
  --single-transaction \
  --quick \
  --lock-tables=false \
  --routines \
  --triggers \
  "$DB_DATABASE" > "$BACKUP_FILE"

# 空文件通常意味着 mysqldump 失败或数据库不存在，不能当成有效备份
if [ ! -s "$BACKUP_FILE" ]; then
  echo "[ERROR] 备份文件为空，删除无效文件"
  rm -f "$BACKUP_FILE"
  exit 1
fi

# 压缩后校验 gzip 完整性，再写 checksum
GZIP_FILE="${BACKUP_FILE}.gz"
gzip -f "$BACKUP_FILE"
gzip -t "$GZIP_FILE"

if command -v sha256sum &>/dev/null; then
  sha256sum "$GZIP_FILE" > "${GZIP_FILE}.sha256"
fi

# 删除超过保留期的备份
find "$BACKUP_PATH" -name "*.sql.gz" -mtime +"$BACKUP_RETENTION_DAYS" -delete
find "$BACKUP_PATH" -name "*.sql.gz.sha256" -mtime +"$BACKUP_RETENTION_DAYS" -delete

echo "[INFO] 备份完成: $GZIP_FILE"
