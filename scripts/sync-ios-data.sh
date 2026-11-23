#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$REPO_ROOT"
if [[ "${LEETLLM_IOS_EXPORT_MODE:-full}" == "ci" ]]; then
  pnpm --dir web ios:export:ci
else
  pnpm --dir web ios:export
fi
pnpm --dir web ios:validate
