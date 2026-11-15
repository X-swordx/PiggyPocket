#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/.env}"
PROJECT_NAME="${PROJECT_NAME:-piggy-pocket}"
COMPOSE_FILE="${COMPOSE_FILE:-$SCRIPT_DIR/docker-compose.yml}"

if [ ! -f "$ENV_FILE" ]; then
  echo "[ERROR] 缺少环境变量文件：$ENV_FILE"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

if docker compose version &>/dev/null; then
  COMPOSE_CMD="docker compose -p $PROJECT_NAME"
elif command -v docker-compose &>/dev/null; then
  COMPOSE_CMD="docker-compose -p $PROJECT_NAME"
else
  echo "[ERROR] 未检测到 docker compose"
  exit 1
fi

compose() {
  $COMPOSE_CMD -f "$COMPOSE_FILE" "$@"
}

alert() {
  local message="$1"
  echo "[ERROR] $message"

  if [ -n "${ALERT_WEBHOOK_URL:-}" ] && command -v curl &>/dev/null; then
    # 兼容企业微信/钉钉的 text 消息体；其他 webhook 可按需调整
    local payload
    payload=$(printf '{"msgtype":"text","text":{"content":"[PiggyPocket] %s"}}' "$message")
    curl -fsS -X POST -H 'Content-Type: application/json' \
      -d "$payload" "$ALERT_WEBHOOK_URL" >/dev/null || true
  fi

  exit 1
}

compose exec -T api node -e "fetch('http://127.0.0.1:3000/api/health/ready').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))" >/dev/null 2>&1 \
  || alert "API readiness check failed"

compose exec -T admin wget -qO- http://127.0.0.1/ >/dev/null 2>&1 \
  || alert "admin static site check failed"

# 可选：从公网验证 NPM 入口（需要主机有 curl）
if [ -n "${PUBLIC_HEALTH_URL:-}" ] && command -v curl &>/dev/null; then
  curl -fsS --max-time 10 "$PUBLIC_HEALTH_URL" >/dev/null \
    || alert "public health check failed: $PUBLIC_HEALTH_URL"
fi

echo "[INFO] healthcheck passed ($PROJECT_NAME)"
