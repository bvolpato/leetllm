#!/bin/bash
set -e

# Get script directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Parse arguments
PORT=23456
usage() {
    cat <<'EOF'
Start LeetLLM web development server.

Renders illustrations and diagrams before starting Next.js dev server.

Usage:
  ./start-dev.sh [options]

Options:
  --port PORT, -p PORT    Next.js dev server port. Default: 23456.
  -h, --help              Show this help.

Available sessions:
  ./deploy.sh       Validate, build, deploy, and verify LeetLLM.
  ./start-dev.sh    Render visual assets, then start Next.js dev server.
EOF
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --port)
            PORT="$2"
            shift 2
            ;;
        --port=*)
            PORT="${1#*=}"
            shift
            ;;
        -p)
            PORT="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            usage
            exit 1
            ;;
    esac
done

echo "🚀 Starting LeetLLM Web on port $PORT..."
cd "$DIR/web"

# Render illustrations before starting dev server
echo "🎨 Rendering illustrations..."
pnpm illustrations:build
echo ""

# Render diagrams before starting dev server
echo "📊 Rendering diagrams..."
pnpm diagrams:build
echo ""

# Use PORT environment variable which Next.js supports
export PORT
exec pnpm dev
