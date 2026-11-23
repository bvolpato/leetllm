/** @type {import("next").NextConfig} */
const nextConfig = {
  /* config options here */
  // Keep origin compression explicit. Deployment smoke verifies gzip
  // negotiation through both Cloud Run and Cloudflare.
  compress: true,
  reactCompiler: true,
  experimental: {
    // Load route modules on demand to keep startup work off the first request.
    preloadEntriesOnStart: false,
  },
  output: "standalone",
  serverExternalPackages: ["vizmatic", "@resvg/resvg-js", "sharp"],
  outputFileTracingIncludes: {
    "/api/personalization/render-vizmatic": ["./node_modules/vizmatic/assets/**/*"],
  },
  outputFileTracingExcludes: {
    "/api/personalization/lesson": ["./secrets/**/*"],
    "/api/personalization/profile": ["./secrets/**/*"],
  },
  images: {
    localPatterns: [
      { pathname: "/cdn/content-image/**" },
      { pathname: "/api/content-image/**" },
    ],
  },

  // Public keys — safe to inline. Ensures they're available at Docker build
  // time even when .env.local is not in the Cloud Build context.
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      "https://ofszhffsiduopulardkg.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      "sb_publishable_V3ypGIDT6S2k5jIuCyQ3Ww_kLLLfAEj",
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL || "https://leetllm.com",
  },

  // ── URL Rewrites ────────────────────────────────────────────────
  // Route /learn/slug.md and /blog/slug.md to the raw markdown API.
  // Query params (e.g. ?1337) are forwarded automatically.
  async rewrites() {
    return [
      {
        source: "/learn/:slug(.*)\\.md",
        destination: "/api/md/:slug",
      },
      {
        source: "/blog/:slug(.*)\\.md",
        destination: "/api/md/:slug",
      },
    ];
  },

  // ── Cache-Control headers ──────────────────────────────────────
  // CDN (Cloudflare) + browser caching for public pages.
  // s-maxage  = how long CDN serves stale without revalidating
  // stale-while-revalidate = CDN serves stale while fetching fresh in background
  // max-age   = browser cache (short, to reflect auth changes quickly)
  async headers() {
    return [
      {
        // Route handlers return pre-compressed variants when gzip is accepted.
        source: "/api/md/:path*",
        headers: [{ key: "Vary", value: "Accept-Encoding" }],
      },
      {
        source: "/api/content-asset/:path*",
        headers: [{ key: "Vary", value: "Accept-Encoding" }],
      },
      {
        // Homepage
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=14400, stale-while-revalidate=3600, max-age=0",
          },
        ],
      },
      {
        // Blog listing + individual posts
        source: "/blog/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=14400, stale-while-revalidate=3600, max-age=0",
          },
        ],
      },
      {
        // Learn listing
        source: "/learn",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=14400, stale-while-revalidate=3600, max-age=0",
          },
        ],
      },
      {
        // Learn articles
        source: "/learn/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=14400, stale-while-revalidate=3600, max-age=0",
          },
        ],
      },
      {
        // Practice listing + coding problems
        source: "/practice/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=14400, stale-while-revalidate=3600, max-age=0",
          },
        ],
      },
      {
        // Legal / static pages
        source: "/(terms|privacy)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=86400, stale-while-revalidate=3600, max-age=0",
          },
        ],
      },
      {
        // Search crawler entrypoints. Keep CDN-cached, but revalidate often.
        source: "/sitemap.xml",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400, max-age=0",
          },
        ],
      },
      {
        source: "/robots.txt",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400, max-age=0",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
