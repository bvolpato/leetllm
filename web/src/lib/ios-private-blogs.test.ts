import { describe, expect, test } from "vitest"
import { getIOSPrivateBlogs, IOS_MASTERCLASS_SLUG } from "./ios-private-blogs"
import { getBlogPosts } from "./blog"

describe("iOS private masterclass payload", () => {
    test("includes the current masterclass with self-contained themed PNGs, without publishing it", () => {
        const ownerEmail = "owner@example.com"
        const payload = getIOSPrivateBlogs(ownerEmail)
        const post = payload.blogs[0]
        expect(post.slug).toBe(IOS_MASTERCLASS_SLUG)
        expect(post.accessEmail).toBe(ownerEmail)
        expect(getBlogPosts().some((item) => item.slug === post.slug)).toBe(false)
        expect(post.content).toContain('data-glossary="glm-53"')
        expect(post.references.length).toBeGreaterThan(0)
        expect(post.coverImageDark).not.toBe(post.coverImageLight)

        const paths = [...post.content.matchAll(/private-blog-images\/[^"')\s]+/g)].map(([path]) => path)
        expect(paths.length).toBeGreaterThan(0)
        for (const path of [...paths, post.coverImageDark!, post.coverImageLight!]) {
            const bytes = Buffer.from(payload.images[path], "base64")
            expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a")
        }
    })
})
