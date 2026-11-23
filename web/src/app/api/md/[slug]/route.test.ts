import { NextRequest } from "next/server"
import { expect, test } from "vitest"
import { getAllBlogPostsIncludingPrivate } from "@/lib/blog"
import { GET } from "./route"

async function getMarkdown(slug: string) {
    return GET(
        new NextRequest(`http://localhost/api/md/${slug}`, {
            headers: { "Accept-Encoding": "identity" },
        }),
        { params: Promise.resolve({ slug }) },
    )
}

test("private blog markdown disables indexing and shared caching", async () => {
    const post = getAllBlogPostsIncludingPrivate().find((candidate) => candidate.private)

    expect(post).toBeTruthy()

    const response = await GET(
        new NextRequest(`http://localhost/api/md/${post!.slug}`, {
            headers: { "Accept-Encoding": "identity" },
        }),
        { params: Promise.resolve({ slug: post!.slug }) }
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("Cache-Control")).toBe("private, no-store")
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow, noarchive")
})

test("serves glossary source markdown for LLM paste", async () => {
    const response = await getMarkdown("ti-to")
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8")
    expect(body).toContain("# TI/TO")
    expect(body).toContain("| Type | Glossary |")
    expect(body).toContain("https://leetllm.com/glossary#ti-to")
    expect(body).toContain("the token IDs the learner trains on")
    expect(body).toContain("Decoded text can hide tokenizer differences.")
    expect(body).toContain("](https://leetllm.com/glossary#loss-mask)")
    expect(body).not.toContain("glossary://")
})

test("rejects unknown and unsafe markdown slugs", async () => {
    const missing = await getMarkdown("not-a-real-markdown-slug")
    const traversal = await getMarkdown("../package")

    expect(missing.status).toBe(404)
    expect(traversal.status).toBe(404)
    expect(await missing.text()).toContain("glossary entry")
})
