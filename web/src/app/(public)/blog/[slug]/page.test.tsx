import { render, screen } from "@testing-library/react"
import { expect, test, vi } from "vitest"
import { getAllBlogPostsIncludingPrivate, getBlogPosts } from "@/lib/blog"
import BlogPostPage, {
    dynamicParams,
    generateMetadata,
    generateStaticParams,
    revalidate,
} from "./page"

vi.mock("@/components/server-markdown-renderer", () => ({
    ServerMarkdownRenderer: () => <div data-testid="markdown-body" />,
}))

test("blog article route uses ISR and supports slugs missing from prerender manifest", () => {
    expect(revalidate).toBe(false)
    expect(dynamicParams).toBe(true)
})

test("private blog posts stay out of prerender manifest", async () => {
    const privatePosts = getAllBlogPostsIncludingPrivate().filter((post) => post.private)
    const staticSlugs = new Set((await generateStaticParams()).map(({ slug }) => slug))

    expect(privatePosts.length).toBeGreaterThan(0)
    for (const post of privatePosts) {
        expect(staticSlugs.has(post.slug)).toBe(false)
    }
})

test("private blog metadata disables indexing and social previews", async () => {
    const current = getAllBlogPostsIncludingPrivate().find((post) => post.private)

    expect(current).toBeTruthy()

    const metadata = await generateMetadata({
        params: Promise.resolve({ slug: current!.slug }),
    })

    expect(metadata.robots).toMatchObject({ index: false, follow: false, nocache: true })
    expect(metadata.openGraph).toBeNull()
    expect(metadata.twitter).toBeNull()
    expect(metadata.alternates).toEqual({ canonical: null })
})

test("private blog page removes discovery labels and sharing controls", async () => {
    const current = getAllBlogPostsIncludingPrivate().find((post) => post.private)

    expect(current).toBeTruthy()

    const page = await BlogPostPage({
        params: Promise.resolve({ slug: current!.slug }),
    })
    const { container } = render(page)

    expect(screen.queryByText("Unlisted private study note")).toBeNull()
    expect(screen.getByRole("button", { name: "Print / Save PDF" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "Copy as markdown" })).toBeTruthy()
    expect(screen.queryByText("Share this article")).toBeNull()
    expect(container.querySelector('script[type="application/ld+json"]')).toBeNull()
    expect(container.querySelector('a[href="/blog"]')).toBeNull()
    expect(container.querySelector('article[data-reader-article][itemtype="https://schema.org/Article"]')).toBeTruthy()
    expect(container.querySelector('h1[itemprop="headline"]')?.textContent).toBe(current!.title)
    expect(container.querySelector('[itemprop="articleBody"]')).toBeTruthy()
})

test("blog article metadata rejects unknown slugs before streaming", async () => {
    await expect(generateMetadata({
        params: Promise.resolve({ slug: "not-a-real-blog-slug" }),
    })).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404")
})

test("blog article metadata uses social image when present", async () => {
    const current = getBlogPosts().find((post) =>
        post.socialImage?.includes("/social_banner.png")
    )

    expect(current).toBeTruthy()

    const metadata = await generateMetadata({
        params: Promise.resolve({ slug: current!.slug }),
    })
    const images = metadata.openGraph?.images

    expect(JSON.stringify(images)).toContain("/social_banner.png")
})

test("blog article footer shows previous and next before share controls", async () => {
    const posts = getBlogPosts()
    const currentIndex = Math.min(1, posts.length - 1)
    const current = posts[currentIndex]
    const previous = currentIndex > 0 ? posts[currentIndex - 1] : null
    const next = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null

    expect(current).toBeTruthy()

    const page = await BlogPostPage({
        params: Promise.resolve({ slug: current.slug }),
    })
    const { container } = render(page)

    const share = screen.getByText("Share this article")
    const adjacentLinks = [
        previous ? container.querySelector(`a[href="/blog/${previous.slug}"]`) : null,
        next ? container.querySelector(`a[href="/blog/${next.slug}"]`) : null,
    ].filter(Boolean)

    expect(adjacentLinks.length).toBeGreaterThan(0)
    for (const link of adjacentLinks) {
        expect(
            link!.compareDocumentPosition(share) &
                Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy()
    }
})

test("blog article keeps social banner out of rendered body", async () => {
    const current = getBlogPosts().find((post) =>
        post.socialImage?.includes("/social_banner.png")
    )

    expect(current).toBeTruthy()

    const page = await BlogPostPage({
        params: Promise.resolve({ slug: current!.slug }),
    })
    const { container } = render(page)
    const heroImage = [...container.querySelectorAll("img")]
        .find((img) => img.getAttribute("src")?.includes("social_banner.png"))

    expect(heroImage).toBeUndefined()
})

test("blog article keeps author-placed figures in markdown body", () => {
    const current = getBlogPosts().find((post) =>
        post.content.includes("illustrations/_generated/")
    )

    expect(current).toBeTruthy()

    expect(current!.content).toContain('illustrations/_generated/')
})

test("blog article hides default team author from visible metadata", async () => {
    const current = getBlogPosts().find((post) => post.author.name === "LeetLLM Team")

    expect(current).toBeTruthy()

    const page = await BlogPostPage({
        params: Promise.resolve({ slug: current!.slug }),
    })
    const { container } = render(page)

    expect(container.querySelector('header [itemprop="author"]')).toBeNull()
})

test("blog article places references after share controls", async () => {
    const current = getBlogPosts().find((post) =>
        post.references && Object.keys(post.references).length > 0
    )

    expect(current).toBeTruthy()

    const page = await BlogPostPage({
        params: Promise.resolve({ slug: current!.slug }),
    })
    render(page)

    const share = screen.getByText("Share this article")
    const references = screen.getByText("References")

    expect(
        share.compareDocumentPosition(references) &
            Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
})
