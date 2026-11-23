#!/bin/bash
set -euo pipefail

# ── LeetLLM Book Builder ──────────────────────────────────────
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "$DIR/web"

if [ $# -eq 0 ]; then
    pnpm exec tsx tools/book/build.ts --help
else
    pnpm exec tsx tools/book/build.ts "$@"
fi
