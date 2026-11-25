#!/usr/bin/env bash
# Deploy the isolated on-demand LeetLLM Codex runner service (`leetllm-codex`) to Cloud Run.
# Runs with --min 0 and IAM-only access under a dedicated service account scoped strictly to
# the `leetllm-codex-auth-json-b64` secret.
set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

if [ -f "$DIR/secrets/deploy.env" ]; then
    set -a
    # shellcheck disable=SC1091
    source "$DIR/secrets/deploy.env"
    set +a
fi

GCLOUD_ACCOUNT="${GCLOUD_ACCOUNT:-${CLOUDSDK_CORE_ACCOUNT:-}}"
GCLOUD_PROJECT="${GCLOUD_PROJECT:-${CLOUDSDK_CORE_PROJECT:-}}"
GCP_REGION="${GCP_REGION:-us-central1}"
CODEX_SERVICE_NAME="${CODEX_RUNNER_SERVICE:-leetllm-codex}"
CODEX_AUTH_SECRET="leetllm-codex-auth-json-b64"
CODEX_AUTH_FILE="$DIR/secrets/codex/auth.json"

for arg in "$@"; do
    case "$arg" in
        --account=*) GCLOUD_ACCOUNT="${arg#*=}" ;;
        --project=*) GCLOUD_PROJECT="${arg#*=}" ;;
        --region=*) GCP_REGION="${arg#*=}" ;;
        -h|--help)
            echo "Usage: ./scripts/deploy-codex.sh [--account=EMAIL] [--project=PROJECT] [--region=REGION]"
            exit 0
            ;;
        *)
            echo "Unknown argument: $arg" >&2
            exit 1
            ;;
    esac
done

if [ -z "$GCLOUD_PROJECT" ]; then
    echo "Error: GCLOUD_PROJECT is required (set --project, GCLOUD_PROJECT, or secrets/deploy.env)." >&2
    exit 1
fi

if [ -n "$GCLOUD_ACCOUNT" ]; then
    export CLOUDSDK_CORE_ACCOUNT="$GCLOUD_ACCOUNT"
fi
export CLOUDSDK_CORE_PROJECT="$GCLOUD_PROJECT"

CODEX_SA_NAME="leetllm-codex"
CODEX_SERVICE_ACCOUNT="${CODEX_SERVICE_ACCOUNT:-${CODEX_SA_NAME}@${GCLOUD_PROJECT}.iam.gserviceaccount.com}"
RUNTIME_SERVICE_ACCOUNT="${RUNTIME_SERVICE_ACCOUNT:-leetllm-runtime@${GCLOUD_PROJECT}.iam.gserviceaccount.com}"
IMAGE_REPOSITORY="${GCP_REGION}-docker.pkg.dev/${GCLOUD_PROJECT}/cloud-run-source-deploy/${CODEX_SERVICE_NAME}"
IMAGE_TAG="$(date -u +%Y%m%d%H%M%S)-$(git -C "$DIR" rev-parse --short=12 HEAD 2>/dev/null || echo manual)"

echo "🔒 Deploying isolated Codex runner (${CODEX_SERVICE_NAME})..."
echo "   Project:         $GCLOUD_PROJECT"
echo "   Region:          $GCP_REGION"
echo "   Codex SA:        $CODEX_SERVICE_ACCOUNT (secret-scoped only)"
echo "   Allowed invoker: $RUNTIME_SERVICE_ACCOUNT"

# 1. Ensure dedicated service account exists with zero project-level IAM bindings
if ! gcloud iam service-accounts describe "$CODEX_SERVICE_ACCOUNT" --project "$GCLOUD_PROJECT" >/dev/null 2>&1; then
    echo "   Creating dedicated service account: $CODEX_SERVICE_ACCOUNT"
    gcloud iam service-accounts create "$CODEX_SA_NAME" \
        --project "$GCLOUD_PROJECT" \
        --display-name "LeetLLM Codex Runner" \
        --description "Isolated runtime identity for on-demand Codex CLI generation." \
        --quiet
fi

