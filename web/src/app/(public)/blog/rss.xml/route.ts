import { getBlogPosts } from "@/lib/blog"

const SITE_URL = "https://leetllm.com"

export const revalidate = false

function escapeXml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;")
}

function formatRssDate(dateString: string): string {
    return new Date(`${dateString}T00:00:00.000Z`).toUTCString()
}

export function GET() {
    const posts = getBlogPosts()
    const latestDate = posts[0]?.updatedAt || posts[0]?.publishedAt || "2026-01-01"

    const items = posts.map((post) => {
        const url = `${SITE_URL}/blog/${post.slug}`
        const date = post.updatedAt || post.publishedAt

        return [
            "    <item>",
            `      <title>${escapeXml(post.title)}</title>`,
            `      <link>${url}</link>`,
            `      <guid isPermaLink="true">${url}</guid>`,
            `      <pubDate>${formatRssDate(date)}</pubDate>`,
            `      <description>${escapeXml(post.excerpt)}</description>`,
            post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`).join("\n"),
            "    </item>",
        ].filter(Boolean).join("\n")
    }).join("\n")

    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
        "  <channel>",
        "    <title>LeetLLM Blog</title>",
        `    <link>${SITE_URL}/blog</link>`,
        "    <description>Practical notes on AI engineering, LLM systems, evaluation, agents, and developer workflows.</description>",
        "    <language>en-us</language>",
        `    <lastBuildDate>${formatRssDate(latestDate)}</lastBuildDate>`,
        `    <atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml" />`,
        items,
        "  </channel>",
        "</rss>",
        "",
    ].join("\n")

    return new Response(xml, {
        headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400, max-age=0",
        },
    })
}
