#!/bin/bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────
# Indexing Script for LeetLLM
#
# Submits all sitemap URLs for re-crawling via IndexNow API, explicit
# endpoints (Bing, Yandex, Seznam), and Baidu Push.
# 
# Usage:
#   ./scripts/google-indexing.sh              # Submit all URLs
#   ./scripts/google-indexing.sh --dry-run    # Show URLs without submitting
# ─────────────────────────────────────────────────────────────────

SITE_URL="https://leetllm.com"
SITEMAP_URL="${SITE_URL}/sitemap.xml"
DRY_RUN=false

# Parse args
while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run) DRY_RUN=true; shift ;;
        *) echo "Unknown arg: $1"; exit 1 ;;
    esac
done

# Load .env.local for Baidu or Google env vars if available
if [ -f "web/.env.local" ]; then
    set -a
    source "web/.env.local"
    set +a
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 LeetLLM Search Indexing (IndexNow)"
echo "   Site:    $SITE_URL"
echo "   Dry run: $DRY_RUN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Step 1: Fetch all URLs from sitemap ──────────────────────────
echo ""
echo "📥 Step 1: Fetching sitemap URLs..."

URLS=$(curl -s "$SITEMAP_URL" | grep -oP '<loc>\K[^<]+')
TOTAL=$(echo "$URLS" | wc -l)
echo "   Found $TOTAL URLs in sitemap"

# ── Step 2: Ensure IndexNow Key Exists ───────────────────────────
echo ""
echo "🔑 Step 2: Preparing IndexNow Key..."

# Read the public IndexNow value from the verification file.
KEY_FILE="${INDEXNOW_KEY_FILE:-web/public/de636737060240a0a26b95af82aea543.txt}"

if [ ! -f "$KEY_FILE" ]; then
    echo "   ❌ IndexNow verification file missing: $KEY_FILE"
    exit 1
else
    echo "   ✅ Found IndexNow key file: $KEY_FILE"
fi

INDEXNOW_VALUE="$(tr -d '[:space:]' < "$KEY_FILE")"

# ── Step 3: IndexNow (Bing, Yandex, Seznam) ─────────────────
echo ""
echo "🌐 Step 3: Submitting to IndexNow APIs..."

URL_LIST=$(echo "$URLS" | head -n 10000 | jq -R -s 'split("\n") | map(select(length > 0))')

if [ "$DRY_RUN" = true ]; then
    echo "   [dry-run] Would submit $(echo "$URL_LIST" | jq length) URLs via IndexNow"
else
    # We submit explicitly to Bing, Yandex, Seznam for immediate ingestion redundancy
    for INDEXNOW_ENDPOINT in "api.indexnow.org" "www.bing.com" "yandex.com" "search.seznam.cz"; do
        RESPONSE=$(curl -s -w "\n%{http_code}" \
            -X POST "https://${INDEXNOW_ENDPOINT}/indexnow" \
            -H "Content-Type: application/json" \
            -d "{
                \"host\": \"leetllm.com\",
                \"key\": \"$INDEXNOW_VALUE\",
                \"keyLocation\": \"https://leetllm.com/$(basename "$KEY_FILE")\",
                \"urlList\": $URL_LIST
            }")

        HTTP_CODE=$(echo "$RESPONSE" | tail -1)
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "202" ]; then
            echo "   ✅ Submitted to $INDEXNOW_ENDPOINT (HTTP $HTTP_CODE)"
        else
            echo "   ❌ Failed to submit to $INDEXNOW_ENDPOINT (HTTP $HTTP_CODE)"
        fi
    done
fi

# ── Step 4: Baidu Push API ──────────────────────────────────────
echo ""
echo "🇨🇳 Step 4: Baidu Push API..."

if [ "$DRY_RUN" = true ]; then
    echo "   [dry-run] Skipping Baidu Push"
elif [ -n "${BAIDU_PUSH_TOKEN:-}" ]; then
    # Baidu accepts a plaintext list of URLs, one per line
    BAIDU_URLS=$(echo "$URLS" | head -n 2000)
    BAIDU_RES=$(curl -s -H 'Content-Type: text/plain' \
        --data-binary "$BAIDU_URLS" \
        "http://data.zz.baidu.com/urls?site=$SITE_URL&token=$BAIDU_PUSH_TOKEN")
    
    if echo "$BAIDU_RES" | grep -q 'success'; then
         echo "   ✅ Submitted URLs to Baidu: $BAIDU_RES"
    else
         echo "   ❌ Baidu Push failed or returned error: $BAIDU_RES"
    fi
else
    echo "   ⚠️  Skipped Baidu push (BAIDU_PUSH_TOKEN not found in web/.env.local)"
fi

# ── Step 5: Google recrawl path ─────────────────────────────────
echo ""
echo "🤖 Step 5: Google recrawl path..."
echo "   ⚠️  Google Indexing API is not used for LeetLLM lessons/blog posts."
echo "      Google limits that API to JobPosting pages and BroadcastEvent pages embedded in VideoObject."
echo "      Submit https://leetllm.com/sitemap.xml in Search Console and use URL Inspection for priority URLs."
echo "      If we add eligible pages later, use: uv run scripts/push-google-indexing.py <eligible-sitemap> --confirm-eligible"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 All indexing requests complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
