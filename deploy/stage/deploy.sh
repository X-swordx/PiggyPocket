#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
BRANCH="$(git -C "$ROOT_DIR" rev-parse --abbrev-ref HEAD)"

if [ "$BRANCH" != "stage" ] && [ "${ALLOW_NON_STAGE_DEPLOY:-0}" != "1" ]; then
  echo "[ERROR] Stage 部署必须从 stage 分支执行，当前分支：$BRANCH"
  echo "        如确实要演练，可设 ALLOW_NON_STAGE_DEPLOY=1"
  exit 1
fi

export ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/.env.stage}"
export PROJECT_NAME="${PROJECT_NAME:-piggy-pocket-stage}"
export COMPOSE_FILE="${COMPOSE_FILE:-$SCRIPT_DIR/../cloud/docker-compose.yml}"
export ENV_NAME="${ENV_NAME:-stage}"

exec bash "$SCRIPT_DIR/../cloud/deploy.sh"
