# LeetLLM - Deployment Guide

## Deployment Methods

### Production Deployment (Recommended)

```bash
./deploy.sh
```

Full pipeline: metadata → derived reading time → references → content structure → next-callout validation → runnable Python examples → content tests → illustration render → illustration refs/quality → declared coverImage validation → diagrams → registry-cached Cloud Build → verify the immutable image's runtime-content manifest against the deploy source → deploy immutable image candidate with `--no-traffic` + smoke tag → validate the first Markdown route as a bounded cold-start request plus known Learn/blog routes, retired-blog redirects, and gzip negotiation on candidate → POST anonymous sign-out and recheck representative Learn/blog routes → route 100% traffic to candidate → purge Cloudflare → repeat production route, auth-transition, and gzip smoke → rollback to previous revision and purge cache if production smoke fails.

### Fast Production Deployment

```bash
./deploy.sh --fast
```

Fast mode skips pre-deploy smoke tests, illustration ref/quality validation, coverImage validation, and diagram/code-fence rendering. It still:
- renders changed illustrations through cached build path
- deploys candidate revision with `--no-traffic`
- runs candidate route smoke
- verifies anonymous sign-out does not invalidate static Learn/blog routes
- verifies public text routes return gzip when clients advertise `Accept-Encoding: gzip`
- migrates traffic
- purges Cloudflare
- runs production route smoke

Traffic lookups must flatten `status.traffic[]` before CSV formatting. With multiple revision tags, an unflattened projection combines tags and URLs into semicolon-separated fields. Resolve the candidate URL and revision from the same `deploy-smoke` entry. The rollback lookup matches revision and percentage within one row, preferring the entry serving 100% of traffic.

## Container Build Cache

`deploy.sh` snapshots the files selected by `.gcloudignore` after rendering visual assets. It fingerprints their paths, bytes, and executable modes together with the resolved Node base-image digest and target platform. An existing `leetllm:input-<fingerprint>` tag reuses its immutable image without submitting Cloud Build. Reuse points `latest` to the selected digest before runtime validation, matching the new-build path's retention protection. The marker is published only after the build and runtime-content image validation pass. Changes outside the uploaded context, such as lesson-video work, do not force an image rebuild. If uploaded inputs change during image validation, deployment stops before Cloud Run changes.

Changed inputs submit the frozen snapshot with `cloudbuild.yaml`, then deploy the resulting image by digest. BuildKit stores all Docker stages under `leetllm:buildcache`. A separate `leetllm:nextcache-<toolchain-key>` image persists `.next/cache` across fresh Cloud Build machines. The key covers the Node digest, Dockerfile, dependency lockfile, patches, and compiler configuration. Each build pins the imported cache digest before publishing an updated cache tag, so concurrent builds cannot import a partially published cache. Expire obsolete toolchain-cache tags with the registry lifecycle policy; do not create one cache tag per source revision. The runtime image does not include this compiler-cache image.

Cloud Build uses `E2_HIGHCPU_8`. Keep `--cache-to ... mode=max` so intermediate `deps` and `builder` stages remain reusable. Do not replace the image build with `gcloud run deploy --source`; that convenience path currently forces `docker build --no-cache` and bypasses this cache.

The runner image also seeds Node's module compile cache during the image build.
`web/scripts/prewarm-node-cache.mjs` starts the standalone server as UID 1001,
requests the public home, Learn, and tensor article routes, then stops the server
and verifies that it flushed compiled modules. The runtime uses the same Node
binary, `/app` paths, and UID through `NODE_COMPILE_CACHE=/app/.node-compile-cache`.
Rebuild the cache with each image. Keep it free of credentials and request data;
it contains compiled modules, while user authentication still runs per request.
Use `NODE_DISABLE_COMPILE_CACHE=1` for a diagnostic control. This cache reduces
JavaScript compilation work; candidate cold-start smoke still measures the
complete Cloud Run request.

Use `--fast` only after local validation gates already passed in same workflow.

Use `./deploy.sh --rebuild` to bypass image reuse and Docker layer caching for a deliberate base/system dependency refresh. This also starts with an empty Next.js compiler cache. A newer Node base-image digest automatically invalidates the normal reuse key.

