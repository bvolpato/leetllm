# LeetLLM - Monitoring Guide

## Log Access

### Cloud Run Request Logs

```bash
# Recent requests (human-readable)
gcloud run services logs read leetllm --region us-central1 --limit=30

# Errors only
gcloud run services logs read leetllm --region us-central1 --limit=200 \
    | grep -E " 500 | 502 | 503 "

# Non-200 responses
gcloud run services logs read leetllm --region us-central1 --limit=200 \
    | grep -vE " 200 | 304 | 307 | 301 "
```

### Cloud Logging (Detailed)

**HTTP Request Logs:**
```bash
gcloud logging read \
    'resource.type="cloud_run_revision"
     AND resource.labels.service_name="leetllm"
     AND httpRequest.status>=500' \
    --limit=10 \
    --format="table(timestamp,httpRequest.status,httpRequest.requestUrl,httpRequest.latency)"
```

**Application Logs (stdout/stderr):**
```bash
gcloud logging read \
    'resource.type="cloud_run_revision"
     AND resource.labels.service_name="leetllm"
     AND NOT logName:"run.googleapis.com%2Frequests"' \
    --limit=20 \
    --format="value(timestamp,severity,textPayload)"
```

**Error-Level Logs:**
```bash
gcloud logging read \
    'resource.type="cloud_run_revision"
     AND resource.labels.service_name="leetllm"
     AND NOT logName:"run.googleapis.com%2Frequests"
     AND severity>=ERROR' \
    --limit=10
```

### Correlating Errors by Trace ID

```bash
# Step 1: Get trace ID from error
gcloud logging read \
    'resource.type="cloud_run_revision"
     AND resource.labels.service_name="leetllm"
     AND httpRequest.status=500' \
    --limit=1 \
    --format="value(trace)"

# Step 2: Find all logs for that trace
gcloud logging read \
    'resource.type="cloud_run_revision"
     AND resource.labels.service_name="leetllm"
     AND trace="projects/${GCLOUD_PROJECT}/traces/<TRACE_ID>"' \
    --format=json
```

## Key Metrics to Watch

| Metric | Warning | Critical |
|--------|---------|----------|
| **HTTP 500s** | > 1% of requests | > 5% of requests |
| **Response Time** | > 2s p95 | > 5s p95 |
| **Cold Start** | > 5s | > 10s |
| **Memory Usage** | > 800MB | > 950MB |

## Google Analytics Traffic

GA4 account `378829560`, property `524774529`, measurement ID `G-YR84XSNV6Y`.

Product funnel events: `track_selected`, `lesson_started`, `quiz_submitted`, `lesson_completed`, `practice_problem_view`, `practice_started`, `practice_passed`, `signup_completed`, and `learner_returned_7d`. `practice_problem_view` means the learner opened a coding problem; `practice_started` means they submitted a code run; `practice_passed` means the run passed. `lesson_completed` is emitted when a learner passes the mastery quiz or manually marks the lesson read, with the method in `completion_method`. `learner_returned_7d` is a one-time, browser-local return after seven days; it does not identify a signed-in account. Treat `article_view` and `cta_click` as supporting navigation signals, not activation or completion.

Production reports document-level `TTFB`, `FCP`, `LCP`, `INP`, and `CLS` using the `web-vitals` library. The `value` parameter is an integer in milliseconds, except `CLS`, which is multiplied by 1000 (`metric_unit=CLSx1000`). Divide CLS values by 1000 before comparing with Web Vitals thresholds. `metric_id` identifies a metric instance; use its final value when calculating document-level distributions and deduplicating reports. `page_location` is the canonical original document URL without query or hash, and `document_path` is its path. Client-side route changes do not create separate document-level Web Vitals records, so attribution remains tied to the original document URL. `metric_rating` and `navigation_type` provide context. These performance events are separate from the product funnel; do not mark them as key events. GA accepts event counts without custom definitions; parameter breakdowns and percentile dashboards need configured definitions or raw event exports.

Use `${STATS_SERVICE_ACCOUNT}` for stats access. Do not rely on the current user token for GA/Search Console pulls; user `gcloud auth` often lacks the required analytics or webmasters scopes.

```bash
STATS_SERVICE_ACCOUNT="${STATS_SERVICE_ACCOUNT}"
```

### Top Pages

