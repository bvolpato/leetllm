import { render } from "@testing-library/react"
import { expect, test } from "vitest"
import { getBlogPosts } from "@/lib/blog"
import BlogAllPage from "./page"

test("blog archive prioritizes the first cover and lazy-loads the remaining covers", () => {
    const posts = getBlogPosts()
    const { container } = render(<BlogAllPage />)
    const cards = [...container.querySelectorAll('a[href^="/blog/"]')]
        .filter((link) => link.querySelector("article"))
    const images = [...container.querySelectorAll("img")]

    expect(cards).toHaveLength(posts.length)
    expect(cards[0].querySelectorAll("img").length).toBeGreaterThan(0)

    for (const image of images) {
        const cardIndex = cards.findIndex((card) => card.contains(image))
        expect(cardIndex).toBeGreaterThanOrEqual(0)
        expect(image.getAttribute("loading")).toBe(cardIndex === 0 ? "eager" : "lazy")
        expect(image.getAttribute("fetchpriority")).toBe(cardIndex === 0 ? "high" : "auto")
    }
})
