ARG NODE_IMAGE=node:22-alpine
ARG NEXT_PUBLIC_CONTENT_ASSETS_ORIGIN=https://assets.leetllm.com

# ── Stage 1: Install dependencies ────────────────────────────
FROM ${NODE_IMAGE} AS deps
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app
COPY web/package.json web/pnpm-lock.yaml web/pnpm-workspace.yaml ./
COPY web/patches ./patches
RUN mkdir -p /next-cache && pnpm install --frozen-lockfile

# Cloud Build overrides this empty context with a pinned compiler-cache image.
FROM scratch AS next-cache
COPY --from=deps /next-cache/ /next-cache/

# ── Stage 2: Build the application ───────────────────────────
FROM ${NODE_IMAGE} AS builder
ARG NEXT_PUBLIC_CONTENT_ASSETS_ORIGIN=https://assets.leetllm.com
ENV NEXT_PUBLIC_CONTENT_ASSETS_ORIGIN=${NEXT_PUBLIC_CONTENT_ASSETS_ORIGIN}
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=next-cache /next-cache/ ./.next/cache/
COPY web/ .
# Illustrations and diagrams are pre-rendered and synced to Cloudflare R2
# (assets.leetllm.com) by deploy.sh before the Docker build. prebuild hashes
# them into src/generated/content-image-manifest.json so public media URLs
# point directly at the CDN while private/draft media stay on container disk.
RUN pnpm build

# Collect curated runtime content and verify its deterministic manifest.
# Public binary media (.png/.gif/.mp4/.vtt) are served from R2 CDN and omitted
# here; markdown, references, illustration sources, _generated/*.json manifests,
# /assets/ downloads, and private blog media remain in /runtime-content.
RUN pnpm exec tsx scripts/validate-runtime-content.ts --collect /runtime-content

# Next.js tracing also copies src/content into the standalone tree. Keep the
# curated runtime copy below, but remove the traced duplicate before the final
# image layers are assembled.
RUN rm -rf /app/.next/standalone/src/content

FROM scratch AS next-cache-export
COPY --from=builder /app/.next/cache/ /next-cache/

# ── Stage 3: Production image ────────────────────────────────
FROM ${NODE_IMAGE} AS runner
ARG NEXT_PUBLIC_CONTENT_ASSETS_ORIGIN=https://assets.leetllm.com
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV NODE_OPTIONS="--max-old-space-size=768"
ENV VIZMATIC_DISABLE_NETWORK=1
ENV VIZMATIC_FONT_DIR=/tmp/vizmatic-fonts
ENV NEXT_PUBLIC_CONTENT_ASSETS_ORIGIN=${NEXT_PUBLIC_CONTENT_ASSETS_ORIGIN}

# Practice execution runs in `leetllm-sandbox` and Codex CLI runs in the
# isolated IAM-only `leetllm-codex` Cloud Run service, so this runtime image
# omits Python, JDK, and @openai/codex. Prune unused package managers
# (npm/yarn/corepack) in the same layer to shrink the image and attack surface.
RUN rm -rf \
      /usr/local/lib/node_modules/npm \
      /usr/local/lib/node_modules/corepack \
      /opt/yarn-* \
      /usr/local/bin/npm \
      /usr/local/bin/npx \
      /usr/local/bin/yarn \
      /usr/local/bin/yarnpkg \
      /usr/local/bin/corepack && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/.node-compile-cache && \
    chown nextjs:nodejs /app/.node-compile-cache

# Copy standalone output with runtime ownership.
COPY --chown=nextjs:nodejs --from=builder /app/.next/standalone ./
COPY --chown=nextjs:nodejs --from=builder /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs --from=builder /app/public ./public

# Copy lean runtime-served content files and prebuilt manifests for /cdn/content-image, /api/md, and /api/glossary
COPY --chown=nextjs:nodejs --from=builder /runtime-content ./src/content
COPY --chown=nextjs:nodejs --from=builder /app/src/generated/content-image-manifest.json ./src/generated/content-image-manifest.json
COPY --chown=nextjs:nodejs --from=builder /app/src/generated/glossary-data.json ./src/generated/glossary-data.json
COPY --chown=nextjs:nodejs --from=builder /app/scripts/prewarm-node-cache.mjs ./scripts/prewarm-node-cache.mjs

ENV NODE_COMPILE_CACHE=/app/.node-compile-cache
USER nextjs

# Generate the cache with the production Node binary, absolute paths, and UID.
# This work happens once while building the image, before an instance starts.
RUN node scripts/prewarm-node-cache.mjs

EXPOSE 8080

CMD ["node", "server.js"]
