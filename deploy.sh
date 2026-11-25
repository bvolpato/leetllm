#!/bin/bash
set -e

# Deploy LeetLLM to Google Cloud Run
# Usage: ./deploy.sh [--fast]

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# ── Configuration ────────────────────────────────────────────
# Load optional gitignored local deployment overrides (see deploy.env.example).
if [ -f "$DIR/secrets/deploy.env" ]; then
    set -a
    # shellcheck disable=SC1091
    source "$DIR/secrets/deploy.env"
    set +a
fi

GCLOUD_ACCOUNT="${GCLOUD_ACCOUNT:-${CLOUDSDK_CORE_ACCOUNT:-}}"
GCLOUD_PROJECT="${GCLOUD_PROJECT:-${CLOUDSDK_CORE_PROJECT:-}}"
GCLOUD_CONFIG="${GCLOUD_CONFIG:-${CLOUDSDK_ACTIVE_CONFIG_NAME:-}}"

GCP_PROJECT="${GCLOUD_PROJECT:-}"
GCP_REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-leetllm}"
PRACTICE_SANDBOX_SERVICE="${PRACTICE_SANDBOX_SERVICE:-leetllm-sandbox}"
IMAGE_REPOSITORY="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/cloud-run-source-deploy/${SERVICE_NAME}"
RUNTIME_SERVICE_ACCOUNT="${RUNTIME_SERVICE_ACCOUNT:-leetllm-runtime@${GCP_PROJECT}.iam.gserviceaccount.com}"
GEMINI_SECRET="leetllm-gemini-api-key"
SUPABASE_SERVICE_ROLE_SECRET="leetllm-supabase-service-role-key"
RESEND_SECRET="leetllm-resend-api-key"
CODEX_AUTH_SECRET="leetllm-codex-auth-json-b64"
LEETY_E2E_SECRET="leetllm-e2e-user"
CODEX_AUTH_FILE="$DIR/secrets/codex/auth.json"
PRODUCTION_URL="${PRODUCTION_URL:-https://leetllm.com}"
SMOKE_TAG="deploy-smoke"
CF_ZONE_ID="${CF_ZONE_ID:-}"
GCLOUD_BUILD_TIMEOUT_SECONDS="${GCLOUD_BUILD_TIMEOUT_SECONDS:-2400}"
GCLOUD_DEPLOY_TIMEOUT_SECONDS="${GCLOUD_DEPLOY_TIMEOUT_SECONDS:-600}"
GCLOUD_DESCRIBE_TIMEOUT_SECONDS="${GCLOUD_DESCRIBE_TIMEOUT_SECONDS:-60}"
GCLOUD_TRAFFIC_TIMEOUT_SECONDS="${GCLOUD_TRAFFIC_TIMEOUT_SECONDS:-300}"
LIVE_ROUTE_STEP_TIMEOUT_SECONDS="${LIVE_ROUTE_STEP_TIMEOUT_SECONDS:-420}"
LIVE_ROUTE_REQUEST_TIMEOUT_SECONDS="${LIVE_ROUTE_REQUEST_TIMEOUT_SECONDS:-75}"
LIVE_ROUTE_RETRIES="${LIVE_ROUTE_RETRIES:-2}"
COLD_ROUTE_MAX_TOTAL_SECONDS="${COLD_ROUTE_MAX_TOTAL_SECONDS:-30}"
CLOUDFLARE_TIMEOUT_SECONDS="${CLOUDFLARE_TIMEOUT_SECONDS:-30}"
LEETY_SMOKE_STEP_TIMEOUT_SECONDS="${LEETY_SMOKE_STEP_TIMEOUT_SECONDS:-210}"
LEETY_SMOKE_REQUEST_TIMEOUT_SECONDS="${LEETY_SMOKE_REQUEST_TIMEOUT_SECONDS:-125}"

usage() {
    cat <<'EOF'
Deploy LeetLLM to Cloud Run.

Runs content/schema/reference/example checks, web tests, illustration and diagram rendering,
cached production build, Cloud Run deploy, and post-deploy validation.

Usage:
  ./deploy.sh [options]

Options:
  --account=EMAIL   Specify gcloud account for deploy without changing default.
  --project=PROJECT Specify gcloud project for deploy without changing default.
  --config=NAME     Specify gcloud configuration name for deploy.
  --fast            Skip pre-deploy tests and illustration validation.
                    Still installs missing deps and renders changed/missing illustrations and diagrams via cache.
  --rebuild         Force a clean container build, including base/system dependency refresh.
  --with-sandbox    Also rebuild and deploy the isolated leetllm-sandbox service before web deploy.
  -h, --help        Show this help.

Environment (or gitignored secrets/deploy.env; see deploy.env.example):
  GCLOUD_ACCOUNT    Deploy gcloud account.
  GCLOUD_PROJECT    Deploy GCP project (required).
  GCLOUD_CONFIG     Deploy gcloud configuration name.
  CF_ZONE_ID        Cloudflare zone ID for post-deploy cache purge (optional).

Available sessions:
  ./deploy.sh           Validate, build, deploy, and verify LeetLLM.
  ./deploy.sh --fast    Fast deploy with cached illustration rendering only.
  ./start-dev.sh        Render visual assets, then start Next.js dev server.
EOF
}

FAST_DEPLOY=0
FORCE_REBUILD=0
DEPLOY_SANDBOX=0
for arg in "$@"; do
    case "$arg" in
        --account=*)
            GCLOUD_ACCOUNT="${arg#*=}"
            ;;
        --project=*)
            GCLOUD_PROJECT="${arg#*=}"
            GCP_PROJECT="$GCLOUD_PROJECT"
            IMAGE_REPOSITORY="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/cloud-run-source-deploy/${SERVICE_NAME}"
            RUNTIME_SERVICE_ACCOUNT="leetllm-runtime@${GCP_PROJECT}.iam.gserviceaccount.com"
            ;;
        --config=*)
            GCLOUD_CONFIG="${arg#*=}"
            ;;
        --fast)
            FAST_DEPLOY=1
            ;;
        --rebuild)
            FORCE_REBUILD=1
            ;;
        --with-sandbox)
            DEPLOY_SANDBOX=1
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown arg: $arg" >&2
            usage >&2
            exit 1
            ;;
    esac
