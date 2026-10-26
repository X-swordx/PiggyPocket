#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
TAG="${1:-}"
ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/.env}"
PROJECT_NAME="${PROJECT_NAME:-piggy-pocket}"

if [ -z "$TAG" ]; then
  echo "用法：$0 <release-tag>"
  echo "示例：$0 v2026.10.24-stable"
  exit 1
fi

if ! git -C "$ROOT_DIR" rev-parse "refs/tags/$TAG" >/dev/null 2>&1; then
  echo "[ERROR] 本地不存在 tag：$TAG"
  echo "        先执行：git fetch --tags"
  exit 1
fi

RELEASE_DIR="$SCRIPT_DIR/releases/$TAG"
ARTIFACT="$RELEASE_DIR/admin-dist.tar.gz"
if [ ! -f "$ARTIFACT" ]; then
  echo "[ERROR] 缺少发布产物：$ARTIFACT"
  echo "        回滚必须使用 release.sh 产出的 admin 产物，不能用当前工作区的 dist"
  exit 1
fi

if command -v sha256sum &>/dev/null && [ -f "$ARTIFACT.sha256" ]; then
  (cd "$RELEASE_DIR" && sha256sum -c admin-dist.tar.gz.sha256)
fi

# 在临时 worktree 里检出历史版本，避免 checkout 改到当前工作区，
# 也避免回滚脚本运行到一半时被旧版本的脚本内容替换。
WORKTREE="$(mktemp -d "${TMPDIR:-/tmp}/piggy-rollback.XXXXXX")"
rmdir "$WORKTREE"
cleanup() {
  git -C "$ROOT_DIR" worktree remove --force "$WORKTREE" >/dev/null 2>&1 || true
  rm -rf "$WORKTREE"
}
trap cleanup EXIT

echo "[INFO] 检出 $TAG 到临时 worktree：$WORKTREE"
git -C "$ROOT_DIR" worktree add --detach "$WORKTREE" "$TAG" >/dev/null

echo "[INFO] 恢复 admin 产物 ..."
rm -rf "$WORKTREE/admin/apps/core-element-plus/dist"
tar -xzf "$ARTIFACT" -C "$WORKTREE/admin/apps/core-element-plus"

echo "[INFO] 开始回滚部署 $TAG ..."
ENV_FILE="$ENV_FILE" PROJECT_NAME="$PROJECT_NAME" bash "$WORKTREE/deploy/cloud/deploy.sh"

echo "[INFO] 回滚完成：$TAG"
echo "[WARN] 代码回滚不会自动回滚数据库 migration；生产 migration 必须是 expand/contract 兼容的"
echo "[INFO] 当前分支未被切换；继续开发请确认仍在 production/feature 分支"