PROJECT_ROLES=$(gcloud projects get-iam-policy "$GCLOUD_PROJECT" \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:${CODEX_SERVICE_ACCOUNT}" \
    --format="value(bindings.role)" 2>/dev/null || true)
if [ -n "$PROJECT_ROLES" ]; then
    echo "❌ Refusing to deploy: ${CODEX_SERVICE_ACCOUNT} must have ZERO project IAM roles, found:" >&2
    echo "$PROJECT_ROLES" >&2
    exit 1
fi

# 2. Sync isolated Codex credentials if present locally, and grant secret-only access to CODEX_SERVICE_ACCOUNT
if [ -f "$CODEX_AUTH_FILE" ]; then
    if [ "$(stat -c '%a' "$CODEX_AUTH_FILE")" != "600" ]; then
        echo "❌ Error: $CODEX_AUTH_FILE must use mode 600." >&2
        exit 1
    fi
    if ! gcloud secrets describe "$CODEX_AUTH_SECRET" --project "$GCLOUD_PROJECT" >/dev/null 2>&1; then
        gcloud secrets create "$CODEX_AUTH_SECRET" --project "$GCLOUD_PROJECT" --replication-policy automatic --quiet
    fi
    LOCAL_HASH=$(base64 -w 0 < "$CODEX_AUTH_FILE" | sha256sum | awk '{print $1}')
    REMOTE_HASH=$(gcloud secrets versions access latest --secret "$CODEX_AUTH_SECRET" --project "$GCLOUD_PROJECT" 2>/dev/null | sha256sum | awk '{print $1}' || true)
    if [ "$LOCAL_HASH" != "$REMOTE_HASH" ]; then
        base64 -w 0 < "$CODEX_AUTH_FILE" | gcloud secrets versions add "$CODEX_AUTH_SECRET" --project "$GCLOUD_PROJECT" --data-file=- --quiet >/dev/null
    fi
fi

SECRET_ARGS=()
ENV_VARS="NODE_ENV=production,CODEX_MAX_CONCURRENT_GENERATIONS=4"
if gcloud secrets describe "$CODEX_AUTH_SECRET" --project "$GCLOUD_PROJECT" >/dev/null 2>&1; then
    gcloud secrets add-iam-policy-binding "$CODEX_AUTH_SECRET" \
        --project "$GCLOUD_PROJECT" \
        --member "serviceAccount:${CODEX_SERVICE_ACCOUNT}" \
        --role roles/secretmanager.secretAccessor \
        --quiet >/dev/null
    gcloud secrets add-iam-policy-binding "$CODEX_AUTH_SECRET" \
        --project "$GCLOUD_PROJECT" \
        --member "serviceAccount:${CODEX_SERVICE_ACCOUNT}" \
        --role roles/secretmanager.secretVersionAdder \
        --quiet >/dev/null
    SECRET_ARGS=(--set-secrets "CODEX_AUTH_JSON_B64=${CODEX_AUTH_SECRET}:latest")
    ENV_VARS="${ENV_VARS},CODEX_AUTH_SECRET_RESOURCE=projects/${GCLOUD_PROJECT}/secrets/${CODEX_AUTH_SECRET}"
fi

# 3. Build minimal Codex runner image via Cloud Build
SNAPSHOT_DIR=$(mktemp -d "${TMPDIR:-/tmp}/leetllm-codex-build.XXXXXX")
trap 'rm -rf "$SNAPSHOT_DIR"' EXIT
mkdir -p "$SNAPSHOT_DIR/web/src/lib" "$SNAPSHOT_DIR/services/codex-runner"
cp "$DIR/Dockerfile.codex" "$SNAPSHOT_DIR/Dockerfile.codex"
cp "$DIR/cloudbuild.codex.yaml" "$SNAPSHOT_DIR/cloudbuild.codex.yaml"
cp "$DIR/web/src/lib/codex-runner-core.ts" "$SNAPSHOT_DIR/web/src/lib/"
cp "$DIR/services/codex-runner/server.ts" "$SNAPSHOT_DIR/services/codex-runner/"

echo "   Building Codex runner image (${IMAGE_REPOSITORY}:${IMAGE_TAG})..."
gcloud builds submit "$SNAPSHOT_DIR" \
    --config "$SNAPSHOT_DIR/cloudbuild.codex.yaml" \
    --project "$GCLOUD_PROJECT" \
    --region "$GCP_REGION" \
    --substitutions "_IMAGE_REPOSITORY=${IMAGE_REPOSITORY},_IMAGE_TAG=${IMAGE_TAG}" \
    --quiet

IMAGE_DIGEST=$(gcloud artifacts docker images describe "${IMAGE_REPOSITORY}:${IMAGE_TAG}" \
    --project "$GCLOUD_PROJECT" \
    --format='value(image_summary.digest)')
DEPLOY_IMAGE="${IMAGE_REPOSITORY}@${IMAGE_DIGEST}"
echo "   ✅ Built Codex runner image: $DEPLOY_IMAGE"

# 4. Deploy Cloud Run service (Gen1 for fastest cold start, --cpu-boost, --min 0, IAM-only)
echo "   Deploying Cloud Run service ${CODEX_SERVICE_NAME}..."
gcloud run deploy "$CODEX_SERVICE_NAME" \
    --image "$DEPLOY_IMAGE" \
    --project "$GCLOUD_PROJECT" \
    --region "$GCP_REGION" \
    --no-allow-unauthenticated \
    --service-account "$CODEX_SERVICE_ACCOUNT" \
    "${SECRET_ARGS[@]}" \
    --set-env-vars "$ENV_VARS" \
    --port 8080 \
    --cpu 1 \
    --memory 1Gi \
    --cpu-boost \
    --concurrency 4 \
    --timeout 180 \
    --min 0 \
    --min-instances 0 \
    --max-instances 3 \
    --quiet

# 5. Grant roles/run.invoker ONLY on this service to leetllm-runtime
gcloud run services add-iam-policy-binding "$CODEX_SERVICE_NAME" \
    --project "$GCLOUD_PROJECT" \
    --region "$GCP_REGION" \
    --member "serviceAccount:${RUNTIME_SERVICE_ACCOUNT}" \
    --role "roles/run.invoker" \
    --quiet >/dev/null

CODEX_URL=$(gcloud run services describe "$CODEX_SERVICE_NAME" \
    --project "$GCLOUD_PROJECT" \
    --region "$GCP_REGION" \
    --format="value(status.url)")

# 6. Verify unauthenticated rejection (401/403) and authenticated /health cold start
UNAUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${CODEX_URL}/health")
if [ "$UNAUTH_STATUS" != "401" ] && [ "$UNAUTH_STATUS" != "403" ]; then
    echo "❌ Expected unauthenticated access to ${CODEX_URL}/health to return 401/403, got ${UNAUTH_STATUS}" >&2
    exit 1
fi
echo "   ✅ Unauthenticated access blocked (HTTP ${UNAUTH_STATUS})"

ID_TOKEN=$(gcloud auth print-identity-token --audiences="${CODEX_URL}" 2>/dev/null || gcloud auth print-identity-token)
HEALTH_OUT=$(curl -fsS -H "Authorization: Bearer ${ID_TOKEN}" -w "\n   Cold /health timing: ttfb=%{time_starttransfer}s total=%{time_total}s" "${CODEX_URL}/health")
echo "   ✅ Authenticated /health: ${HEALTH_OUT}"
echo "   ✅ Codex runner URL: ${CODEX_URL}"
