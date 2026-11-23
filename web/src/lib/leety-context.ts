import "server-only"

import { getBlogPostBySlug } from "@/lib/blog"
import { getQuestionBySlug } from "@/lib/questions"

const SAFE_SLUG = /^[a-z0-9][a-z0-9-]{0,159}$/

export interface LeetyPageContext {
    kind: "lesson" | "blog"
    slug: string
    title: string
    canonicalPath: string
    markdown: string
    allowAnonymous: boolean
}

function parseContentPath(pathname: string) {
    if (pathname.length > 300 || !pathname.startsWith("/") || pathname.includes("\0")) return null

    let decoded: string
    try {
        decoded = decodeURIComponent(pathname)
    } catch {
        return null
    }

    const segments = decoded.replace(/\/+$/, "").split("/").filter(Boolean)
    if (segments.length !== 2 || !SAFE_SLUG.test(segments[1])) return null
    if (segments[0] !== "learn" && segments[0] !== "blog") return null
    return { kind: segments[0] as "learn" | "blog", slug: segments[1] }
}

export function getLeetyPageContext(pathname: unknown): LeetyPageContext | null {
    if (typeof pathname !== "string") return null
    const parsed = parseContentPath(pathname)
    if (!parsed) return null

    if (parsed.kind === "learn") {
        const lesson = getQuestionBySlug(parsed.slug)
        if (!lesson) return null
        return {
            kind: "lesson",
            slug: lesson.slug,
            title: lesson.title,
            canonicalPath: `/learn/${lesson.slug}`,
            markdown: `# ${lesson.title}\n\n${lesson.content}`,
            allowAnonymous: lesson.hidden === true,
        }
    }

    const post = getBlogPostBySlug(parsed.slug)
    if (!post) return null
    return {
        kind: "blog",
        slug: post.slug,
        title: post.title,
        canonicalPath: `/blog/${post.slug}`,
        markdown: `# ${post.title}\n\n${post.content}`,
        allowAnonymous: post.private === true,
    }
}
