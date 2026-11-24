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
    const firstCardImages = [...cards[0].querySelectorAll("img")]
    expect(firstCardImages.length).toBeGreaterThan(0)
    const eagerFirstCard = firstCardImages.filter((image) => image.getAttribute("loading") === "eager")
    expect(eagerFirstCard).toHaveLength(1)
    expect(eagerFirstCard[0].getAttribute("fetchpriority")).toBe("high")

    for (const image of images) {
        const cardIndex = cards.findIndex((card) => card.contains(image))
        expect(cardIndex).toBeGreaterThanOrEqual(0)
        if (cardIndex === 0 && image === eagerFirstCard[0]) {
            expect(image.getAttribute("loading")).toBe("eager")
            expect(image.getAttribute("fetchpriority")).toBe("high")
        } else {
            expect(image.getAttribute("loading")).toBe("lazy")
            expect(image.getAttribute("fetchpriority")).toBe("auto")
        }
    }
})