```bash
GA_PROPERTY_ID="524774529"
STATS_SERVICE_ACCOUNT="${STATS_SERVICE_ACCOUNT}"
TOKEN=$(gcloud auth print-access-token \
    --impersonate-service-account="${STATS_SERVICE_ACCOUNT}" \
    --scopes=https://www.googleapis.com/auth/analytics.readonly 2>/dev/null)

curl -sS \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -X POST "https://analyticsdata.googleapis.com/v1beta/properties/${GA_PROPERTY_ID}:runReport" \
    -d '{
      "dateRanges": [{"startDate": "7daysAgo", "endDate": "today"}],
      "dimensions": [{"name": "pagePath"}],
      "metrics": [
        {"name": "activeUsers"},
        {"name": "screenPageViews"},
        {"name": "sessions"}
      ],
      "orderBys": [{"metric": {"metricName": "screenPageViews"}, "desc": true}],
      "limit": 15
    }' \
    | jq -r '(["page","users","views","sessions"] | @tsv), (.rows[] | [.dimensionValues[0].value, .metricValues[0].value, .metricValues[1].value, .metricValues[2].value] | @tsv)' \
    | column -t -s $'\t'
```

### Realtime Users

```bash
GA_PROPERTY_ID="524774529"
STATS_SERVICE_ACCOUNT="${STATS_SERVICE_ACCOUNT}"
TOKEN=$(gcloud auth print-access-token \
    --impersonate-service-account="${STATS_SERVICE_ACCOUNT}" \
    --scopes=https://www.googleapis.com/auth/analytics.readonly 2>/dev/null)

curl -sS \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -X POST "https://analyticsdata.googleapis.com/v1beta/properties/${GA_PROPERTY_ID}:runRealtimeReport" \
    -d '{
      "dimensions": [{"name": "unifiedScreenName"}],
      "metrics": [{"name": "activeUsers"}],
      "limit": 10
    }' \
    | jq -r '(["screen","active_users"] | @tsv), ((.rows // [])[] | [.dimensionValues[0].value, .metricValues[0].value] | @tsv)' \
    | column -t -s $'\t'
```

### Open Curriculum Events

```bash
GA_PROPERTY_ID="524774529"
STATS_SERVICE_ACCOUNT="${STATS_SERVICE_ACCOUNT}"
TOKEN=$(gcloud auth print-access-token \
    --impersonate-service-account="${STATS_SERVICE_ACCOUNT}" \
    --scopes=https://www.googleapis.com/auth/analytics.readonly 2>/dev/null)

curl -sS \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -X POST "https://analyticsdata.googleapis.com/v1beta/properties/${GA_PROPERTY_ID}:runReport" \
    -d '{
      "dateRanges": [{"startDate": "7daysAgo", "endDate": "today"}],
      "dimensions": [{"name": "eventName"}],
      "metrics": [
        {"name": "eventCount"},
        {"name": "totalUsers"}
      ],
      "dimensionFilter": {
        "filter": {
          "fieldName": "eventName",
          "inListFilter": {
            "values": [
              "page_view", "track_selected", "lesson_started", "quiz_submitted", "lesson_completed",
              "practice_problem_view", "practice_started", "practice_passed", "sign_up_start",
              "signup_completed", "learner_returned_7d", "article_view", "cta_click"
            ]
          }
        }
      },
      "orderBys": [{"metric": {"metricName": "eventCount"}, "desc": true}]
    }' \
    | jq -r '(["event","count","users"] | @tsv), ((.rows // [])[] | [.dimensionValues[0].value, .metricValues[0].value, .metricValues[1].value] | @tsv)' \
    | column -t -s $'\t'
```

### GA Auth Troubleshooting

```bash
# Required APIs
gcloud services enable analyticsdata.googleapis.com analyticsadmin.googleapis.com

# Required impersonation grant
gcloud iam service-accounts add-iam-policy-binding \
    ${STATS_SERVICE_ACCOUNT} \
    --member="user:${GCLOUD_ACCOUNT}" \
    --role="roles/iam.serviceAccountTokenCreator"
```

If GA returns `ACCESS_TOKEN_SCOPE_INSUFFICIENT`, refresh the token with the `analytics.readonly` scope as shown above. If GA returns property access errors, confirm the service account still has Viewer or higher access on GA4 property `524774529`.

## Google Search Console Traffic

Search Console property: `sc-domain:leetllm.com`.

Use the same service account for search stats. It has owner access to the Search Console domain property.

### Search Console Sites

```bash
STATS_SERVICE_ACCOUNT="${STATS_SERVICE_ACCOUNT}"
TOKEN=$(gcloud auth print-access-token \
    --impersonate-service-account="${STATS_SERVICE_ACCOUNT}" \
    --scopes=https://www.googleapis.com/auth/webmasters.readonly 2>/dev/null)

curl -sS \
    -H "Authorization: Bearer ${TOKEN}" \
    "https://www.googleapis.com/webmasters/v3/sites" \
    | jq -r '(["site","permission"] | @tsv), ((.siteEntry // [])[] | [.siteUrl, .permissionLevel] | @tsv)' \
    | column -t -s $'\t'
```

