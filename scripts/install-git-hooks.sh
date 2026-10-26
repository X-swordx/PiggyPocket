#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

git config core.hooksPath .githooks
chmod +x .githooks/* 2>/dev/null || true

echo "[INFO] core.hooksPath=.githooks"
echo "[INFO] pre-push 会阻止直接推送 main/production"
