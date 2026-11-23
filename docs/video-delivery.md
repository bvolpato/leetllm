# Lesson video delivery

Lesson recordings live in the `leetllm-videos` Cloudflare R2 bucket and are served
at `https://videos.leetllm.com`. The Learn list and article toolbar use
`web/src/generated/lesson-videos.json` to show recordings that have been uploaded
and verified. Each entry uses the canonical article slug, which can differ from
the video lesson ID.

The popup uses the browser's video controls. Opening it loads the recording;
closing it stops playback and releases the source. English captions are available
as a separate WebVTT track and start disabled. Video files travel directly from
Cloudflare to the browser. Cloud Run serves the application and the small
availability manifest.

When a published recording teaches an example that an article has replaced,
record its canonical slug, exact movie SHA-256, and reason in
`web/src/lib/withheld-lesson-videos.json`. The reader hides the watch button for
those exact bytes. The media and complete publication manifest stay intact, and
republishing the same recording does not make it visible again. An accepted
replacement with a different movie hash becomes available through the normal
publication flow. Review and remove obsolete withdrawal records when that
replacement is delivered.

## Publish recordings

Use Node.js 22 or newer. The publisher uses the Cloudflare REST API, with no S3
client or additional package installation. Set `CLOUDFLARE_API_TOKEN` in the
process environment, or pass an ignored environment file containing that key.
The existing deploy key name `CLOUDFLARE_CACHE_PURGER` is also accepted from an
explicit environment file. Keep these credentials out of the web manifest and
the Cloud Run runtime environment.

The token needs access to R2 objects and bucket configuration. Initial setup also
needs permission to attach a custom domain in the LeetLLM zone and manage its
cache rules. Public account, bucket, zone and domain settings are in
`videos/r2.config.json`.

```bash
# Run once, or reconcile the bucket/domain/cache settings later.
node videos/publish-r2.mjs setup --env-file web/.env.local

# Inspect the exact files and URLs before uploading.
node videos/publish-r2.mjs plan \
  --selection build/video-delivery/selection.json \
  --output build/r2-publication/preflight

# Upload and verify, then atomically update article availability.
node videos/publish-r2.mjs publish \
  --selection build/video-delivery/selection.json \
  --output build/r2-publication/upload \
  --env-file web/.env.local \
  --web-manifest web/src/generated/lesson-videos.json

# Recheck public delivery without credentials or uploads.
node videos/publish-r2.mjs verify \
  --selection build/video-delivery/selection.json \
  --output build/r2-publication/public-check
```

The selection format matches `assemble-delivery.mjs` output. Its `lessons` array
contains `id`, `sourceDirectory`, `sourceFingerprint`, and the exact
`movieSha256` for each recording.
An optional `posterPath` selects an image from that export. Local paths resolve
from the repository root. Subsets work for plans, pilots and public checks.
Updating `--web-manifest` requires the complete canonical collection, preventing
a partial batch from removing other recordings from the site.

To release a verified completed subset while other replacements are unfinished,
opt into merging with the existing complete public manifest:

```bash
node videos/publish-r2.mjs plan \
  --selection build/video-delivery/completed-subset.json \
  --output build/r2-publication/completed-subset \
  --merge-existing-manifest web/src/generated/lesson-videos.json

node videos/publish-r2.mjs publish \
  --selection build/video-delivery/completed-subset.json \
  --output build/r2-publication/completed-subset \
  --env-file web/.env.local \
  --merge-existing-manifest web/src/generated/lesson-videos.json \
  --web-manifest web/src/generated/lesson-videos.json
```

This option validates that the existing manifest covers every canonical lesson
exactly once and uses immutable asset URLs. It preserves the unselected entries
and verifies every new selected asset before replacing the selected entries.
The output retains the exact prior manifest and its hash. Both manifest options
must name the same file, and the update refuses observed changes to that file
during publication. Without this explicit option, the complete-selection guard
remains required. Retained recordings keep their original identities and review
scope; the merge creates no editorial decision, score or current-source claim.

Each export needs a successful decode and geometry receipt, its MP4, and its
WebVTT file. The publisher checks every selected file against the receipt before
uploading. Its source fingerprint and article must match the selected recording
and canonical article. Captions and optional posters have their own hashes. The plan and
verification reports remain in the ignored build directory.

Use the same output directory to resume an interrupted upload. Matching local
verification receipts skip repeated uploads; every public asset is downloaded
and checked again before the web manifest changes. Transient Cloudflare API
failures have bounded retries. Other failures preserve the previous manifest.
Use a separate output directory when changing the target bucket or domain.

For a slow link, resume the same `publish` command and output directory with
`--concurrency 2 --upload-timeout-ms 600000`. Concurrency defaults to four workers
and accepts integers from one to eight. The upload timeout defaults to 180,000 ms
and accepts integers from 1,000 to 900,000 ms. It applies only to each Cloudflare
object upload request. The existing bounded retry policy allows at most three
attempts, so a 600,000 ms setting can take about 30 minutes plus retry delays for
one failed upload. Public hash, CORS, range and cache verification keep their
existing deadlines and checks. Failure messages identify the asset key and
whether upload or public verification failed. They never include credentials.

Publication verifies delivery. Editorial decisions and the ongoing visual
reviews remain in the review gallery. Uploading a recording leaves its review
score and recommendation unchanged.

## Cache and playback contract

Object keys include the lesson ID and the complete SHA-256 of each asset:

```text
lessons/convolution/<movie-sha256>.mp4
lessons/convolution/<captions-sha256>.vtt
lessons/convolution/<poster-sha256>.png
```

Files use `Cache-Control: public, max-age=31536000, immutable`. Revised bytes get
a new URL; a website deployment selects that URL through the committed manifest.
Old recordings remain available at their original URLs. The publisher does not
delete previous assets.

The host-scoped cache rule covers only `/lessons/` on `videos.leetllm.com` and
preserves the website's other cache rules. Read-only CORS permits public playback
and caption loading. Setup does not enable an `r2.dev` development URL. A newly
attached domain can take time to activate; inspect the setup response and retry
publication after activation if the pilot receives a temporary 403.

Website deployment purges only `leetllm.com` and `www.leetllm.com`. It preserves
the separate immutable video cache on `videos.leetllm.com`.

Before writing the availability manifest, the publisher downloads and hashes
every public asset, checks its MIME type, size, cache and CORS headers, and
compares three actual byte ranges for each MP4, including their CORS and content
headers. This checks seeking as well as whole-file delivery. A warmed GET range
must return a cache hit. HEAD validates metadata separately: R2 can serve HEAD
directly even when the corresponding GET is cached. Per-asset reports record
both observed cache statuses. Cache
retention still depends on Cloudflare eviction and traffic patterns.

The current REST uploader limits each asset to 300 MiB. Larger future recordings
need a multipart uploader or segmented delivery. This is a tool limit, separate
from [Cloudflare's cache limits](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/#cacheable-size-limits).

After publication, run the web validation gates in `AGENTS_TESTING.md` and deploy
the application. Verify playback, seeking, caption selection, keyboard dismissal,
mobile layout, and the absence of media requests before opening the popup on the
deployed site. Commit the publisher, configuration and web manifest; keep MP4s,
posters, captions and local verification reports outside Git.

R2 charges for storage and operations, with free internet egress. Account-wide
free allowances can reduce the bill. Refer to the current
[R2 pricing](https://developers.cloudflare.com/r2/pricing/) and
[public bucket documentation](https://developers.cloudflare.com/r2/buckets/public-buckets/).