Do not submit a bare clean or detached production worktree when generated content assets are untracked. Seed the exact deployed `_generated` and `social_banner.png` files only after verifying that the worktree's content sources and metadata match the source revision of that image. The Docker build writes a deterministic relative-path, size, and SHA-256 manifest for every selected runtime-content file. Before Cloud Run changes, `deploy.sh` runs the built digest with networking and capabilities disabled, verifies every image file against that manifest, and requires the manifest digest to match the current deploy source. Missing, extra, and different counts must all be zero.

**Prerequisites:**
- gcloud CLI authenticated (configure `GCLOUD_ACCOUNT`, `GCLOUD_PROJECT`, and `CF_ZONE_ID` in gitignored `secrets/deploy.env` from `deploy.env.example`, or pass `--account` and `--project`)
- Docker installed with a running daemon; deploy uses an isolated temporary credential-helper configuration to pull the immutable Artifact Registry digest
- `web/.env.local` with production values (gitignored; see `web/.env.local.example`)
- `CLOUDFLARE_CACHE_PURGER` is optional and only used for the cache purge step

**Options:**
- `--account=EMAIL`: Explicitly set the gcloud account for this deploy run.
- `--project=PROJECT`: Explicitly set the GCP project.
- `--config=NAME`: Explicitly set the gcloud configuration profile.
- `--fast`: Fast deploy mode.
- `--rebuild`: Force a clean container build and dependency refresh.
- `--with-sandbox`: Also rebuild and deploy the isolated `leetllm-sandbox` Cloud Run service before deploying the web app.

## Infrastructure

| Component | Details |
|-----------|---------|
| **Platform** | Google Cloud Run |
| **Region** | us-central1 |
| **Web Service** | `leetllm` (SA: `leetllm-runtime@<project>.iam.gserviceaccount.com`) |
| **Practice Sandbox** | `leetllm-sandbox` (Gen2, IAM-only, SA: `leetllm-sandbox@<project>.iam.gserviceaccount.com`, 0 IAM roles, 0 secrets) |
| **Project** | Configured via `GCLOUD_PROJECT` / `secrets/deploy.env` |
| **Port** | 8080 |
| **Domain** | leetllm.com (Cloudflare) |
| **Lesson videos** | Cloudflare R2 `leetllm-videos`, served through `videos.leetllm.com` |

Deploy the isolated practice sandbox directly with:

```bash
./scripts/deploy-sandbox.sh
```

`deploy.sh` ensures `leetllm-sandbox` exists, binds `roles/run.invoker` on `leetllm-sandbox` solely to `leetllm-runtime`, and configures `PRACTICE_RUNNER_URL` plus `PRACTICE_RUNNER_REQUIRE_REMOTE=true` on the web service. The web container image omits Python and OpenJDK so untrusted practice code never executes beside runtime secrets.

Deployment purges only `leetllm.com` and `www.leetllm.com`, preserving the separate
immutable video cache. See [video delivery](./docs/video-delivery.md) for uploads,
verification and the article availability manifest.

## Cloudflare Lesson HTML

Keep Email Obfuscation disabled for `leetllm.com/learn/*` through the scoped
[configuration rule](./scripts/config/cloudflare-learn-html-rule.json). The
zone-wide setting stays enabled. Cloudflare otherwise rewrites literal email
examples in code and quiz text, changing the server HTML before React hydrates it.

