#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
TAG="${1:-}"
ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/.env}"
PROJECT_NAME="${PROJECT_NAME:-piggy-pocket}"

if [ -z "$TAG" ]; then
  echo "用法：$0 <release-tag>"
  echo "示例：$0 v2026.10.25-recipe-inspiration"
  exit 1
fi

if ! git -C "$ROOT_DIR" check-ref-format "refs/tags/$TAG"; then
  echo "[ERROR] 非法的 tag：$TAG"
  exit 1
fi

if git -C "$ROOT_DIR" rev-parse "refs/tags/$TAG" >/dev/null 2>&1; then
  echo "[ERROR] tag 已存在：$TAG"
  exit 1
fi

if [ -n "$(git -C "$ROOT_DIR" status --porcelain)" ]; then
  echo "[ERROR] 工作区不干净，请先提交或 stash 后再发布"
  git -C "$ROOT_DIR" status --short
  exit 1
fi

BRANCH="$(git -C "$ROOT_DIR" rev-parse --abbrev-ref HEAD)"
if [ "$BRANCH" != "production" ] && [ "${ALLOW_NON_PRODUCTION_RELEASE:-0}" != "1" ]; then
  echo "[ERROR] production 发布必须从 production 分支执行，当前分支：$BRANCH"
  echo "        如确实要演练，可设 ALLOW_NON_PRODUCTION_RELEASE=1"
  exit 1
fi

if ! command -v corepack &>/dev/null && ! command -v pnpm &>/dev/null; then
  echo "[ERROR] 需要 pnpm（推荐通过 corepack 启用）"
  exit 1
fi

if command -v corepack &>/dev/null; then
  PNPM=(corepack pnpm)
else
  PNPM=(pnpm)
fi

echo "[INFO] 构建 admin 产物..."
(
  cd "$ROOT_DIR/admin"
  COREPACK_ENABLE_DOWNLOAD_PROMPT=0 "${PNPM[@]}" install --frozen-lockfile
  COREPACK_ENABLE_DOWNLOAD_PROMPT=0 "${PNPM[@]}" --filter @fantastic-admin/core-element-plus build
)

ADMIN_DIST="$ROOT_DIR/admin/apps/core-element-plus/dist"
if [ ! -d "$ADMIN_DIST" ]; then
  echo "[ERROR] admin 构建产物不存在：$ADMIN_DIST"
  exit 1
fi

RELEASE_DIR="$SCRIPT_DIR/releases/$TAG"
mkdir -p "$RELEASE_DIR"
tar -czf "$RELEASE_DIR/admin-dist.tar.gz" -C "$ROOT_DIR/admin/apps/core-element-plus" dist

ADMIN_SHA=""
if command -v sha256sum &>/dev/null; then
  ADMIN_SHA="$(sha256sum "$RELEASE_DIR/admin-dist.tar.gz" | awk '{print $1}')"
  printf '%s  admin-dist.tar.gz\n' "$ADMIN_SHA" > "$RELEASE_DIR/admin-dist.tar.gz.sha256"
fi

COMMIT="$(git -C "$ROOT_DIR" rev-parse HEAD)"
CREATED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
cat > "$RELEASE_DIR/manifest.json" <<EOF
{
  "tag": "$TAG",
  "commit": "$COMMIT",
  "branch": "$BRANCH",
  "createdAt": "$CREATED_AT",
  "adminDistSha256": "$ADMIN_SHA",
  "composeProject": "$PROJECT_NAME"
}
EOF

git -C "$ROOT_DIR" tag -a "$TAG" -m "Release $TAG"

echo "[INFO] 发布产物已写入：$RELEASE_DIR"
echo "[INFO] 开始部署 $TAG ..."
ENV_FILE="$ENV_FILE" PROJECT_NAME="$PROJECT_NAME" "$SCRIPT_DIR/deploy.sh"

echo "[INFO] 发布完成：$TAG"
echo "[INFO] 记得推送 tag：git push origin $TAG"
