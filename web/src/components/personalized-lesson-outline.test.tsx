import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { PersonalizedLessonContent } from "./personalized-lesson-content"
import { ServerMarkdownRenderer } from "./server-markdown-renderer"

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
    const { container } = render(
        <PersonalizedLessonContent
            slug="attention"
            canonicalContent={<ServerMarkdownRenderer content="## Original section" contentKey="attention" showTableOfContents />}
        />,
    )
    await screen.findByRole("button", { name: "Original" })
    const readOutlineHrefs = async () => {
        const summary = await screen.findByText("On this page", { selector: "summary" })
        const details = summary.closest("details")
        if (details && !details.open) fireEvent.click(summary)
        const outline = screen.getByRole("navigation", { name: "On this page" })
        return within(outline).getAllByRole("link").map((link) => link.getAttribute("href"))
    }
    await waitFor(async () => expect(await readOutlineHrefs()).toEqual(["#personalized-section", "#worked-example"]))
    fireEvent.click(screen.getByRole("button", { name: "Original" }))
    await waitFor(async () => expect(await readOutlineHrefs()).toEqual(["#original-section"]))
    fireEvent.click(screen.getByRole("button", { name: "Personalized" }))
    await waitFor(async () => expect(await readOutlineHrefs()).toEqual(["#personalized-section", "#worked-example"]))
    const outline = screen.getByRole("navigation", { name: "On this page" })
    for (const link of within(outline).getAllByRole("link")) {
        const id = decodeURIComponent(link.getAttribute("href")!.slice(1))
        expect(Array.from(container.querySelectorAll(".question-content h2, .question-content h3")).some((heading) => heading.id === id)).toBe(true)
    }
})
