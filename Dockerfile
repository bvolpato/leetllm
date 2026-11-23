ARG NODE_IMAGE=node:22-alpine

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
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=next-cache /next-cache/ ./.next/cache/
COPY web/ .
# Note: illustrations and diagrams are pre-rendered by deploy.sh before the
# Docker build. The _generated/ PNG, GIF, and MP4 assets are served at runtime via
# /cdn/content-image/ and need to be present in the production image.
RUN pnpm build

# Collect runtime content into a lean directory for production image.
# Runtime content APIs and personalized visual rendering need markdown,
# references, illustration sources, and generated assets after build.
RUN mkdir -p /runtime-content && \
    cd src/content && \
    find . \( \
      -name 'references.json' -o \
      -name 'metadata.json' -o \
      -name 'content.md' -o \
      -name 'content-free.md' -o \
      -name 'social_banner.png' -o \
      -path './glossary/*.md' -o \
      -name '*.tsx' -o \
      -path '*/illustrations/*.ts' -o \
      -path '*/illustrations/*.json' -o \
      -path '*/illustrations/_generated/*' -o \
      -path '*/diagrams/_generated/*' -o \
      -path '*/assets/*' \
    \) -type f -exec sh -c \
      'mkdir -p "/runtime-content/$(dirname "$1")" && cp "$1" "/runtime-content/$1"' \
      _ {} \;

# Keep raw glossary routes and all relative content dependencies complete.
RUN pnpm exec tsx scripts/validate-runtime-content.ts /runtime-content

# Next.js tracing also copies src/content into the standalone tree. Keep the
# curated runtime copy below, but remove the traced duplicate before the final
# image layers are assembled.
RUN rm -rf /app/.next/standalone/src/content

FROM scratch AS next-cache-export
COPY --from=builder /app/.next/cache/ /next-cache/

# ── Stage 3: Production image ────────────────────────────────
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV NODE_OPTIONS="--max-old-space-size=768"
ENV NODE_COMPILE_CACHE=/app/.node-compile-cache
ENV VIZMATIC_DISABLE_NETWORK=1
ENV VIZMATIC_FONT_DIR=/tmp/vizmatic-fonts

# Practice code execution runs in the separate zero-secret `leetllm-sandbox`
# Cloud Run service, so this runtime image intentionally omits Python and JDK.
RUN npm install --global @openai/codex@0.156.1 \
      --before="$(node -e 'process.stdout.write(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())')" && \
    npm cache clean --force

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN mkdir -p /app/.node-compile-cache && chown nextjs:nodejs /app/.node-compile-cache

# Copy standalone output with runtime ownership.
COPY --chown=nextjs:nodejs --from=builder /app/.next/standalone ./
COPY --chown=nextjs:nodejs --from=builder /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs --from=builder /app/public ./public

# Copy runtime-served content files for /cdn/content-image and /api/content-asset
COPY --chown=nextjs:nodejs --from=builder /runtime-content ./src/content
COPY --chown=nextjs:nodejs --from=builder /app/scripts/prewarm-node-cache.mjs ./scripts/prewarm-node-cache.mjs

USER nextjs

# Generate the cache with the production Node binary, absolute paths, and UID.
# This work happens once while building the image, before an instance starts.
RUN node scripts/prewarm-node-cache.mjs

EXPOSE 8080

CMD ["node", "server.js"]
