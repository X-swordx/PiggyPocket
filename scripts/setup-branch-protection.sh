#!/bin/bash

set -euo pipefail

if ! command -v gh &>/dev/null; then
  echo "[ERROR] 需要 GitHub CLI（gh）：https://cli.github.com/"
  exit 1
fi

if ! gh auth status &>/dev/null; then
  echo "[ERROR] 请先执行 gh auth login"
  exit 1
fi

REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
echo "[INFO] 仓库：$REPO"

protect() {
  local branch="$1"
  local reviews="$2"

  if ! gh api "repos/$REPO/branches/$branch" >/dev/null 2>&1; then
    echo "[WARN] 远端不存在分支 $branch，跳过；先 push 该分支再运行"
    return
  fi

  echo "[INFO] 保护 $branch（review=$reviews）..."
  gh api --method PUT "repos/$REPO/branches/$branch/protection" --input - <<JSON
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["backend", "admin", "secret-scan"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": $reviews,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
JSON
}

protect main 0
protect production 0
protect develop 0
protect stage 0

echo "[INFO] 完成。检查：gh api repos/$REPO/branches/production/protection"