done

if [ -z "$GCP_PROJECT" ]; then
    echo "❌ Error: GCP project is required. Set --project, GCLOUD_PROJECT, or secrets/deploy.env (see deploy.env.example)." >&2
    exit 1
fi

if [ -n "$GCLOUD_ACCOUNT" ]; then
    export CLOUDSDK_CORE_ACCOUNT="$GCLOUD_ACCOUNT"
fi
if [ -n "$GCLOUD_PROJECT" ]; then
    export CLOUDSDK_CORE_PROJECT="$GCLOUD_PROJECT"
fi
if [ -n "$GCLOUD_CONFIG" ]; then
    export CLOUDSDK_ACTIVE_CONFIG_NAME="$GCLOUD_CONFIG"
fi
export CLOUDSDK_RUN_REGION="${CLOUDSDK_RUN_REGION:-$GCP_REGION}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 LeetLLM Deploy"
if [ -n "$GCLOUD_ACCOUNT" ]; then
    echo "   Account:  $GCLOUD_ACCOUNT (scoped)"
fi
echo "   Project:  $GCP_PROJECT (scoped)"
echo "   Region:   $GCP_REGION (scoped)"
echo "   Service:  $SERVICE_NAME"
if [ -n "$GCLOUD_CONFIG" ]; then
    echo "   Config:   $GCLOUD_CONFIG"
fi
if [ "$FAST_DEPLOY" -eq 1 ]; then
    echo "   Mode:     fast"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Preflight checks ────────────────────────────────────────
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed."
    echo "   Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

if ! command -v uv &> /dev/null; then
    echo "❌ Error: uv is not installed."
    echo "   Install it from: https://docs.astral.sh/uv/getting-started/installation/"
    exit 1
fi

if ! command -v corepack &> /dev/null && ! command -v pnpm &> /dev/null; then
    echo "❌ Error: neither corepack nor pnpm is installed."
    echo "   Install pnpm or Node.js with Corepack support."
    exit 1
fi

if ! command -v timeout &> /dev/null; then
    echo "❌ Error: timeout is not installed."
    echo "   Install GNU coreutils so deploy steps can fail fast instead of hanging."
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Error: docker is not installed."
    echo "   Docker is required to validate the immutable runtime image before deployment."
    exit 1
fi

if [ -z "${DOCKER_HOST:-}" ]; then
    DETECTED_DOCKER_HOST=$(docker context inspect --format '{{.Endpoints.docker.Host}}' 2>/dev/null || true)
    if [ -n "$DETECTED_DOCKER_HOST" ]; then
        export DOCKER_HOST="$DETECTED_DOCKER_HOST"
    fi
fi

if ! docker info >/dev/null 2>&1; then
    echo "❌ Error: the Docker daemon is unavailable."
    echo "   Start Docker so the immutable runtime image can be validated before deployment."
    exit 1
fi

PNPM_VERSION="10.33.0"
PNPM_SHIM_DIR=""
if command -v corepack &> /dev/null; then
    PNPM_SHIM_DIR=$(mktemp -d "${TMPDIR:-/tmp}/leetllm-pnpm.XXXXXX")
    cat > "$PNPM_SHIM_DIR/pnpm" <<EOF
#!/bin/sh
exec corepack pnpm@${PNPM_VERSION} "\$@"
EOF
    chmod +x "$PNPM_SHIM_DIR/pnpm"
    export PATH="$PNPM_SHIM_DIR:$PATH"
fi

if ! java -version >/dev/null 2>&1; then
    if [ -d "/opt/homebrew/opt/openjdk@21/bin" ]; then
        export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"
    elif [ -d "/opt/homebrew/opt/openjdk/bin" ]; then
        export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"
    fi
fi

echo "📦 Using pnpm $(pnpm --version)"

if [ ! -d "$DIR/web/node_modules" ] || [ ! -f "$DIR/web/node_modules/.modules.yaml" ] || [ "$DIR/web/pnpm-lock.yaml" -nt "$DIR/web/node_modules/.modules.yaml" ]; then
    echo "📦 Installing web dependencies (missing or lockfile updated)..."
    (cd "$DIR/web" && pnpm install --frozen-lockfile)
fi

echo ""
echo "🔐 Scoping GCP credentials..."
echo "   Active gcloud default account and project remain unchanged on this machine."

PREVIOUS_REVISION=""
PREVIOUS_TRAFFIC=$(gcloud run services describe "$SERVICE_NAME" \
    --region "$GCP_REGION" \
    --flatten="status.traffic[]" \
    --format="csv[no-heading](status.traffic.revisionName,status.traffic.percent)" 2>/dev/null || true)
if [ -n "$PREVIOUS_TRAFFIC" ]; then
    PREVIOUS_REVISION=$(printf '%s\n' "$PREVIOUS_TRAFFIC" | awk -F, '$2 == 100 { print $1; exit }')
    if [ -z "$PREVIOUS_REVISION" ]; then
        PREVIOUS_REVISION=$(printf '%s\n' "$PREVIOUS_TRAFFIC" | awk -F, 'NF >= 1 { print $1; exit }')
    fi
fi

