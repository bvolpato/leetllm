import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { NextRequest } from "next/server"
import { getQuestionForUser } from "@/lib/questions"
import { getBlogPostBySlug } from "@/lib/blog"
import { formatReadingTime } from "@/lib/content-utils"
import { hasGlossaryRoute } from "@/lib/content-route-index"
import { compressedResponse } from "@/lib/response-compression"

const GLOSSARY_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Serves raw markdown content for articles, blog posts, and glossary entries.
 *
 * URL format:
 *   /api/md/{slug}         — serves article, blog, or glossary markdown
 *
 * Response: plain text (text/markdown) with the raw content.md,
 * prepended with a YAML-like header showing title, section, etc.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params
    // Strip .md extension if present (e.g., "attention-mechanism.md" → "attention-mechanism")
    const cleanSlug = slug.replace(/\.md$/, "")

    void request

    // ── Try articles first ──────────────────────────────────────────
    const question = getQuestionForUser(cleanSlug, false)

    if (question) {
        const header = buildArticleHeader(question)
        const body = `${header}\n${question.content}\n`

        return compressedResponse(request, body, {
            status: 200,
            headers: {
                "Content-Type": "text/markdown; charset=utf-8",
                "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
            },
        })
    }

    // ── Try blog posts ──────────────────────────────────────────────
    const post = getBlogPostBySlug(cleanSlug)

    if (post) {
        const header = buildBlogHeader(post)
        const body = `${header}\n${post.content}\n`

        return compressedResponse(request, body, {
            status: 200,
            headers: {
                "Content-Type": "text/markdown; charset=utf-8",
                "Cache-Control": post.private
                    ? "private, no-store"
                    : "public, s-maxage=3600, stale-while-revalidate=600",
                ...(post.private ? { "X-Robots-Tag": "noindex, nofollow, noarchive" } : {}),
            },
        })
    }

    const glossary = process.env.NODE_ENV === "development" || hasGlossaryRoute(cleanSlug)
        ? readGlossaryMarkdown(cleanSlug)
        : null
    if (glossary) {
        return compressedResponse(request, glossary, {
            status: 200,
            headers: {
                "Content-Type": "text/markdown; charset=utf-8",
                "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
            },
        })
    }

    // ── Not found ───────────────────────────────────────────────────
    return compressedResponse(request, "# Not Found\n\nNo article, blog post, or glossary entry found with that slug.\n", {
        status: 404,
        headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Cache-Control": "private, no-store",
        },
    })
}

// ═══════════════════════════════════════════════════════════════
//  HEADER BUILDERS
// ═══════════════════════════════════════════════════════════════

function buildArticleHeader(question: {
    title: string
    section: string
    category: string
    difficulty: string
    timeEstimate: number
    shortDescription: string
    slug: string
}) {
    return [
        `# ${question.title}`,
        "",
        `> ${question.shortDescription}`,
        "",
        `| Field | Value |`,
        `|-------|-------|`,
        `| Section | ${question.section} |`,
        `| Category | ${question.category} |`,
        `| Difficulty | ${question.difficulty} |`,
        `| Reading time | ${formatReadingTime(question.timeEstimate)} |`,
        `| URL | https://leetllm.com/learn/${question.slug} |`,
        "",
        "---",
        "",
    ].join("\n")
}

function buildBlogHeader(post: {
    title: string
    excerpt: string
    publishedAt: string
    timeEstimate: number
    tags: string[]
    author: { name: string }
    slug: string
}) {
    return [
        `# ${post.title}`,
        "",
        `> ${post.excerpt}`,
        "",
        `| Field | Value |`,
        `|-------|-------|`,
        `| Author | ${post.author.name} |`,
        `| Published | ${post.publishedAt} |`,
        `| Tags | ${post.tags.join(", ")} |`,
        `| Reading time | ${formatReadingTime(post.timeEstimate)} |`,
        `| URL | https://leetllm.com/blog/${post.slug} |`,
        "",
        "---",
        "",
    ].join("\n")
}

function rewriteGlossaryLinks(markdown: string) {
    return markdown.replace(
        /\]\(glossary:(?:\/\/)?([a-z0-9-]+)\)/g,
        "](https://leetllm.com/glossary#$1)",
    )
}

function parseGlossarySource(raw: string) {
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
    if (!match) {
        return { title: "", aliases: "", body: raw.trim() }
    }

    const metadata: Record<string, string> = {}
    for (const line of match[1].split("\n")) {
        const separator = line.indexOf(":")
        if (separator === -1) continue
        metadata[line.slice(0, separator).trim()] = line.slice(separator + 1).trim()
    }

    let aliases = ""
    if (metadata.aliases) {
        try {
            const parsed = JSON.parse(metadata.aliases) as unknown
            aliases = Array.isArray(parsed)
                ? parsed.filter((alias): alias is string => typeof alias === "string").join(", ")
                : metadata.aliases
        } catch {
            aliases = metadata.aliases
        }
    }

    return {
        title: metadata.title?.replace(/^["']|["']$/g, "") ?? "",
        aliases,
        body: raw.slice(match[0].length).trim(),
    }
}

function readGlossaryMarkdown(id: string) {
    if (!GLOSSARY_ID_RE.test(id)) return null

    const glossaryDir = join(process.cwd(), "src", "content", "glossary")
    const filePath = join(glossaryDir, `${id}.md`)
    if (!filePath.startsWith(`${glossaryDir}/`) || !existsSync(filePath)) return null

    const parsed = parseGlossarySource(readFileSync(filePath, "utf8"))
    const title = parsed.title || id
    const rows = [
        `| Field | Value |`,
        `|-------|-------|`,
        `| Type | Glossary |`,
    ]
    if (parsed.aliases) {
        rows.push(`| Also known as | ${parsed.aliases} |`)
    }
    rows.push(`| URL | https://leetllm.com/glossary#${id} |`)

    return [
        `# ${title}`,
        "",
        ...rows,
        "",
        "---",
        "",
        rewriteGlossaryLinks(parsed.body),
        "",
    ].join("\n")
}
