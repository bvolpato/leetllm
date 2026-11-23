#!/usr/bin/env bash
# Deploy the isolated zero-secret LeetLLM practice sandbox to Cloud Run.
# Runs in the SAME GCP project under a dedicated zero-IAM service account
# (`leetllm-sandbox@<project>.iam.gserviceaccount.com`) with ZERO secrets.
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
SANDBOX_SERVICE_NAME="${PRACTICE_SANDBOX_SERVICE:-leetllm-sandbox}"
WEB_SERVICE_NAME="${SERVICE_NAME:-leetllm}"

for arg in "$@"; do
    case "$arg" in
        --account=*) GCLOUD_ACCOUNT="${arg#*=}" ;;
        --project=*) GCLOUD_PROJECT="${arg#*=}" ;;
        --region=*) GCP_REGION="${arg#*=}" ;;
        -h|--help)
            echo "Usage: ./scripts/deploy-sandbox.sh [--account=EMAIL] [--project=PROJECT] [--region=REGION]"
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

SANDBOX_SA_NAME="leetllm-sandbox"
SANDBOX_SERVICE_ACCOUNT="${SANDBOX_SERVICE_ACCOUNT:-${SANDBOX_SA_NAME}@${GCLOUD_PROJECT}.iam.gserviceaccount.com}"
RUNTIME_SERVICE_ACCOUNT="${RUNTIME_SERVICE_ACCOUNT:-leetllm-runtime@${GCLOUD_PROJECT}.iam.gserviceaccount.com}"
IMAGE_REPOSITORY="${GCP_REGION}-docker.pkg.dev/${GCLOUD_PROJECT}/cloud-run-source-deploy/${SANDBOX_SERVICE_NAME}"
IMAGE_TAG="$(date -u +%Y%m%d%H%M%S)-$(git -C "$DIR" rev-parse --short=12 HEAD 2>/dev/null || echo manual)"

echo "🔒 Deploying isolated practice sandbox (${SANDBOX_SERVICE_NAME})..."
echo "   Project:         $GCLOUD_PROJECT"
echo "   Region:          $GCP_REGION"
echo "   Sandbox SA:      $SANDBOX_SERVICE_ACCOUNT (zero IAM roles, zero secrets)"
echo "   Allowed invoker: $RUNTIME_SERVICE_ACCOUNT"

# 1. Ensure dedicated zero-privilege sandbox service account exists
if ! gcloud iam service-accounts describe "$SANDBOX_SERVICE_ACCOUNT" --project "$GCLOUD_PROJECT" >/dev/null 2>&1; then
    echo "   Creating zero-privilege service account: $SANDBOX_SERVICE_ACCOUNT"
    gcloud iam service-accounts create "$SANDBOX_SA_NAME" \
        --project "$GCLOUD_PROJECT" \
        --display-name "LeetLLM Practice Sandbox (Zero Privilege)" \
        --description "Zero-permission runtime identity for untrusted practice code execution." \
        --quiet
fi