rollback_to_previous_revision() {
    if [ -z "$PREVIOUS_REVISION" ]; then
        echo "   ❌ No previous revision captured; cannot rollback automatically."
        return 1
    fi

    echo "   Rolling back traffic to $PREVIOUS_REVISION..."
    if ! timeout --foreground "$GCLOUD_TRAFFIC_TIMEOUT_SECONDS" gcloud run services update-traffic "$SERVICE_NAME" \
        --to-revisions="${PREVIOUS_REVISION}=100" \
        --region "$GCP_REGION" \
        --quiet; then
        echo "   ❌ Rollback failed. Manual rollback target: $PREVIOUS_REVISION"
        return 1
    fi
    echo "   ✅ Rolled back to $PREVIOUS_REVISION"
}

remove_smoke_tag() {
    timeout --foreground "$GCLOUD_TRAFFIC_TIMEOUT_SECONDS" gcloud run services update-traffic "$SERVICE_NAME" \
        --remove-tags="$SMOKE_TAG" \
        --region "$GCP_REGION" \
        --quiet >/dev/null 2>&1 || true
}

purge_cloudflare_cache() {
    if [ -z "$CLOUDFLARE_CACHE_PURGER" ] || [ -z "$CF_ZONE_ID" ]; then
        echo "   ⚠️  CLOUDFLARE_CACHE_PURGER or CF_ZONE_ID not set — skipping cache purge"
        return 0
    fi

    CF_RESPONSE=$(curl -s --max-time "$CLOUDFLARE_TIMEOUT_SECONDS" -X POST \
        "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
        -H "Authorization: Bearer ${CLOUDFLARE_CACHE_PURGER}" \
        -H "Content-Type: application/json" \
        --data '{"hosts":["leetllm.com","www.leetllm.com"]}')

    if echo "$CF_RESPONSE" | grep -q '"success":true'; then
        echo "   ✅ Cloudflare cache purged for leetllm.com"
    else
        echo "   ⚠️  Cache purge may have failed: $CF_RESPONSE"
    fi
}

# ── Step 1: Read env vars ────────────────────────────────────
echo ""
echo "📋 Step 1/8: Reading environment variables..."

CLOUDFLARE_CACHE_PURGER=""
DEPLOY_ENV_FILE=$(mktemp "${TMPDIR:-/tmp}/leetllm-env.XXXXXX.yaml")
BUILD_LOG=""
DEPLOY_LOG=""
RUNTIME_IMAGE_DOCKER_CONFIG=""
BUILD_CONTEXT_DIR=""
cleanup() {
    rm -f "$DEPLOY_ENV_FILE" "$BUILD_LOG" "$DEPLOY_LOG"
    if [ -n "$PNPM_SHIM_DIR" ]; then
        rm -rf "$PNPM_SHIM_DIR"
    fi
    if [ -n "$RUNTIME_IMAGE_DOCKER_CONFIG" ]; then
        rm -rf "$RUNTIME_IMAGE_DOCKER_CONFIG"
    fi
    if [ -n "$BUILD_CONTEXT_DIR" ]; then
        rm -rf "$BUILD_CONTEXT_DIR"
    fi
}
trap cleanup EXIT

