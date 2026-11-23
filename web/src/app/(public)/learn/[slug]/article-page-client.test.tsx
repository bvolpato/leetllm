import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, expect, test, vi } from "vitest"
import type { ReactElement } from "react"
import { ReadingProgressProvider } from "@/lib/reading-progress"
import { ArticlePageClient } from "./article-page-client"

vi.mock("@/lib/use-is-logged-in", () => ({
    useIsLoggedIn: () => ({ user: null, isLoggedIn: false, authLoaded: true }),
}))

function renderWithProgress(element: ReactElement) {
    return render(<ReadingProgressProvider>{element}</ReadingProgressProvider>)
}

beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
            json: vi.fn().mockResolvedValue({ slugs: [] }),
        })
    )
})

test("learn article footer shows previous and next before share controls", () => {
    const previousTitle = "Previous lesson with full context"
    const nextTitle = "Next lesson with full context"

    renderWithProgress(
        <ArticlePageClient
            variant="footer"
            slug="current"
            articleTitle="Current lesson"
            articleDescription="Current lesson summary"
            prevSlug="previous"
            prevTitle={previousTitle}
            nextSlug="next"
            nextTitle={nextTitle}
            isLoggedIn={false}
            totalCount={10}
        />
    )

    const previous = screen.getByText(previousTitle)
    const next = screen.getByText(nextTitle)
    const share = screen.getByText("Share this article")

    expect(
        previous.compareDocumentPosition(share) &
            Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
        next.compareDocumentPosition(share) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
})

test("learn article footer places next-step card after mark-as-read and makes whole card clickable", () => {
    const nextTitle = "Next lesson with full context"

    renderWithProgress(
        <ArticlePageClient
            variant="footer"
            slug="current"
            articleTitle="Current lesson"
            articleDescription="Current lesson summary"
            nextCallout={{
                href: "/learn/next-step",
                title: nextTitle,
                description: "Carry result into next lesson.",
            }}
            nextSlug="next"
            nextTitle={nextTitle}
            isLoggedIn={false}
            totalCount={10}
        />
    )

    const markAsRead = screen.getByRole("button", { name: "Mark as Read" })
    const nextStep = screen.getByRole("link", { name: /next step/i })
    const share = screen.getByText("Share this article")

    expect(nextStep.getAttribute("href")).toBe("/learn/next-step")
    expect(
        markAsRead.compareDocumentPosition(nextStep) &
            Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
        nextStep.compareDocumentPosition(share) &
            Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(screen.getByText(`Continue to ${nextTitle}`)).toBeTruthy()
    expect(screen.queryByText(`Next: Continue to ${nextTitle}`)).toBeNull()
    expect(screen.queryByText(/^Next$/)).toBeNull()
    expect(document.querySelector('a[href="/learn/next"]')).toBeNull()
})

test("logged-out mark-as-read click offers account creation for saved progress", () => {
    renderWithProgress(
        <ArticlePageClient
            variant="footer"
            slug="current"
            articleTitle="Current lesson"
            articleDescription="Current lesson summary"
            isLoggedIn={false}
            totalCount={10}
        />
    )

    fireEvent.click(screen.getByRole("button", { name: "Mark as Read" }))

    expect(screen.getByText("Sign Up Free")).toBeTruthy()
})

test("mastery quiz articles do not expose manual completion", () => {
    renderWithProgress(
        <ArticlePageClient
            variant="footer"
            slug="current"
            articleTitle="Current lesson"
            articleDescription="Current lesson summary"
            isLoggedIn={false}
            totalCount={10}
            hasMasteryQuiz
        />
    )

    expect(screen.queryByRole("button", { name: "Mark as Read" })).toBeNull()
})

test("article sidebar marks current lesson", () => {
    renderWithProgress(
        <ArticlePageClient
            variant="sidebar"
            slug="current"
            sidebarSections={[
                {
                    name: "Foundations",
                    config: { icon: "A", description: "desc", color: "text-primary" },
                    questions: [
                        { id: "1", title: "Previous", slug: "previous" },
                        { id: "2", title: "Current", slug: "current" },
                        { id: "3", title: "Next", slug: "next" },
                    ],
                },
            ]}
            totalCount={3}
        />
    )

    const currentLink = screen.getByRole("link", { name: "Current" })

    expect(screen.getByRole("navigation", { name: "Foundations lessons" }).contains(currentLink)).toBe(true)
    expect(currentLink.getAttribute("aria-current")).toBe("page")
})
