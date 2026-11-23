#!/usr/bin/env bash
# =====================================================
# update-supabase.sh
#
# Updates Supabase project auth email templates via the
# Management API, using the HTML files tracked in
# supabase/templates/.
#
# Usage:
#   SUPABASE_ACCESS_TOKEN=sbp_... ./update-supabase.sh
#
# Docs: https://supabase.com/docs/guides/auth/auth-email-templates
# API:  https://supabase.com/docs/reference/api/v1-update-a-project-auth-config
# =====================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "${SCRIPT_DIR}/secrets/deploy.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "${SCRIPT_DIR}/secrets/deploy.env"
  set +a
fi

SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-}"
SUPABASE_PROJECT_REF="${SUPABASE_PROJECT_REF:-}"

if [ -z "$SUPABASE_PROJECT_REF" ]; then
  echo "❌ SUPABASE_PROJECT_REF is required (set env var or configure secrets/deploy.env)"
  exit 1
fi

TEMPLATES_DIR="${SCRIPT_DIR}/supabase/templates"
API_URL="https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/config/auth"

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "❌ SUPABASE_ACCESS_TOKEN is required"
  echo "   Usage: SUPABASE_ACCESS_TOKEN=sbp_... ./update-supabase.sh"
  exit 1
fi

# -------------------------------------------------------
# Mapping: filename (without .html) -> API field name
# -------------------------------------------------------
declare -A TEMPLATE_FIELDS=(
  ["confirmation"]="mailer_templates_confirmation_content"
  ["invite"]="mailer_templates_invite_content"
  ["magic_link"]="mailer_templates_magic_link_content"
  ["email_change"]="mailer_templates_email_change_content"
  ["recovery"]="mailer_templates_recovery_content"
  ["reauthentication"]="mailer_templates_reauthentication_content"
)

# -------------------------------------------------------
# Base64-encode the logo for embedding in templates
# -------------------------------------------------------
LOGO_FILE="${SCRIPT_DIR}/web/public/favicon.png"

if [ ! -f "$LOGO_FILE" ]; then
  echo "❌ Logo file not found: ${LOGO_FILE}"
  exit 1
fi

LOGO_DATA_URI="data:image/png;base64,$(base64 -w0 "$LOGO_FILE")"
echo "🖼️  Logo embedded ($(wc -c < "$LOGO_FILE") bytes → data URI)"

# -------------------------------------------------------
# Build the JSON payload from template files
# -------------------------------------------------------
echo "📧 Reading templates from ${TEMPLATES_DIR}..."

JSON_PAYLOAD="{"
FIRST=true

for html_file in "${TEMPLATES_DIR}"/*.html; do
  [ -f "$html_file" ] || continue

  filename=$(basename "$html_file" .html)
  field="${TEMPLATE_FIELDS[$filename]:-}"

  if [ -z "$field" ]; then
    echo "  ⚠️  Skipping unknown template: ${filename}.html"
    continue
  fi

  # Read the file, inject the logo data URI, and JSON-escape
  content=$(python3 -c "
import json, sys
with open(sys.argv[1], 'r') as f:
    html = f.read().replace('{{LOGO_DATA_URI}}', sys.argv[2])
    print(json.dumps(html))
" "$html_file" "$LOGO_DATA_URI")

  if [ "$FIRST" = true ]; then
    FIRST=false
  else
    JSON_PAYLOAD+=","
  fi

  JSON_PAYLOAD+="\"${field}\":${content}"
  echo "  ✅ ${filename}.html -> ${field}"
done

JSON_PAYLOAD+="}"

if [ "$FIRST" = true ]; then
  echo "❌ No template files found in ${TEMPLATES_DIR}/"
  exit 1
fi

# -------------------------------------------------------
# Push to Supabase Management API
# -------------------------------------------------------
echo ""
echo "🚀 Updating Supabase auth config..."

HTTP_STATUS=$(curl -s -o /tmp/supabase-update-response.json -w "%{http_code}" \
  -X PATCH "$API_URL" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD")

if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 300 ]; then
  echo "✅ Successfully updated email templates (HTTP ${HTTP_STATUS})"
else
  echo "❌ Failed to update templates (HTTP ${HTTP_STATUS})"
  echo "Response:"
  cat /tmp/supabase-update-response.json
  exit 1
fi