The rule belongs to the `http_config_settings` phase. Find its stable `ref` before
updating it, preserve existing rules, and change only its email-obfuscation
setting. The JSON records the desired rule without account-specific IDs or
credentials. See [Cloudflare's endpoint-scoped setting](https://developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation/).

After changing HTML transformations, compare the public response with the origin
and run a hydrated browser check on a lesson containing literal email examples.
Verify both the example text and the absence of hydration errors; HTTP 200 and
image checks alone do not cover this behavior.

## Environment Variables

Required in `web/.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_service_...

# Site
NEXT_PUBLIC_SITE_URL=https://leetllm.com

# Gemini personalization (local only; production uses Secret Manager)
GEMINI_API_KEY=your-server-only-key

# Transactional email (local only; production uses Secret Manager)
RESEND_API_KEY=your-server-only-key

# Ordered lesson personalization providers
PERSONALIZATION_MODELS=codex/gpt-6-luna:high,google/gemini-3.5-flash-lite

# Cloudflare (optional)
CLOUDFLARE_CACHE_PURGER=your-token
```

## Manual Deployment

```bash
# Build cached image, then deploy it
set -e
GCP_PROJECT="${GCLOUD_PROJECT:?Set GCLOUD_PROJECT or source secrets/deploy.env}"
IMAGE_REPOSITORY="us-central1-docker.pkg.dev/${GCP_PROJECT}/cloud-run-source-deploy/leetllm"
IMAGE_TAG="$(date -u +%Y%m%d%H%M%S)-$(git rev-parse --short=12 HEAD)"
gcloud builds submit . \
    --config cloudbuild.yaml \
    --project "$GCP_PROJECT" \
    --region us-central1 \
    --substitutions "_IMAGE_REPOSITORY=$IMAGE_REPOSITORY,_IMAGE_TAG=$IMAGE_TAG"

IMAGE_DIGEST=$(gcloud artifacts docker images describe "$IMAGE_REPOSITORY:$IMAGE_TAG" \
    --project "$GCP_PROJECT" \
    --format='value(image_summary.digest)')
RUNTIME_IMAGE_DOCKER_CONFIG="$(mktemp -d)"
DOCKER_CONFIG="$RUNTIME_IMAGE_DOCKER_CONFIG" gcloud auth configure-docker \
    us-central1-docker.pkg.dev --quiet
(cd web && DOCKER_CONFIG="$RUNTIME_IMAGE_DOCKER_CONFIG" \
    pnpm runtime-image:validate -- "$IMAGE_REPOSITORY@$IMAGE_DIGEST")
rm -rf "$RUNTIME_IMAGE_DOCKER_CONFIG"
gcloud run deploy leetllm \
    --image "$IMAGE_REPOSITORY@$IMAGE_DIGEST" \
    --project "$GCP_PROJECT" \
    --region us-central1 \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --cpu-boost \
    --min 0 \
    --min-instances 0 \
    --max-instances 3 \
    --service-account "leetllm-runtime@${GCP_PROJECT}.iam.gserviceaccount.com" \
    --set-secrets GEMINI_API_KEY=leetllm-gemini-api-key:latest,SUPABASE_SERVICE_ROLE_KEY=leetllm-supabase-service-role-key:latest,RESEND_API_KEY=leetllm-resend-api-key:latest,CODEX_AUTH_JSON_B64=leetllm-codex-auth-json-b64:latest \
    --set-env-vars "NEXT_PUBLIC_SITE_URL=https://leetllm.com,PRACTICE_RUNNER_REQUIRE_REMOTE=true,..."
```

## Docker Build (Local Testing)

```bash
# Build image
docker build -t leetllm .

# Run locally
docker run -p 3000:8080 \
    -e NEXT_PUBLIC_SUPABASE_URL=... \
    -e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=... \
    -e SUPABASE_SERVICE_ROLE_KEY=... \
    -e GEMINI_API_KEY=... \
    -e RESEND_API_KEY=... \
    leetllm
```

## Database Setup

`deploy.sh` does not apply database migrations. Apply required migrations before deploying application code that depends on new tables or columns.

Run SQL migrations in order:

```bash
# In Supabase SQL Editor
supabase/schema/000-schema.sql          # Core schema
supabase/schema/002-user-read-progress.sql  # Progress tracking
supabase/schema/003-article-comments.sql    # Comments
supabase/schema/004-user-study-state.sql    # Plans, bookmarks, notes, and quiz history
supabase/schema/005-research-plan-goal.sql  # AI Research Scientist learning plans
supabase/schema/006-user-personalization.sql  # Preferences, generated lessons, and quota claims
supabase/schema/007-lock-personalized-lessons.sql  # Read-only user cache; service-role-only writes
supabase/schema/008-personalization-cost-telemetry.sql  # Token usage and cost estimates
supabase/schema/009-ml-plan-goal.sql  # Production ML engineer learning plan goal
```

Production Gemini, Supabase service-role, and Resend keys use Secret Manager. Cloud Run uses dedicated `leetllm-runtime@<project>.iam.gserviceaccount.com` identity with access limited to those secrets and `roles/run.invoker` on `leetllm-sandbox` only. `deploy.sh` excludes their local values from generated Cloud Run environment configuration and binds secret versions at deploy time.

## Authenticated Leety integration account

Leety deployment smoke uses ordinary Supabase password authentication. Credentials live in `leetllm-e2e-user` in Secret Manager and are read by deploy tooling. They are never granted to LeetLLM runtime service account, bound to Cloud Run, or committed locally.

Provision account once:

```bash
uv run scripts/provision-leety-integration-user.py
```

Rotate password, add new secret version, and disable previous credential versions:

```bash
uv run scripts/provision-leety-integration-user.py --rotate
```

Candidate and production smoke checks use same account through browser cookies, native-style Bearer authentication, and refreshed Bearer authentication. They submit one idempotent grounded question so retries reuse Leety request cache and stay within account rate limit.

Run `./scripts/codex_auth_device_login.py` before first Codex-backed deployment, or when OpenAI requires a new sign-in, to issue isolated LeetLLM credentials. It writes ignored `secrets/codex/auth.json` without reading `~/.codex/auth.json`. `deploy.sh` validates mode 600, base64-encodes it through stdin into `leetllm-codex-auth-json-b64`, and binds it only as server secret `CODEX_AUTH_JSON_B64`. If neither local nor remote Codex secret exists, lesson personalization skips Codex and falls back to Gemini. Resume bytes always use Gemini.

Codex CLI refreshes expired access tokens inside its isolated runtime home. After a refresh, runtime adds rotated credentials as a new version of only `leetllm-codex-auth-json-b64`; service account has `secretAccessor` and `secretVersionAdder` on that secret. Concurrent instances that lose a refresh race reload latest secret version and retry once. Re-run device login only when refresh token is rejected or revoked.

## GitHub OAuth Setup

1. Create OAuth App at github.com/settings/developers
2. Set callback URL: `https://<project>.supabase.co/auth/v1/callback`
3. Add Client ID/Secret to Supabase Dashboard → Authentication → Providers → GitHub

## Deployment Verification

```bash
# Check service URL
gcloud run services describe leetllm --region us-central1 --format="value(status.url)"

# Health check
curl -sI https://leetllm.com | head -5

# Check for 500s
curl -s https://leetllm.com/learn -o /dev/null -w "%{http_code}\n"

# List revisions
gcloud run revisions list --service=leetllm --region=us-central1

# Run deploy content smoke manually
uv run scripts/validate-live-content-routes.py https://leetllm.com --timeout 30 --retries 3
```

For a fresh candidate container, make a canonical route such as `/api/md/numpy-and-tensor-shapes` the first content-backed dynamic request. Use `--cold-start --max-cold-total 30` with `validate-live-content-routes.py`; the first request is not retried, reads at most 2 MiB, reports time to first byte and total time, and verifies canonical body markers before the known lesson alias. A warm retry can hide a full-corpus cold lookup.

## Rollback

`./deploy.sh` captures the revision that had 100% traffic before deployment. If production content smoke fails after traffic migration, it automatically routes 100% traffic back to that revision and purges Cloudflare.

```bash
# List revisions
gcloud run revisions list --service=leetllm --region=us-central1

# Rollback to specific revision
gcloud run services update-traffic leetllm \
    --region=us-central1 \
    --to-revisions leetllm-XXXXX=100
```

## Troubleshooting Deployment

**Build fails:**
```bash
# Check Cloud Build logs
gcloud builds log <BUILD_ID> --region us-central1
```

**Service doesn't start:**
```bash
# Check service logs
gcloud run services logs read leetllm --region us-central1 --limit=50
```

**Candidate route smoke fails:**
```bash
# Candidate traffic remains at 0%; live traffic should still be on previous revision.
gcloud run services describe leetllm --region us-central1 --format="yaml(status.traffic)"
```

**Production route smoke fails after traffic migration:**
```bash
# deploy.sh attempts automatic rollback. Verify active traffic:
gcloud run services describe leetllm --region us-central1 --format="yaml(status.traffic)"
uv run scripts/validate-live-content-routes.py https://leetllm.com --timeout 30 --retries 3
```

**Environment variables missing:**
```bash
# Check current env vars
gcloud run services describe leetllm --region us-central1 \
    --format="yaml(spec.template.spec.containers[0].env)"
```
