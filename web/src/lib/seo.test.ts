import { describe, expect, test } from "vitest"
import sitemap from "@/app/sitemap"
import { metadata as blogAllMetadata } from "@/app/(public)/blog/all/page"
import { generateMetadata as generateBlogMetadata } from "@/app/(public)/blog/[slug]/page"
import { metadata as blogMetadata } from "@/app/(public)/blog/page"
import { metadata as glossaryMetadata } from "@/app/(public)/glossary/page"
import { metadata as learnMetadata } from "@/app/(public)/learn/page"
import { metadata as tracksMetadata } from "@/app/(public)/tracks/page"
import { metadata as startMetadata } from "@/app/(public)/start/page"
import { metadata as loginMetadata } from "@/app/(auth)/login/page"
import { metadata as signupMetadata } from "@/app/(auth)/signup/page"
import { getBlogPosts } from "@/lib/blog"
import { getTracks } from "@/lib/tracks"
import type { Metadata } from "next"

function titleText(title: Metadata["title"]): string {
    if (!title) return ""
    if (typeof title === "string") return title
    if ("absolute" in title && title.absolute) return String(title.absolute)
    if ("default" in title && title.default) return String(title.default)
    return ""
}

describe("SEO metadata", () => {
    test("page titles avoid double LeetLLM suffixes", async () => {
        const publicTitles = [
            titleText(learnMetadata.title),
            titleText(blogMetadata.title),
            titleText(glossaryMetadata.title),
            titleText(blogAllMetadata.title),
            titleText(tracksMetadata.title),
            titleText(startMetadata.title),
        ]

        const firstPost = getBlogPosts()[0]
        const postMetadata = await generateBlogMetadata({
            params: Promise.resolve({ slug: firstPost.slug }),
        })
        publicTitles.push(titleText(postMetadata.title))

        expect(publicTitles).not.toContain("")
        for (const title of publicTitles) {
            expect(title).not.toMatch(/\|\s*LeetLLM\b/)
        }
    })

    test("auth pages are noindex", () => {
        expect(loginMetadata.robots).toMatchObject({ index: false, follow: false })
        expect(signupMetadata.robots).toMatchObject({ index: false, follow: false })
    })

    test("sitemap includes canonical content URLs with lesson freshness hints", () => {
        const entries = sitemap()
        const urls = entries.map((entry) => entry.url)
        const lessonEntries = entries.filter((entry) => entry.url.includes("/learn/"))

        expect(urls).toContain("https://leetllm.com/learn")
        expect(urls).toContain("https://leetllm.com/start")
        expect(urls).toContain("https://leetllm.com/glossary")
        expect(urls).toContain("https://leetllm.com/blog")
        expect(urls).toContain("https://leetllm.com/blog/run-gemma4-local-ollama")
        expect(urls).toContain("https://leetllm.com/blog/run-qwen36-local-unsloth-gguf")
        expect(urls).not.toContain("https://leetllm.com/blog/run-qwen36-local")
        expect(urls).toContain("https://leetllm.com/blog/best-ai-plan-openclaw-2026")
        expect(urls).not.toContain("https://leetllm.com/blog/run-qwen35-local-ollama")
        expect(urls).toContain("https://leetllm.com/tracks")
        for (const track of getTracks()) {
            expect(urls).toContain(`https://leetllm.com/tracks/${track.slug}`)
        }
        expect(urls).not.toContain("https://leetllm.com/login")
        expect(urls).not.toContain("https://leetllm.com/signup")
        expect(lessonEntries.length).toBeGreaterThan(100)
        expect(lessonEntries.every((entry) => entry.lastModified instanceof Date)).toBe(true)
        const lessonLastModifiedDates = lessonEntries.map((entry) => entry.lastModified as Date)
        expect(new Set(lessonLastModifiedDates.map((date) => date.toISOString())).size).toBeGreaterThan(1)
    })
})