if [ -f "$DIR/web/.env.local" ]; then
    while IFS= read -r line; do
        # Skip empty lines and comments
        if [[ -z "$line" || "$line" =~ ^# ]]; then
            continue
        fi
        # Override NEXT_PUBLIC_SITE_URL for production
        if [[ "$line" == NEXT_PUBLIC_SITE_URL=* ]]; then
            line="NEXT_PUBLIC_SITE_URL=$PRODUCTION_URL"
        fi
        # Extract deploy-only vars (not sent to Cloud Run)
        if [[ "$line" == CLOUDFLARE_CACHE_PURGER=* ]]; then
            CLOUDFLARE_CACHE_PURGER="${line#CLOUDFLARE_CACHE_PURGER=}"
            continue
        fi
        # Server credentials and local-only ADC overrides stay out of Cloud Run env.
        if [[ "$line" == GEMINI_API_KEY=* || "$line" == SUPABASE_SERVICE_ROLE_KEY=* || "$line" == RESEND_API_KEY=* || "$line" == CODEX_AUTH_JSON_B64=* || "$line" == PRACTICE_RUNNER_URL=* || "$line" == PRACTICE_RUNNER_REQUIRE_REMOTE=* || "$line" == GOOGLE_APPLICATION_CREDENTIALS=* ]]; then
            continue
        fi
        key="${line%%=*}"
        value="${line#*=}"
        value="${value//\\/\\\\}"
        value="${value//\"/\\\"}"
        printf '%s: "%s"\n' "$key" "$value" >> "$DEPLOY_ENV_FILE"
    done < "$DIR/web/.env.local"
fi
echo "   Loaded env vars from .env.local"

if [ "$DEPLOY_SANDBOX" -eq 1 ] || ! gcloud run services describe "$PRACTICE_SANDBOX_SERVICE" \
    --project "$GCP_PROJECT" --region "$GCP_REGION" >/dev/null 2>&1; then
    echo "   Ensuring isolated practice sandbox (${PRACTICE_SANDBOX_SERVICE}) is deployed..."
    "$DIR/scripts/deploy-sandbox.sh" --project="$GCP_PROJECT" --region="$GCP_REGION"
fi

PRACTICE_RUNNER_URL=$(gcloud run services describe "$PRACTICE_SANDBOX_SERVICE" \
    --project "$GCP_PROJECT" \
    --region "$GCP_REGION" \
    --format="value(status.url)")
if [ -z "$PRACTICE_RUNNER_URL" ]; then
    echo "❌ Error: Could not resolve isolated practice sandbox URL for ${PRACTICE_SANDBOX_SERVICE}." >&2
    exit 1
fi
gcloud run services add-iam-policy-binding "$PRACTICE_SANDBOX_SERVICE" \
    --project "$GCP_PROJECT" \
    --region "$GCP_REGION" \
    --member "serviceAccount:${RUNTIME_SERVICE_ACCOUNT}" \
    --role "roles/run.invoker" \
    --quiet >/dev/null
printf 'PRACTICE_RUNNER_URL: "%s"\n' "$PRACTICE_RUNNER_URL" >> "$DEPLOY_ENV_FILE"
printf 'PRACTICE_RUNNER_REQUIRE_REMOTE: "true"\n' >> "$DEPLOY_ENV_FILE"
echo "   Bound isolated practice sandbox: $PRACTICE_RUNNER_URL (require_remote=true)"

if [ -n "${IOS_PRIVATE_BLOG_EMAIL:-}" ] && ! grep -q '^IOS_PRIVATE_BLOG_EMAIL:' "$DEPLOY_ENV_FILE"; then
    printf 'IOS_PRIVATE_BLOG_EMAIL: "%s"\n' "$IOS_PRIVATE_BLOG_EMAIL" >> "$DEPLOY_ENV_FILE"
fi

if ! gcloud secrets describe "$RESEND_SECRET" --project "$GCP_PROJECT" >/dev/null 2>&1; then
    echo "❌ Error: Secret Manager secret $RESEND_SECRET is missing."
    exit 1
fi
gcloud secrets add-iam-policy-binding "$RESEND_SECRET" \
    --project "$GCP_PROJECT" \
    --member "serviceAccount:${RUNTIME_SERVICE_ACCOUNT}" \
    --role roles/secretmanager.secretAccessor \
    --quiet >/dev/null

CODEX_SECRET_BINDING=""
if gcloud secrets describe "$CODEX_AUTH_SECRET" --project "$GCP_PROJECT" >/dev/null 2>&1; then
    CODEX_SECRET_BINDING=",CODEX_AUTH_JSON_B64=${CODEX_AUTH_SECRET}:latest"
    gcloud secrets add-iam-policy-binding "$CODEX_AUTH_SECRET" \
        --project "$GCP_PROJECT" \
        --member "serviceAccount:${RUNTIME_SERVICE_ACCOUNT}" \
        --role roles/secretmanager.secretAccessor \
        --quiet >/dev/null
    gcloud secrets add-iam-policy-binding "$CODEX_AUTH_SECRET" \
        --project "$GCP_PROJECT" \
        --member "serviceAccount:${RUNTIME_SERVICE_ACCOUNT}" \
        --role roles/secretmanager.secretVersionAdder \
        --quiet >/dev/null
fi

if [ -f "$CODEX_AUTH_FILE" ]; then
    if [ "$(stat -c '%a' "$CODEX_AUTH_FILE")" != "600" ]; then
        echo "❌ Error: $CODEX_AUTH_FILE must use mode 600."
        exit 1
    fi
    if ! node -e 'const fs=require("fs"); const value=JSON.parse(fs.readFileSync(process.argv[1], "utf8")); const tokens=value.tokens ?? {}; if (!tokens.access_token || !tokens.refresh_token || !tokens.id_token) process.exit(1); const claims=JSON.parse(Buffer.from(tokens.access_token.split(".")[1], "base64url")); if (!claims.exp || claims.exp * 1000 <= Date.now() + 600000) process.exit(1)' "$CODEX_AUTH_FILE"; then
        echo "❌ Error: isolated Codex credentials are invalid or expire within 10 minutes."
        exit 1
    fi
    if ! gcloud secrets describe "$CODEX_AUTH_SECRET" --project "$GCP_PROJECT" >/dev/null 2>&1; then
        gcloud secrets create "$CODEX_AUTH_SECRET" --project "$GCP_PROJECT" --replication-policy automatic --quiet
    fi
    LOCAL_CODEX_AUTH_HASH=$(base64 -w 0 < "$CODEX_AUTH_FILE" | sha256sum | awk '{print $1}')
    REMOTE_CODEX_AUTH_HASH=""
    if REMOTE_CODEX_AUTH_HASH=$(gcloud secrets versions access latest \
        --secret "$CODEX_AUTH_SECRET" \
        --project "$GCP_PROJECT" 2>/dev/null \
        | sha256sum | awk '{print $1}'); then
        :
    else
        REMOTE_CODEX_AUTH_HASH=""
    fi
    if [ "$LOCAL_CODEX_AUTH_HASH" != "$REMOTE_CODEX_AUTH_HASH" ]; then
        base64 -w 0 < "$CODEX_AUTH_FILE" \
            | gcloud secrets versions add "$CODEX_AUTH_SECRET" --project "$GCP_PROJECT" --data-file=- --quiet >/dev/null
    fi
    gcloud secrets add-iam-policy-binding "$CODEX_AUTH_SECRET" \
        --project "$GCP_PROJECT" \
        --member "serviceAccount:${RUNTIME_SERVICE_ACCOUNT}" \
        --role roles/secretmanager.secretAccessor \
        --quiet >/dev/null
    gcloud secrets add-iam-policy-binding "$CODEX_AUTH_SECRET" \
        --project "$GCP_PROJECT" \
        --member "serviceAccount:${RUNTIME_SERVICE_ACCOUNT}" \
        --role roles/secretmanager.secretVersionAdder \
        --quiet >/dev/null
    CODEX_SECRET_BINDING=",CODEX_AUTH_JSON_B64=${CODEX_AUTH_SECRET}:latest"
    echo "   Synced isolated Codex credentials to Secret Manager"
elif [ -z "$CODEX_SECRET_BINDING" ]; then
    echo "   Codex credentials absent; personalization will use Gemini fallback"
fi

if [ -n "$CODEX_SECRET_BINDING" ]; then
    printf 'CODEX_AUTH_SECRET_RESOURCE: "projects/%s/secrets/%s"\n' "$GCP_PROJECT" "$CODEX_AUTH_SECRET" >> "$DEPLOY_ENV_FILE"
fi

if ! gcloud secrets versions access latest \
    --secret "$LEETY_E2E_SECRET" \
    --project "$GCP_PROJECT" >/dev/null 2>&1; then
    echo "❌ Error: Integration credentials are missing or unreadable: $LEETY_E2E_SECRET"
    echo "   Run: uv run scripts/provision-leety-integration-user.py"
    exit 1
fi

# ── Step 2: Smoke tests ──────────────────────────────────────────────
echo ""
if [ "$FAST_DEPLOY" -eq 1 ]; then
    echo "🧪 Step 2/8: Skipping pre-deploy smoke tests (--fast)"
    echo "   Skipped metadata, reading-time, references, content structure, next-callout, Python code-fence, and Vitest checks."
else
    echo "🧪 Step 2/8: Running pre-deploy smoke tests..."

    SMOKE_ERRORS=0

    echo "   Generating stable sitemap freshness hints..."
    uv run "$DIR/scripts/generate-content-lastmod.py"

    # Run independent read-only content smoke checks in parallel.
    SMOKE_LOG_DIR=$(mktemp -d "${TMPDIR:-/tmp}/leetllm-smoke.XXXXXX")
    SMOKE_LABELS=(
        "Validating metadata against schema"
        "Checking derived reading-time estimates"
        "Validating reference cross-references"
        "Validating content structure"
        "Validating 'Next' article callouts"
        "Validating mastery quizzes"
        "Validating runnable Python examples"
    )
    SMOKE_PIDS=()

    (uv run "$DIR/scripts/validate-metadata.py") >"$SMOKE_LOG_DIR/0.log" 2>&1 &
    SMOKE_PIDS+=($!)
    (uv run "$DIR/scripts/update-time-estimates.py" --check) >"$SMOKE_LOG_DIR/1.log" 2>&1 &
    SMOKE_PIDS+=($!)
    (uv run "$DIR/scripts/validate-references.py" --skip-http) >"$SMOKE_LOG_DIR/2.log" 2>&1 &
    SMOKE_PIDS+=($!)
    (uv run "$DIR/scripts/validate-content-structure.py") >"$SMOKE_LOG_DIR/3.log" 2>&1 &
    SMOKE_PIDS+=($!)
    (python3 "$DIR/scripts/validate-next-callouts.py") >"$SMOKE_LOG_DIR/4.log" 2>&1 &
    SMOKE_PIDS+=($!)
    (uv run "$DIR/scripts/validate-mastery-quizzes.py") >"$SMOKE_LOG_DIR/5.log" 2>&1 &
    SMOKE_PIDS+=($!)
    (uv run "$DIR/scripts/validate-python-examples.py" --workers "${PYTHON_EXAMPLE_WORKERS:-8}") >"$SMOKE_LOG_DIR/6.log" 2>&1 &
    SMOKE_PIDS+=($!)

    for idx in "${!SMOKE_PIDS[@]}"; do
        echo "   ${SMOKE_LABELS[$idx]}..."
        if ! wait "${SMOKE_PIDS[$idx]}"; then
            SMOKE_ERRORS=$((SMOKE_ERRORS + 1))
        fi
        cat "$SMOKE_LOG_DIR/${idx}.log"
    done
    rm -rf "$SMOKE_LOG_DIR"

    if [ "$SMOKE_ERRORS" -gt 0 ]; then
        echo ""
        echo "   ❌ Smoke tests failed with $SMOKE_ERRORS error(s). Fix the issues above before deploying."
        exit 1
    fi
    echo "   ✅ All smoke tests passed"

    echo "   Validating practice sample solutions..."
    cd "$DIR/web"
    if ! pnpm practice:validate; then
        echo ""
        echo "   ❌ Practice validation failed. Fix the issues above before deploying."
        exit 1
    fi
    echo "   ✅ Practice sample solutions passed"

    # 2c. Run the TypeScript test suite (content integrity + renderability checks)
    echo "   Running content integrity tests..."
    cd "$DIR/web"
    if ! pnpm test --run 2>&1; then
        echo ""
        echo "   ❌ Content tests failed. Fix the issues above before deploying."
        exit 1
    fi
    echo "   ✅ All content tests passed"
fi

# ── Step 3: Render illustrations ──────────────────────────────────────
echo ""
echo "🎨 Step 3/8: Rendering illustrations..."
cd "$DIR/web"
if ! pnpm illustrations:build; then
    echo ""
    echo "   ❌ Illustration rendering failed. Fix the issues above before deploying."
    exit 1
fi

# ── Step 3a: Validate generated illustrations & cover images ─────────────────
echo ""
if [ "$FAST_DEPLOY" -eq 1 ]; then
    echo "🖼️  Step 3a/8: Skipping illustration and coverImage validation (--fast)"
else
    echo "🖼️  Step 3a/8: Validating illustration quality (cleaning stale outputs)..."
    if ! uv run "$DIR/scripts/validate-illustration-quality.py" --clean-stale --fail-layout-warnings; then
        echo ""
        echo "   ❌ Illustration quality validation failed. Fix the issues above before deploying."
        exit 1
    fi

    echo "🖼️  Step 3b/8: Validating illustration refs, density, and coverImage files in parallel..."
    ILLUS_LOG_DIR=$(mktemp -d "${TMPDIR:-/tmp}/leetllm-illus-check.XXXXXX")
    ILLUS_LABELS=(
        "Illustration references"
        "Illustration density"
        "coverImage files"
    )
    ILLUS_PIDS=()
    (uv run "$DIR/scripts/validate-illustration-refs.py") >"$ILLUS_LOG_DIR/0.log" 2>&1 &
    ILLUS_PIDS+=($!)
    (uv run "$DIR/scripts/validate-illustration-density.py") >"$ILLUS_LOG_DIR/1.log" 2>&1 &
    ILLUS_PIDS+=($!)
    (uv run "$DIR/scripts/validate-coverimages.py") >"$ILLUS_LOG_DIR/2.log" 2>&1 &
    ILLUS_PIDS+=($!)

    ILLUS_ERRORS=0
    for idx in "${!ILLUS_PIDS[@]}"; do
        if ! wait "${ILLUS_PIDS[$idx]}"; then
            echo "   ❌ ${ILLUS_LABELS[$idx]} validation failed:"
            ILLUS_ERRORS=$((ILLUS_ERRORS + 1))
        fi
        cat "$ILLUS_LOG_DIR/${idx}.log"
    done
    rm -rf "$ILLUS_LOG_DIR"
    if [ "$ILLUS_ERRORS" -gt 0 ]; then
        echo ""
        echo "   ❌ Visual validation failed with $ILLUS_ERRORS error(s). Fix the issues above before deploying."
        exit 1
    fi
fi

# ── Step 4: Render diagrams (hash-cached delta-only) ──────────────────
echo ""
echo "📊 Step 4/8: Rendering diagrams (changed or missing only)..."
cd "$DIR/web"
if ! pnpm diagrams:build; then
    echo ""
    echo "   ❌ Diagram rendering failed. Fix the issues above before deploying."
    exit 1
fi
echo "   Diagrams up to date"

# ── Step 5: Build and deploy ─────────────────────────────────
echo ""
echo "🐳 Step 5/8: Building and deploying..."
cd "$DIR"

# Freeze the uploaded inputs so concurrent edits cannot change a build's identity.
BUILD_CONTEXT_DIR=$(mktemp -d "${TMPDIR:-/tmp}/leetllm-build-context.XXXXXX")
REBUILD_ARGS=()
if [ "$FORCE_REBUILD" -eq 1 ]; then
    REBUILD_ARGS=(--rebuild)
fi
BUILD_PLAN=$(uv run "$DIR/scripts/build-fingerprint.py" \
    --root "$DIR" \
    --snapshot-dir "$BUILD_CONTEXT_DIR/source" \
    --image-repository "$IMAGE_REPOSITORY" \
    --project "$GCP_PROJECT" \
    "${REBUILD_ARGS[@]}")
read -r BUILD_FINGERPRINT NEXT_CACHE_KEY NODE_IMAGE IMAGE_DIGEST <<< "$BUILD_PLAN"
IMAGE_URI="${IMAGE_REPOSITORY}:input-${BUILD_FINGERPRINT}"
DEPLOY_LOG=$(mktemp)

if [ "$IMAGE_DIGEST" = "-" ]; then
    SOURCE_REVISION=$(git rev-parse --short=12 HEAD 2>/dev/null || printf 'local')
    if [ -n "$(git status --porcelain --untracked-files=normal 2>/dev/null)" ]; then
        SOURCE_REVISION="${SOURCE_REVISION}-dirty"
    fi
    IMAGE_TAG="$(date -u +%Y%m%d%H%M%S)-${SOURCE_REVISION}"
    IMAGE_URI="${IMAGE_REPOSITORY}:${IMAGE_TAG}"
    BUILD_LOG=$(mktemp)

    echo "   Image: $IMAGE_URI"
    echo "   Cache: ${IMAGE_REPOSITORY}:buildcache"

    # Upload the frozen file set directly, without re-evaluating ignore rules.
    # Most payload bytes are already-compressed PNG/MP4 assets, so fast level-1
    # compression (with pigz when available) cuts packaging time dramatically.
    if command -v pigz >/dev/null 2>&1; then
        tar -cf - -C "$BUILD_CONTEXT_DIR/source" . | pigz -1 > "$BUILD_CONTEXT_DIR/source.tgz"
    else
        tar -cf - -C "$BUILD_CONTEXT_DIR/source" . | gzip -1 > "$BUILD_CONTEXT_DIR/source.tgz"
    fi

    # Build separately so Cloud Build can reuse a registry-backed BuildKit cache.
    set +e
    timeout --foreground "$GCLOUD_BUILD_TIMEOUT_SECONDS" env CLOUDSDK_CORE_DISABLE_FILE_LOGGING=true gcloud builds submit "$BUILD_CONTEXT_DIR/source.tgz" \
        --config "$BUILD_CONTEXT_DIR/source/cloudbuild.yaml" \
        --project "$GCP_PROJECT" \
        --region "$GCP_REGION" \
        --substitutions "_IMAGE_REPOSITORY=$IMAGE_REPOSITORY,_IMAGE_TAG=$IMAGE_TAG,_NODE_IMAGE=$NODE_IMAGE,_NEXT_CACHE_KEY=$NEXT_CACHE_KEY,_REBUILD=$FORCE_REBUILD" \
        --quiet 2>&1 | tee "$BUILD_LOG"
    BUILD_EXIT=${PIPESTATUS[0]}
    set -e

    if [ "$BUILD_EXIT" -ne 0 ]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "❌ Container build failed! Fetching build logs..."
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        if [ "$BUILD_EXIT" -eq 124 ]; then
            echo ""
            echo "⏱️  Cloud Build command timed out after ${GCLOUD_BUILD_TIMEOUT_SECONDS}s."
        fi

        BUILD_ID=$(grep -oP 'builds[;/]\K[a-f0-9-]+' "$BUILD_LOG" | head -1)
        if [ -z "$BUILD_ID" ]; then
            BUILD_ID=$(gcloud builds list \
                --project "$GCP_PROJECT" \
                --region "$GCP_REGION" \
                --limit 1 \
                --sort-by='~createTime' \
                --format='value(id)' 2>/dev/null)
        fi
        if [ -n "$BUILD_ID" ]; then
            echo ""
            echo "📋 Build ID: $BUILD_ID"
            echo ""
            gcloud builds log "$BUILD_ID" \
                --project "$GCP_PROJECT" \
                --region "$GCP_REGION" 2>/dev/null | tail -150
        fi
        exit 1
    fi

    rm -f "$BUILD_LOG"
    BUILD_LOG=""

    IMAGE_DIGEST=$(gcloud artifacts docker images describe "$IMAGE_URI" \
        --project "$GCP_PROJECT" \
        --format='value(image_summary.digest)')
    if [ -z "$IMAGE_DIGEST" ]; then
        echo "❌ Built image digest could not be resolved: $IMAGE_URI"
        exit 1
    fi
else
    echo "   Reusing the validated image for unchanged build inputs: $IMAGE_URI"
    # Match the build path's retention pin before pulling the reused image.
    gcloud artifacts docker tags add "${IMAGE_REPOSITORY}@${IMAGE_DIGEST}" "${IMAGE_REPOSITORY}:latest" \
        --project "$GCP_PROJECT" --quiet
fi
DEPLOY_IMAGE="${IMAGE_REPOSITORY}@${IMAGE_DIGEST}"
echo "   ✅ Image: $DEPLOY_IMAGE"

echo "   Validating immutable runtime image contents..."
RUNTIME_IMAGE_DOCKER_CONFIG=$(mktemp -d "${TMPDIR:-/tmp}/leetllm-docker-config.XXXXXX")
if ! DOCKER_CONFIG="$RUNTIME_IMAGE_DOCKER_CONFIG" gcloud auth configure-docker \
    "${GCP_REGION}-docker.pkg.dev" --quiet >/dev/null; then
    echo "❌ Could not configure temporary Artifact Registry credentials for image validation."
    exit 1
fi
cd "$DIR/web"
if ! DOCKER_CONFIG="$RUNTIME_IMAGE_DOCKER_CONFIG" pnpm runtime-image:validate -- "$DEPLOY_IMAGE"; then
    echo "❌ Immutable runtime image validation failed. Cloud Run was not changed."
    exit 1
fi
cd "$DIR"
echo "   ✅ Immutable runtime image contents match the deploy source"

CURRENT_BUILD_PLAN=$(uv run "$DIR/scripts/build-fingerprint.py" --root "$DIR" --base-image "$NODE_IMAGE")
if [ "${CURRENT_BUILD_PLAN%% *}" != "$BUILD_FINGERPRINT" ]; then
    echo "❌ Production build inputs changed during the build. Rerun deploy with the updated source."
    exit 1
fi

# Publish the reuse marker only after the build and source/image validation pass.
if [ "$IMAGE_URI" != "${IMAGE_REPOSITORY}:input-${BUILD_FINGERPRINT}" ]; then
    gcloud artifacts docker tags add "$DEPLOY_IMAGE" "${IMAGE_REPOSITORY}:input-${BUILD_FINGERPRINT}" \
        --project "$GCP_PROJECT" --quiet
fi

# Temporarily disable set -e so we can capture deployment failure output.
set +e
timeout --foreground "$GCLOUD_DEPLOY_TIMEOUT_SECONDS" env CLOUDSDK_CORE_DISABLE_FILE_LOGGING=true gcloud --verbosity=warning run deploy "$SERVICE_NAME" \
    --image "$DEPLOY_IMAGE" \
    --project "$GCP_PROJECT" \
    --region "$GCP_REGION" \
    --no-traffic \
    --tag "$SMOKE_TAG" \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --cpu-boost \
    --min 0 \
    --min-instances 0 \
    --max-instances 3 \
    --service-account "$RUNTIME_SERVICE_ACCOUNT" \
    --set-secrets "GEMINI_API_KEY=${GEMINI_SECRET}:latest,SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_SECRET}:latest,RESEND_API_KEY=${RESEND_SECRET}:latest${CODEX_SECRET_BINDING}" \
    --env-vars-file "$DEPLOY_ENV_FILE" \
    --quiet 2>&1 | tee "$DEPLOY_LOG"
DEPLOY_EXIT=${PIPESTATUS[0]}
set -e

if [ "$DEPLOY_EXIT" -ne 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ Cloud Run deployment failed!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    if [ "$DEPLOY_EXIT" -eq 124 ]; then
        echo ""
        echo "⏱️  Cloud Run deploy timed out after ${GCLOUD_DEPLOY_TIMEOUT_SECONDS}s."
    fi
    exit 1
fi

rm -f "$DEPLOY_LOG"
DEPLOY_LOG=""
echo "✅ Deployed to Cloud Run"

# ── Step 6: Verify and Route Traffic ───────────────────────────
echo ""
echo "🔍 Step 6/8: Verifying and routing traffic..."

if ! SERVICE_URL=$(timeout --foreground "$GCLOUD_DESCRIBE_TIMEOUT_SECONDS" gcloud run services describe "$SERVICE_NAME" \
    --region "$GCP_REGION" \
    --format="value(status.url)"); then
    echo ""
    echo "   ❌ Timed out resolving service URL after ${GCLOUD_DESCRIBE_TIMEOUT_SECONDS}s."
    exit 1
fi

echo "   ✅ Service URL: $SERVICE_URL"

if ! SMOKE_TRAFFIC=$(timeout --foreground "$GCLOUD_DESCRIBE_TIMEOUT_SECONDS" gcloud run services describe "$SERVICE_NAME" \
    --region "$GCP_REGION" \
    --flatten="status.traffic[]" \
    --format="csv[no-heading](status.traffic.tag,status.traffic.url,status.traffic.revisionName)"); then
    echo ""
    echo "   ❌ Timed out resolving smoke URL after ${GCLOUD_DESCRIBE_TIMEOUT_SECONDS}s."
    exit 1
fi
SMOKE_URL=$(printf '%s\n' "$SMOKE_TRAFFIC" | awk -F, -v tag="$SMOKE_TAG" '$1 == tag { print $2; exit }')
LATEST_REVISION=$(printf '%s\n' "$SMOKE_TRAFFIC" | awk -F, -v tag="$SMOKE_TAG" '$1 == tag { print $3; exit }')

if [ -z "$LATEST_REVISION" ] || [ -z "$SMOKE_URL" ]; then
    echo ""
    echo "   ❌ Could not resolve candidate revision or smoke URL."
    echo "      revision=$LATEST_REVISION"
    echo "      smoke_url=$SMOKE_URL"
    exit 1
fi

echo "   Candidate revision: $LATEST_REVISION"
echo "   Smoke URL: $SMOKE_URL"

echo "   Validating candidate learn and blog routes..."
set +e
timeout --foreground "$LIVE_ROUTE_STEP_TIMEOUT_SECONDS" uv run "$DIR/scripts/validate-live-content-routes.py" "$SMOKE_URL" \
    --timeout "$LIVE_ROUTE_REQUEST_TIMEOUT_SECONDS" \
    --retries "$LIVE_ROUTE_RETRIES" \
    --cold-start \
    --max-cold-total "$COLD_ROUTE_MAX_TOTAL_SECONDS"
SMOKE_EXIT=$?
set -e
if [ "$SMOKE_EXIT" -ne 0 ]; then
    echo ""
    if [ "$SMOKE_EXIT" -eq 124 ]; then
        echo "   ❌ Candidate content route validation timed out after ${LIVE_ROUTE_STEP_TIMEOUT_SECONDS}s."
    fi
    echo "   ❌ Candidate content route validation failed. Live traffic remains on previous revision."
    remove_smoke_tag
    exit 1
fi

echo "   Validating authenticated Leety paths on candidate..."
set +e
timeout --foreground "$LEETY_SMOKE_STEP_TIMEOUT_SECONDS" uv run "$DIR/scripts/validate-leety-integration.py" "$SMOKE_URL" \
    --project "$GCP_PROJECT" \
    --credentials-secret "$LEETY_E2E_SECRET" \
    --timeout "$LEETY_SMOKE_REQUEST_TIMEOUT_SECONDS"
LEETY_SMOKE_EXIT=$?
set -e
if [ "$LEETY_SMOKE_EXIT" -ne 0 ]; then
    echo ""
    if [ "$LEETY_SMOKE_EXIT" -eq 124 ]; then
        echo "   ❌ Candidate Leety integration smoke timed out after ${LEETY_SMOKE_STEP_TIMEOUT_SECONDS}s."
    fi
    echo "   ❌ Candidate Leety integration smoke failed. Live traffic remains on previous revision."
    remove_smoke_tag
    exit 1
fi

echo "   Routing 100% of traffic to $LATEST_REVISION..."
if ! timeout --foreground "$GCLOUD_TRAFFIC_TIMEOUT_SECONDS" gcloud run services update-traffic "$SERVICE_NAME" \
    --to-revisions="${LATEST_REVISION}=100" \
    --region "$GCP_REGION" \
    --quiet; then
    echo ""
    echo "   ❌ Traffic routing timed out or failed after ${GCLOUD_TRAFFIC_TIMEOUT_SECONDS}s."
    remove_smoke_tag
    exit 1
fi
echo "   ✅ Traffic routed"

# ── Step 7: Purge Cloudflare cache ───────────────────────────
echo ""
echo "🧹 Step 7/8: Purging Cloudflare cache..."
purge_cloudflare_cache

# ── Step 8: Production smoke tests ───────────────────────────
echo ""
echo "🧪 Step 8/8: Running production smoke tests..."

set +e
timeout --foreground "$LIVE_ROUTE_STEP_TIMEOUT_SECONDS" uv run "$DIR/scripts/validate-live-content-routes.py" "$PRODUCTION_URL" --timeout "$LIVE_ROUTE_REQUEST_TIMEOUT_SECONDS" --retries "$LIVE_ROUTE_RETRIES"
PRODUCTION_SMOKE_EXIT=$?
set -e
if [ "$PRODUCTION_SMOKE_EXIT" -ne 0 ]; then
    echo ""
    if [ "$PRODUCTION_SMOKE_EXIT" -eq 124 ]; then
        echo "   ❌ Production content smoke timed out after ${LIVE_ROUTE_STEP_TIMEOUT_SECONDS}s."
    fi
    echo "   ❌ Production content smoke failed. Rolling back deployment."
    if rollback_to_previous_revision; then
        purge_cloudflare_cache
    fi
    remove_smoke_tag
    exit 1
fi

echo "   Validating authenticated Leety paths through production origin..."
set +e
timeout --foreground "$LEETY_SMOKE_STEP_TIMEOUT_SECONDS" uv run "$DIR/scripts/validate-leety-integration.py" "$PRODUCTION_URL" \
    --project "$GCP_PROJECT" \
    --credentials-secret "$LEETY_E2E_SECRET" \
    --timeout "$LEETY_SMOKE_REQUEST_TIMEOUT_SECONDS"
PRODUCTION_LEETY_SMOKE_EXIT=$?
set -e
if [ "$PRODUCTION_LEETY_SMOKE_EXIT" -ne 0 ]; then
    echo ""
    if [ "$PRODUCTION_LEETY_SMOKE_EXIT" -eq 124 ]; then
        echo "   ❌ Production Leety integration smoke timed out after ${LEETY_SMOKE_STEP_TIMEOUT_SECONDS}s."
    fi
    echo "   ❌ Production Leety integration smoke failed. Rolling back deployment."
    if rollback_to_previous_revision; then
        purge_cloudflare_cache
    fi
    remove_smoke_tag
    exit 1
fi
echo "   ✅ Production content and Leety smoke passed"
remove_smoke_tag

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Deployment complete!"
echo "🌐 Cloud Run:  $SERVICE_URL"
echo "🌐 Production: $PRODUCTION_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
