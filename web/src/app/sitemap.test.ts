import { expect, test } from "vitest"
import { getAllBlogPostsIncludingPrivate } from "@/lib/blog"
import sitemap from "./sitemap"

test("sitemap excludes every private blog post", () => {
    const privatePosts = getAllBlogPostsIncludingPrivate().filter((post) => post.private)
    const urls = new Set(sitemap().map((entry) => entry.url))

    expect(privatePosts.length).toBeGreaterThan(0)
    for (const post of privatePosts) {
        expect(urls.has(`https://leetllm.com/blog/${post.slug}`)).toBe(false)
    }
})
