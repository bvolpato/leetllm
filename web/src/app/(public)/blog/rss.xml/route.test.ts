import { describe, expect, test } from "vitest"
import { getBlogPosts } from "@/lib/blog"
import { GET } from "./route"

describe("blog RSS feed", () => {
    test("renders public blog posts only", async () => {
        const response = GET()
        const xml = await response.text()
        const posts = getBlogPosts()

        expect(response.headers.get("Content-Type")).toContain("application/rss+xml")
        expect(xml).toContain("<title>LeetLLM Blog</title>")
        expect(xml).toContain('<atom:link href="https://leetllm.com/blog/rss.xml" rel="self" type="application/rss+xml" />')

        for (const post of posts) {
            expect(xml).toContain(`<guid isPermaLink="true">https://leetllm.com/blog/${post.slug}</guid>`)
        }

        expect(xml).not.toContain("run-qwen35-local-ollama")
        expect(xml).not.toContain("glm-52-training-masterclass")
        expect(xml).not.toContain("glm-53-training-masterclass")
        expect(xml).not.toContain("context-engineering-beyond-prompt-engineering")
        expect(xml).toContain("best-ai-coding-plans-2026")
        expect(xml).toContain("ai-coding-assistants-2026-comparison")
    })
})
