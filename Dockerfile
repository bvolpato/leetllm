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
RUN node -e ' \
  const fs = require("fs"); \
  const path = require("path"); \
  const src = path.resolve("src/content"); \
  const dst = "/runtime-content"; \
  const keep = (rel) => { \
    const name = path.basename(rel); \
    if (rel.includes("/__pycache__/") || name.endsWith(".pyc")) return false; \
    return name === "references.json" \
      || name === "metadata.json" \
      || name === "content.md" \
      || name === "content-free.md" \
      || name === "social_banner.png" \
      || (rel.startsWith("glossary/") && rel.endsWith(".md")) \
      || name.endsWith(".tsx") \
      || (rel.includes("/illustrations/") && (name.endsWith(".ts") || name.endsWith(".json"))) \
      || rel.includes("/illustrations/_generated/") \
      || rel.includes("/diagrams/_generated/") \
      || rel.includes("/assets/"); \
  }; \
  const walk = (dir) => { \
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { \
      const full = path.join(dir, entry.name); \
      if (entry.isDirectory()) { walk(full); continue; } \
      if (!entry.isFile()) continue; \
      const rel = path.relative(src, full).split(path.sep).join("/"); \
      if (!keep(rel)) continue; \
      const target = path.join(dst, rel); \
      fs.mkdirSync(path.dirname(target), { recursive: true }); \
      fs.copyFileSync(full, target); \
    } \
  }; \
  fs.mkdirSync(dst, { recursive: true }); \
  walk(src); \
'

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
# Prune headless-unused Codex sub-binaries (voice/GStreamer, zsh, code-mode-host,
# rg, bwrap) and package managers (npm/yarn/corepack) in the same layer to shrink
# the runtime image and tighten the container attack surface.
RUN npm install --global @openai/codex@0.156.1 \
      --before="$(node -e 'process.stdout.write(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())')" && \
    npm cache clean --force && \
    CODEX_VENDOR="/usr/local/lib/node_modules/@openai/codex/node_modules/@openai/codex-linux-x64/vendor/x86_64-unknown-linux-musl" && \
    rm -rf \
      "${CODEX_VENDOR}/codex-resources/voice" \
      "${CODEX_VENDOR}/codex-resources/zsh" \
      "${CODEX_VENDOR}/codex-resources/bwrap" \
      "${CODEX_VENDOR}/codex-path" \
      "${CODEX_VENDOR}/bin/codex-code-mode-host" \
      /usr/local/lib/node_modules/npm \
      /usr/local/lib/node_modules/corepack \
      /opt/yarn-* \
      /usr/local/bin/npm \
      /usr/local/bin/npx \
      /usr/local/bin/yarn \
      /usr/local/bin/yarnpkg \
      /usr/local/bin/corepack && \
    codex --version && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/.node-compile-cache && \
    chown nextjs:nodejs /app/.node-compile-cache

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
