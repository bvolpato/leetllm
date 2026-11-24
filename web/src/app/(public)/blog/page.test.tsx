import { render, screen } from "@testing-library/react"
import { expect, test } from "vitest"
import { getBlogPosts } from "@/lib/blog"
import BlogPage from "./page"

test("blog listing renders public posts without social banners", () => {
    const posts = getBlogPosts()
    const { container } = render(<BlogPage />)

    for (const post of posts) {
        expect(screen.getByText(post.title)).toBeTruthy()
    }

    expect(screen.getByRole("heading", { level: 1, name: "AI Engineering Blog" })).toBeTruthy()
    expect(screen.getByRole("link", { name: "RSS" }).getAttribute("href")).toBe("/blog/rss.xml")

    const images = [...container.querySelectorAll("img")]
    const bannerImages = images
        .filter((img) => img.getAttribute("src")?.includes("social_banner.png"))

    expect(images.length).toBeGreaterThan(0)
    expect(bannerImages).toEqual([])

    const featuredSection = container.querySelector('section[aria-label="Featured blog post"]')
    const featuredImages = [...(featuredSection?.querySelectorAll("img") ?? [])]
    expect(featuredImages.length).toBeGreaterThan(0)
    const eagerFeatured = featuredImages.filter((image) => image.getAttribute("loading") === "eager")
    expect(eagerFeatured).toHaveLength(1)
    expect(eagerFeatured[0].getAttribute("fetchpriority")).toBe("high")
    for (const image of featuredImages) {
        if (image === eagerFeatured[0]) continue
        expect(image.getAttribute("loading")).toBe("lazy")
        expect(image.getAttribute("fetchpriority")).toBe("auto")
    }

    for (const image of images) {
        if (featuredSection?.contains(image)) continue
        expect(image.getAttribute("loading")).toBe("lazy")
    }
})