Expected entry:

```text
sc-domain:leetllm.com  siteOwner
```

### Top Google Search Pages

```bash
STATS_SERVICE_ACCOUNT="${STATS_SERVICE_ACCOUNT}"
START_DATE=$(date -u -d "28 days ago" +%F)
END_DATE=$(date -u -d "yesterday" +%F)

TOKEN=$(gcloud auth print-access-token \
    --impersonate-service-account="${STATS_SERVICE_ACCOUNT}" \
    --scopes=https://www.googleapis.com/auth/webmasters.readonly 2>/dev/null)

curl -sS \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -X POST "https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Aleetllm.com/searchAnalytics/query" \
    -d "$(jq -n \
      --arg startDate "${START_DATE}" \
      --arg endDate "${END_DATE}" \
      '{startDate: $startDate, endDate: $endDate, dimensions: ["page"], rowLimit: 20}')" \
    | jq -r '(["page","clicks","impressions","ctr","position"] | @tsv), ((.rows // [])[] | [.keys[0], .clicks, .impressions, ((.ctr * 10000 | round) / 100), ((.position * 100 | round) / 100)] | @tsv)' \
    | column -t -s $'\t'
```

### Top Google Search Queries

```bash
STATS_SERVICE_ACCOUNT="${STATS_SERVICE_ACCOUNT}"
START_DATE=$(date -u -d "28 days ago" +%F)
END_DATE=$(date -u -d "yesterday" +%F)

TOKEN=$(gcloud auth print-access-token \
    --impersonate-service-account="${STATS_SERVICE_ACCOUNT}" \
    --scopes=https://www.googleapis.com/auth/webmasters.readonly 2>/dev/null)

curl -sS \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -X POST "https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Aleetllm.com/searchAnalytics/query" \
    -d "$(jq -n \
      --arg startDate "${START_DATE}" \
      --arg endDate "${END_DATE}" \
      '{startDate: $startDate, endDate: $endDate, dimensions: ["query"], rowLimit: 20}')" \
    | jq -r '(["query","clicks","impressions","ctr","position"] | @tsv), ((.rows // [])[] | [.keys[0], .clicks, .impressions, ((.ctr * 10000 | round) / 100), ((.position * 100 | round) / 100)] | @tsv)' \
    | column -t -s $'\t'
```

### Search Console Auth Troubleshooting

```bash
# Required API
gcloud services enable searchconsole.googleapis.com

# Required impersonation grant
gcloud iam service-accounts add-iam-policy-binding \
    ${STATS_SERVICE_ACCOUNT} \
    --member="user:${GCLOUD_ACCOUNT}" \
    --role="roles/iam.serviceAccountTokenCreator"
```

If user-token calls fail with `Invalid scopes value`, use service-account impersonation instead. Search Console requires `https://www.googleapis.com/auth/webmasters.readonly` for read-only data. If impersonation succeeds but `sc-domain:leetllm.com` is missing, add `${STATS_SERVICE_ACCOUNT}` as an owner or full user in Search Console.

## Service Health Checks

```bash
# Service configuration
gcloud run services describe leetllm --region us-central1 \
    --format="yaml(status.address.url,spec.template.spec.containers[0].env)"

# Resource limits
gcloud run services describe leetllm --region us-central1 \
    --format="yaml(spec.template.spec.containers[0].resources)"

# Revision list with traffic
gcloud run revisions list --service=leetllm --region=us-central1
```

## Traffic Routing Issues (Content Not Being Served)

A deployment can succeed (new revision created) but traffic may remain pinned to an older revision. This is the most common cause of "I deployed but don't see my changes."

### Diagnosing

```bash
# Check which revision is actually serving traffic
gcloud run services describe leetllm --region us-central1 \
    --format="yaml(status.traffic)"

# List recent revisions with status
gcloud run revisions list --service=leetllm --region=us-central1
```

If `status.traffic` points to an older revision than the latest in the list, traffic was not migrated or `./deploy.sh` deliberately kept live traffic on the previous revision because candidate route smoke failed.

### Fixing

```bash
# Prefer the validated deploy flow, which deploys a candidate revision with
# no traffic, smokes known Learn/blog routes, migrates traffic, purges
# Cloudflare, then rolls back automatically if production smoke fails.
./deploy.sh

# Manual emergency traffic migration to a known-good revision
gcloud run services update-traffic leetllm \
    --region=us-central1 \
    --to-revisions leetllm-XXXXX=100

# Then purge Cloudflare cache (zone ID from deploy.sh)
source secrets/deploy.env # sets CF_ZONE_ID
source <(grep CLOUDFLARE_CACHE_PURGER web/.env.local)
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
    -H "Authorization: Bearer ${CLOUDFLARE_CACHE_PURGER}" \
    -H "Content-Type: application/json" \
    --data '{"purge_everything":true}'
```

