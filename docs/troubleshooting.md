# LeetLLM Troubleshooting Guide

## Infrastructure Overview

| Component       | Details                                      |
| --------------- | -------------------------------------------- |
| Hosting         | Google Cloud Run (`us-central1`)             |
| Service name    | `leetllm`                                    |
| GCP Project     | `<your-gcp-project>`                           |
| Container port  | `8080` (internal; external is 443 via HTTPS) |
| Framework       | Next.js 16 (standalone output)               |
| CDN / DNS       | Cloudflare                                   |
| Auth            | Supabase                                     |
| Domain          | `leetllm.com` (canonical, non-www)           |

---

## 1. Checking Cloud Run Logs

### Quick overview - recent request logs

```bash
# Simple, human-readable format (most recent first)
gcloud run services logs read leetllm --region us-central1 --limit=30

# Filter for errors (500s, 404s, etc.)
gcloud run services logs read leetllm --region us-central1 --limit=200 \
  | grep -E " 500 | 502 | 503 "

# Filter for non-200 responses
gcloud run services logs read leetllm --region us-central1 --limit=200 \
  | grep -vE " 200 | 304 | 307 | 301 "
```

### Detailed logs via Cloud Logging API

Cloud Run produces **two log streams** per service:

| Log name                               | Contains                                         |
| -------------------------------------- | ------------------------------------------------ |
| `run.googleapis.com/requests`          | HTTP request logs with status, latency, URL, etc. |
| `run.googleapis.com/stdout` (or stderr)| Application stdout/stderr (console.log, errors)   |

#### Request-level HTTP logs (auto-generated)

```bash
# All HTTP errors (500, 502, 503, etc.)
gcloud logging read \
  'resource.type="cloud_run_revision"
   AND resource.labels.service_name="leetllm"
   AND httpRequest.status>=500' \
  --limit=10 \
  --format="table(timestamp,httpRequest.status,httpRequest.requestUrl,httpRequest.latency,httpRequest.userAgent)"

# Specific HTTP status code
gcloud logging read \
  'resource.type="cloud_run_revision"
   AND resource.labels.service_name="leetllm"
   AND httpRequest.status=500' \
  --limit=10 --format=json
```

#### Application-level logs (stdout/stderr)

```bash
# All app logs (NOT request logs) - this is where console.log/console.error goes
gcloud logging read \
  'resource.type="cloud_run_revision"
   AND resource.labels.service_name="leetllm"
   AND NOT logName:"run.googleapis.com%2Frequests"' \
  --limit=20 \
  --format="value(timestamp,severity,textPayload)"

# Only error-level app logs
gcloud logging read \
  'resource.type="cloud_run_revision"
   AND resource.labels.service_name="leetllm"
   AND NOT logName:"run.googleapis.com%2Frequests"
   AND severity>=ERROR' \
  --limit=10 \
  --format="value(timestamp,severity,textPayload)"
```

#### Correlating request errors with app logs (trace ID)

When a 500 happens, Cloud Run assigns a trace ID. You can correlate the HTTP error with application-level logs from the same request:

```bash
# Step 1: Get the trace ID from the error request
gcloud logging read \
  'resource.type="cloud_run_revision"
   AND resource.labels.service_name="leetllm"
   AND httpRequest.status=500' \
  --limit=1 \
  --format="value(trace,timestamp,httpRequest.requestUrl)"

# Step 2: Find all logs for that trace
gcloud logging read \
  'resource.type="cloud_run_revision"
   AND resource.labels.service_name="leetllm"
   AND trace="projects/<your-gcp-project>/traces/<TRACE_ID>"' \
  --format=json
```

> **⚠️ Note:** Trace-based queries can be slow (30s+). Be patient.

#### Time-windowed queries

```bash
# Logs from a specific time window
gcloud logging read \
  'resource.type="cloud_run_revision"
   AND resource.labels.service_name="leetllm"
   AND timestamp>="2026-02-13T16:00:00Z"
   AND timestamp<="2026-02-13T17:00:00Z"' \
  --limit=50 \
  --format="value(timestamp,severity,textPayload,httpRequest.status,httpRequest.requestUrl)"
```

### Cloud Console UI (alternative)

The GCP Cloud Console UI can be easier for browsing logs:

```
https://console.cloud.google.com/run/detail/us-central1/leetllm/logs?project=<your-gcp-project>
```

Or use the Logs Explorer directly:

```
https://console.cloud.google.com/logs/query;query=resource.type%3D%22cloud_run_revision%22%20AND%20resource.labels.service_name%3D%22leetllm%22?project=<your-gcp-project>
```

---

## 2. Checking Service Configuration

```bash
# Current service status, URL, and env vars
gcloud run services describe leetllm --region us-central1 \
  --format="yaml(status.address.url,spec.template.spec.containers[0].env)"

# Current revision details (memory, CPU, scaling)
gcloud run services describe leetllm --region us-central1 \
  --format="yaml(spec.template.spec.containers[0].resources,spec.template.metadata.annotations)"

# List all revisions and their traffic split
gcloud run revisions list --service=leetllm --region=us-central1
```

---

## 3. Common Failure Patterns

### 3.1 `www.leetllm.com` redirecting to `leetllm.com:8080`

**Root cause:** The Next.js middleware uses `request.nextUrl.clone()` to construct the redirect URL. Inside Cloud Run, the internal port (8080) leaks into `nextUrl.port`, producing `https://leetllm.com:8080/`.

