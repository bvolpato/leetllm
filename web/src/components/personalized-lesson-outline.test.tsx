import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { PersonalizedLessonContent } from "./personalized-lesson-content"

vi.mock("@/lib/use-is-logged-in", () => ({
    useIsLoggedIn: () => ({ user: { id: "user-1" }, isLoggedIn: true, authLoaded: true }),
}))

vi.mock("./personalized-mermaid-diagram", () => ({ PersonalizedMermaidDiagram: () => null }))
vi.mock("./personalized-vizmatic-diagram", () => ({ PersonalizedVizmaticDiagram: () => null }))

afterEach(() => vi.unstubAllGlobals())

test("lesson outline follows the original and saved personalized versions", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
        profileConfigured: true,
        personalized: { markdown: "## Personalized section\n\n### Worked example", generatedAt: "2026-09-23T00:00:00Z" },
    }), { status: 200, headers: { "Content-Type": "application/json" } })))
    const { container } = render(<PersonalizedLessonContent slug="attention" content="## Original section" />)
    await screen.findByRole("button", { name: "Original" })
    fireEvent.click(screen.getByText("On this page", { selector: "summary" }))
    const outline = screen.getByRole("navigation", { name: "On this page" })
    const hrefs = () => within(outline).getAllByRole("link").map((link) => link.getAttribute("href"))
    await waitFor(() => expect(hrefs()).toEqual(["#personalized-section", "#worked-example"]))
    fireEvent.click(screen.getByRole("button", { name: "Original" }))
    await waitFor(() => expect(hrefs()).toEqual(["#original-section"]))
    fireEvent.click(screen.getByRole("button", { name: "Personalized" }))
    await waitFor(() => expect(hrefs()).toEqual(["#personalized-section", "#worked-example"]))
    for (const link of within(outline).getAllByRole("link")) {
        const id = decodeURIComponent(link.getAttribute("href")!.slice(1))
        expect(Array.from(container.querySelectorAll(".question-content h2, .question-content h3")).some((heading) => heading.id === id)).toBe(true)
    }
})