### Common Causes

- **Health check failure:** New revision failed startup probe and Cloud Run kept traffic on the previous healthy revision.
- **Candidate smoke failure:** `./deploy.sh` uses `--no-traffic` intentionally. If known Learn/blog routes fail on the smoke-tag URL, traffic stays on the previous revision.
- **Production smoke rollback:** If production Learn/blog smoke fails after traffic migration, `./deploy.sh` rolls back to the previous revision and purges Cloudflare.
- **Cloudflare caching:** Even after traffic migration, Cloudflare CDN may serve stale HTML. Always purge after fixing.
- **Deployment-static content:** Learn and blog pages are generated into the image. Missing or stale content requires deploying the correct commit; runtime waiting does not regenerate it.

### Verification Checklist

```bash
# 1. Confirm traffic is on latest
gcloud run services describe leetllm --region us-central1 --format="yaml(status.traffic)"

# 2. Hit the direct Cloud Run URL (bypasses Cloudflare)
curl -s https://leetllm-s7h36a3wxa-uc.a.run.app/blog/<slug> | grep "<expected content>"

# 3. Hit production through Cloudflare
curl -sI https://leetllm.com/blog/<slug> | grep -E "cf-cache|x-nextjs"

# 4. Run known content smoke for Learn and blog routes
uv run scripts/validate-live-content-routes.py https://leetllm.com --timeout 30 --retries 3
```

## Alerting Scenarios

### Critical Alerts
- Service returning 500 errors
- Cold starts exceeding 10 seconds
- Out of memory errors

### Warning Alerts
- Response times > 2 seconds
- High error rates (>1%)
- CDN cache issues
- Failed illustration/diagram builds

## Debugging Common Issues

### Dashboard 500 Error

```bash
# Check for missing profile row
gcloud logging read \
    'resource.type="cloud_run_revision"
     AND resource.labels.service_name="leetllm"
     AND textPayload:"profiles"' \
    --limit=10
```

**Fix:** Ensure `profiles` table has row matching `auth.uid()`.

### Content Loading Failures

Cloud Run services do not provide a container `exec` command. Verify the immutable image against the matching release checkout, including its generated assets. This requires Docker and configured Artifact Registry credentials; `deploy.sh` performs the same validation before changing Cloud Run.

```bash
RUNTIME_IMAGE="$(gcloud run services describe leetllm \
    --project ${GCLOUD_PROJECT} \
    --region us-central1 \
    --format='value(spec.template.spec.containers[0].image)')"
(cd web && pnpm runtime-image:validate -- "$RUNTIME_IMAGE")
```

### Cold Start Issues

```bash
# Check instance startup
gcloud logging read \
    'resource.type="cloud_run_revision"
     AND resource.labels.service_name="leetllm"
     AND textPayload:"Starting new instance"' \
    --limit=5
```

### Redirect to :8080

**Symptom:** `www.leetllm.com` redirects to `leetllm.com:8080`

**Root cause:** Next.js middleware uses `request.nextUrl.clone()` - internal port leaks.

**Fix:** See [troubleshooting](./docs/troubleshooting.md), Section 3.1.

## Performance Tuning

### Database
- Monitor Supabase connection limits
- Check RLS policy performance

### Caching
- Cloudflare cache rules (4h TTL for HTML)
- Static assets: immutable caching

### Scaling
Current config: `--cpu-boost --min 0 --min-instances 0 --max-instances 3`. Both service-level and revision-level minimums stay at zero so idle time between requests is not billed under request-based billing; steady origin traffic keeps an instance warm naturally, and startup CPU boost remains enabled for cold starts, replacements, and scale-out.

```bash
# Update scaling
gcloud run services update leetllm --region us-central1 \
    --cpu-boost \
    --min 0 \
    --min-instances 0 \
    --max-instances 3
```

## Console Links

- [Cloud Run Dashboard](https://console.cloud.google.com/run/detail/us-central1/leetllm/logs?project=${GCLOUD_PROJECT})
- [Logs Explorer](https://console.cloud.google.com/logs/query;query=resource.type%3D%22cloud_run_revision%22%20AND%20resource.labels.service_name%3D%22leetllm%22?project=${GCLOUD_PROJECT})

## Detailed Troubleshooting

See [troubleshooting](./docs/troubleshooting.md) for:
- Full error correlation guide
- Local reproduction steps
- SSR error visibility improvements
- DNS/Cloudflare debugging
