import { join } from "path"
import { NextRequest } from "next/server"
import { afterEach, describe, expect, test, vi } from "vitest"
import { filterContentForAudience, type ContentAudience } from "./content-audience"
import { estimateReadingTime } from "./content-utils"

const slug = "swe-bench-deep-dive"
const postDir = join(process.cwd(), "src", "content", "blog", slug)
const sourceBody = [
    "Shared introduction.",
    "<!-- leetllm: audience:website:start -->",
    "Website discussion.[^hofmann2024Dialect]",
    "<!-- leetllm: audience:website:end -->",
    "<!-- leetllm: audience:book:start -->",
    "Book discussion.[^kusner2017Counterfactual]",
    "Detailed technical explanation. ".repeat(1_000),
    "<!-- leetllm: audience:book:end -->",
].join("\n")

afterEach(() => {
    vi.doUnmock("./content-bundle")
    vi.resetModules()
})

async function mockAudiencePost(metadata: Record<string, unknown> = {}) {
    const original = await vi.importActual<typeof import("./content-bundle")>("./content-bundle")
    const loadContentBundle = vi.fn((directory: string, audience?: ContentAudience) => {
        const bundle = original.loadContentBundle(directory, audience)
        if (!bundle || directory !== postDir) return bundle
        return {
            ...bundle,
            metadata: { ...bundle.metadata, ...metadata },
            sourceBody,
            body: audience ? filterContentForAudience(sourceBody, audience) : sourceBody,
        }
    })
    vi.doMock("./content-bundle", () => ({ ...original, loadContentBundle }))
    return loadContentBundle
}

describe("blog website audience", () => {
    test("filters HTML, Markdown, citations, and reading time before public export", async () => {
        const loadContentBundle = await mockAudiencePost({ visibility: { book: false } })
        const { getBlogPostBySlug, getBlogPosts } = await import("./blog")
        const post = getBlogPostBySlug(slug)!
        expect(loadContentBundle).toHaveBeenCalledWith(postDir, "website")
        expect(post.content).toContain("Website discussion.")
        expect(post.content).not.toContain("Book discussion.")
        expect(Object.keys(post.references)).toEqual(["hofmann2024Dialect"])
        expect(post.timeEstimate).toBe(estimateReadingTime(filterContentForAudience(sourceBody, "website"), "Medium", true))
        expect(getBlogPosts().some(post => post.slug === slug)).toBe(true)

        const { GET } = await import("@/app/api/md/[slug]/route")
        const response = await GET(new NextRequest(`http://localhost/api/md/${slug}`), { params: Promise.resolve({ slug }) })
        expect(response.status).toBe(200)
        const markdown = await response.text()
        expect(markdown).toContain("Website discussion.")
        expect(markdown).not.toContain("Book discussion.")
        expect(markdown).not.toContain("leetllm: audience")
    })

    test("excludes a book-only post from cold routes, warm routes, and all website listings", async () => {
        await mockAudiencePost({ visibility: { website: false, book: true } })
        const { getBlogPostBySlug, getBlogPosts, getAllBlogPostsIncludingPrivate } = await import("./blog")

        expect(getBlogPostBySlug(slug)).toBeUndefined()
        expect(getAllBlogPostsIncludingPrivate().some(post => post.slug === slug)).toBe(false)
        expect(getBlogPosts().some(post => post.slug === slug)).toBe(false)
        expect(getBlogPostBySlug(slug)).toBeUndefined()

        const { GET } = await import("@/app/api/md/[slug]/route")
        const response = await GET(new NextRequest(`http://localhost/api/md/${slug}`), { params: Promise.resolve({ slug }) })
        expect(response.status).toBe(404)
    })
})