# Verify sandbox SA has ZERO project-level IAM bindings
PROJECT_ROLES=$(gcloud projects get-iam-policy "$GCLOUD_PROJECT" \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:${SANDBOX_SERVICE_ACCOUNT}" \
    --format="value(bindings.role)" 2>/dev/null || true)
if [ -n "$PROJECT_ROLES" ]; then
    echo "❌ Refusing to deploy: ${SANDBOX_SERVICE_ACCOUNT} must have ZERO project IAM roles, found:" >&2
    echo "$PROJECT_ROLES" >&2
    exit 1
fi

# 2. Build minimal sandbox image via Cloud Build using an isolated snapshot
SNAPSHOT_DIR=$(mktemp -d "${TMPDIR:-/tmp}/leetllm-sandbox-build.XXXXXX")
trap 'rm -rf "$SNAPSHOT_DIR"' EXIT
mkdir -p "$SNAPSHOT_DIR/web/src/lib" "$SNAPSHOT_DIR/services/practice-sandbox"
cp "$DIR/Dockerfile.sandbox" "$SNAPSHOT_DIR/Dockerfile.sandbox"
cp "$DIR/cloudbuild.sandbox.yaml" "$SNAPSHOT_DIR/cloudbuild.sandbox.yaml"
cp "$DIR/web/src/lib/practice-languages.ts" "$SNAPSHOT_DIR/web/src/lib/"
cp "$DIR/web/src/lib/practice-java-sandbox.ts" "$SNAPSHOT_DIR/web/src/lib/"
cp "$DIR/web/src/lib/practice-sandbox-exec.ts" "$SNAPSHOT_DIR/web/src/lib/"
cp "$DIR/web/src/lib/practice-runner.ts" "$SNAPSHOT_DIR/web/src/lib/"
cp "$DIR/services/practice-sandbox/server.ts" "$SNAPSHOT_DIR/services/practice-sandbox/"

echo "   Building sandbox image (${IMAGE_REPOSITORY}:${IMAGE_TAG})..."
gcloud builds submit "$SNAPSHOT_DIR" \
    --config "$SNAPSHOT_DIR/cloudbuild.sandbox.yaml" \
    --project "$GCLOUD_PROJECT" \
    --region "$GCP_REGION" \
    --substitutions "_IMAGE_REPOSITORY=${IMAGE_REPOSITORY},_IMAGE_TAG=${IMAGE_TAG}" \
    --quiet

IMAGE_DIGEST=$(gcloud artifacts docker images describe "${IMAGE_REPOSITORY}:${IMAGE_TAG}" \
    --project "$GCLOUD_PROJECT" \
    --format='value(image_summary.digest)')
DEPLOY_IMAGE="${IMAGE_REPOSITORY}@${IMAGE_DIGEST}"
echo "   ✅ Built sandbox image: $DEPLOY_IMAGE"

# 3. Deploy Cloud Run sandbox service (Gen2, private IAM-only, ZERO secrets)
echo "   Deploying Cloud Run service ${SANDBOX_SERVICE_NAME}..."
gcloud run deploy "$SANDBOX_SERVICE_NAME" \
    --image "$DEPLOY_IMAGE" \
    --project "$GCLOUD_PROJECT" \
    --region "$GCP_REGION" \
    --execution-environment gen2 \
    --no-allow-unauthenticated \
    --service-account "$SANDBOX_SERVICE_ACCOUNT" \
    --clear-secrets \
    --set-env-vars "NODE_ENV=production,PRACTICE_SANDBOX_BWRAP=auto,SANDBOX_MAX_CONCURRENT=4" \
    --port 8080 \
    --cpu 1 \
    --memory 1Gi \
    --concurrency 4 \
    --timeout 30 \
    --min-instances 0 \
    --max-instances 3 \
    --quiet

# 4. Grant roles/run.invoker ONLY on this sandbox service to leetllm-runtime
gcloud run services add-iam-policy-binding "$SANDBOX_SERVICE_NAME" \
    --project "$GCLOUD_PROJECT" \
    --region "$GCP_REGION" \
    --member "serviceAccount:${RUNTIME_SERVICE_ACCOUNT}" \
    --role "roles/run.invoker" \
    --quiet >/dev/null

SANDBOX_URL=$(gcloud run services describe "$SANDBOX_SERVICE_NAME" \
    --project "$GCLOUD_PROJECT" \
    --region "$GCP_REGION" \
    --format="value(status.url)")

# 5. Verify unauthenticated access is rejected (401/403) and authenticated /health + /run smoke pass
UNAUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${SANDBOX_URL}/health")
if [ "$UNAUTH_STATUS" != "401" ] && [ "$UNAUTH_STATUS" != "403" ]; then
    echo "❌ Expected unauthenticated access to ${SANDBOX_URL}/health to return 401/403, got ${UNAUTH_STATUS}" >&2
    exit 1
fi
echo "   ✅ Unauthenticated access blocked (HTTP ${UNAUTH_STATUS})"

ID_TOKEN=$(gcloud auth print-identity-token --audiences="${SANDBOX_URL}" 2>/dev/null || gcloud auth print-identity-token)
HEALTH_JSON=$(curl -fsS -H "Authorization: Bearer ${ID_TOKEN}" "${SANDBOX_URL}/health")
echo "   ✅ Authenticated /health: ${HEALTH_JSON}"

SMOKE_JSON=$(curl -fsS -X POST "${SANDBOX_URL}/run" \
    -H "Authorization: Bearer ${ID_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"spec":{"slug":"smoke","language":"python3","timeLimitMs":2000,"memoryLimitMb":128,"testCases":[{"name":"smoke","visibility":"sample","code":"from solution import solve\nassert solve(1, 2) == 3"}]},"code":"def solve(a, b):\n    return a + b\n","mode":"run"}')
if ! echo "$SMOKE_JSON" | grep -q '"ok":true'; then
    echo "❌ Authenticated /run smoke failed: ${SMOKE_JSON}" >&2
    exit 1
fi
echo "   ✅ Authenticated /run smoke: ${SMOKE_JSON}"
echo "   ✅ Sandbox URL: ${SANDBOX_URL}"