**Fix:** Construct the redirect URL from scratch instead of cloning `nextUrl`:
```typescript
const canonicalUrl = `https://${canonicalHost}${request.nextUrl.pathname}${request.nextUrl.search}`
return NextResponse.redirect(canonicalUrl, 301)
```

### 3.2 Dashboard 500 error (server-side exception)

**Symptoms:** Authenticated user visits `/dashboard` → sees "Application error: a server-side exception has occurred".

**Debugging steps:**
1. Check Cloud Logging for the specific error (see Section 1)
2. Check if the `profiles` table has a row for the user (`auth.uid()` must match)
3. Check if Supabase RLS policies are configured correctly
4. Check the app logs for stack traces (see "Known limitation" below)

**Known limitation:** Next.js in production mode does **NOT** log server-side rendering errors to stdout/stderr by default. This means:
- Cloud Run request logs will show `status: 500`
- But there may be **NO corresponding application log** with the actual error message or stack trace
- To fix this, consider adding a custom error handler (see Section 5)

### 3.3 Content loading failures

The article loader (`lib/questions.ts` / `lib/content-utils.ts`) reads from the filesystem at runtime. Content lives under `web/src/content/`.

In the Docker container, the path resolves to `/app/src/content/` because:
- `Dockerfile` copies `.next/standalone/` → `/app/`
- Next.js file tracing includes `src/content/` in standalone output
- `process.cwd()` is `/app/`

If content is missing, check that the standalone build included it:
```bash
# In local build:
ls -la web/.next/standalone/src/content/

# In running container:
gcloud run services exec leetllm --region us-central1 -- ls /app/src/content/
```

### 3.4 Cold start issues

Cloud Run scale-to-zero means first requests may be slow:
```bash
# Check instance startup time
gcloud logging read \
  'resource.type="cloud_run_revision"
   AND resource.labels.service_name="leetllm"
   AND textPayload:"Starting new instance"' \
  --limit=5 \
  --format="value(timestamp,textPayload)"
```

Current config: `--min-instances 0 --max-instances 3`

---

## 4. Local Reproduction

### Dev server
```bash
cd web && pnpm dev
# Access at http://localhost:3000
```

### Standalone server (mimics production)
```bash
cd web && pnpm build
cd .next/standalone
PORT=3000 node server.js
# Access at http://localhost:3000
# Note: static files need to be served separately; copy .next/static → .next/standalone/.next/static
```

### Full Docker build (closest to production)
```bash
docker build -t leetllm .
docker run -p 3000:8080 \
  -e NEXT_PUBLIC_SUPABASE_URL=... \
  -e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=... \
  -e SUPABASE_SERVICE_ROLE_KEY=... \
  leetllm
```

---

## 5. Improving Error Visibility

### Problem

Next.js standalone server in production **swallows SSR errors** - they result in a 500 response but the actual Error / stack trace is not written to stdout/stderr, so Cloud Logging has no details.

### Solution: Add `instrumentation.ts`

Create `web/src/instrumentation.ts` to capture unhandled errors:

```typescript
export function onRequestError(
  err: { digest: string; message: string },
  request: { path: string; method: string; headers: Record<string, string> },
  context: { routerKind: string; routePath: string; routeType: string; renderSource: string }
) {
  console.error('[SSR ERROR]', {
    digest: err.digest,
    message: err.message,
    path: request.path,
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
    renderSource: context.renderSource,
  })
}
```

This ensures every SSR error is logged to stderr, which Cloud Logging will capture.

### Solution: Add `app/error.tsx` and `app/global-error.tsx`

These provide user-facing error boundaries and can also log errors.

---

## 6. Deployment

```bash
# Deploy from project root
./deploy.sh

# Manual cached build and deploy
IMAGE_REPOSITORY="us-central1-docker.pkg.dev/<your-gcp-project>/cloud-run-source-deploy/leetllm"
IMAGE_TAG="$(date -u +%Y%m%d%H%M%S)-$(git rev-parse --short=12 HEAD)"
gcloud builds submit . \
  --config cloudbuild.yaml \
  --project <your-gcp-project> \
  --region us-central1 \
  --substitutions "_IMAGE_REPOSITORY=$IMAGE_REPOSITORY,_IMAGE_TAG=$IMAGE_TAG"

IMAGE_DIGEST=$(gcloud artifacts docker images describe "$IMAGE_REPOSITORY:$IMAGE_TAG" \
  --project <your-gcp-project> \
  --format='value(image_summary.digest)')
gcloud run deploy leetllm \
  --image "$IMAGE_REPOSITORY@$IMAGE_DIGEST" \
  --project <your-gcp-project> \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars "NEXT_PUBLIC_SITE_URL=https://leetllm.com,..."
```

### Verify deployment

```bash
# Check current revision
gcloud run revisions list --service=leetllm --region=us-central1 --limit=3

# Quick health check
curl -sI https://leetllm.com | head -5
curl -sI https://www.leetllm.com | head -10  # Should 301 → leetllm.com

# Check for 500s
curl -s https://leetllm.com/dashboard -o /dev/null -w "%{http_code}\n"  # 307 (redirect to /login, expected)
```

---

## 7. DNS / Cloudflare

- DNS is managed via Cloudflare
- Cloudflare proxies traffic (orange cloud) to Cloud Run
- `www.leetllm.com` CNAME → `leetllm.com` (redirect handled by Next.js middleware)
- SSL termination at Cloudflare + Cloud Run

### Check DNS
```bash
dig leetllm.com +short
dig www.leetllm.com +short
```

### Check redirect chain
```bash
curl -sIL https://www.leetllm.com 2>&1 | grep -E "^(HTTP|location:)"
```
