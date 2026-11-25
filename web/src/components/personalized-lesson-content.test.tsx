import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, expect, test, vi } from "vitest"
import {
    ArticleReaderBody,
    ArticleReaderProvider,
    ArticleReadingTime,
    PersonalizedLessonContent,
} from "./personalized-lesson-content"

const authState = vi.hoisted(() => ({
    current: {
        user: null as { id: string } | null,
        isLoggedIn: false,
        authLoaded: false,
    },
}))

vi.mock("@/lib/use-is-logged-in", () => ({
    useIsLoggedIn: () => authState.current,
}))

vi.mock("./markdown-renderer", () => ({
    MarkdownRenderer: ({ content }: { content: string }) => <div data-testid="rendered-markdown">{content}</div>,
}))

beforeEach(() => {
    vi.restoreAllMocks()
    window.history.replaceState(null, "", "/learn/attention")
    authState.current = { user: { id: "user-1" }, isLoggedIn: true, authLoaded: true }
})

function openPersonalizePopover() {
    fireEvent.click(screen.getByRole("button", { name: /^Personalize(?:d)?$/ }))
}

test("generates, displays, and toggles a personalized lesson from the toolbar popover", async () => {
    const fetchMock = vi.fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({
            profileConfigured: true,
            personalized: null,
            preset: { tone: "cowboy", explanationLevel: "eli5" },
        }), { status: 200, headers: { "Content-Type": "application/json" } }))
        .mockResolvedValueOnce(new Response(JSON.stringify({
            markdown: "Personalized cowboy explanation",
            preset: { tone: "cowboy", explanationLevel: "eli5" },
        }), { status: 200, headers: { "Content-Type": "application/json" } }))
    vi.stubGlobal("fetch", fetchMock)

    render(<PersonalizedLessonContent slug="attention" content="Canonical explanation" />)
    openPersonalizePopover()

    fireEvent.click(await screen.findByRole("button", { name: "Generate personalized lesson" }))
    await waitFor(() => expect(screen.getByTestId("rendered-markdown").textContent).toBe("Personalized cowboy explanation"))
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
        method: "POST",
        body: JSON.stringify({ slug: "attention", regenerate: false }),
    })

    fireEvent.click(screen.getByRole("button", { name: /Original/ }))
    expect(screen.getByTestId("rendered-markdown").textContent).toBe("Canonical explanation")
    fireEvent.click(screen.getByRole("button", { name: /Personalized/ }))
    expect(screen.getByTestId("rendered-markdown").textContent).toBe("Personalized cowboy explanation")
})

test("skips personalization requests for anonymous visitors", async () => {
    authState.current = { user: null, isLoggedIn: false, authLoaded: true }
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    render(<PersonalizedLessonContent slug="attention" content="Canonical explanation" />)
    openPersonalizePopover()

    const signIn = await screen.findByRole("link", { name: /Sign in to personalize/ })
    expect(signIn.getAttribute("href")).toBe("/login?next=%2Flearn%2Fattention")
    expect(fetchMock).not.toHaveBeenCalled()
})

test("waits for auth and shows the anonymous action without fetching after resolution", async () => {
    authState.current = { user: null, isLoggedIn: false, authLoaded: false }
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    const { rerender } = render(<PersonalizedLessonContent slug="attention" content="Canonical explanation" />)
    openPersonalizePopover()

    expect(screen.getByRole("button", { name: /Loading/ }).hasAttribute("disabled")).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()
    const originalContent = screen.getByTestId("rendered-markdown")

    authState.current = { user: null, isLoggedIn: false, authLoaded: true }
    rerender(<PersonalizedLessonContent slug="attention" content="Canonical explanation" />)

    expect(await screen.findByRole("link", { name: /Sign in to personalize/ })).toBeTruthy()
    expect(screen.getByTestId("rendered-markdown")).toBe(originalContent)
    expect(fetchMock).not.toHaveBeenCalled()
})

test("clears personalized content immediately when the account logs out", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
        profileConfigured: true,
        personalized: { markdown: "Private personalized explanation", generatedAt: "2026-10-03T00:00:00Z" },
    }), { status: 200, headers: { "Content-Type": "application/json" } })))

    const { rerender } = render(<PersonalizedLessonContent slug="attention" content="Canonical explanation" />)
    await waitFor(() => expect(screen.getByTestId("rendered-markdown").textContent).toBe("Private personalized explanation"))

    authState.current = { user: null, isLoggedIn: false, authLoaded: true }
    rerender(<PersonalizedLessonContent slug="attention" content="Canonical explanation" />)

    expect(screen.getByTestId("rendered-markdown").textContent).toBe("Canonical explanation")
    openPersonalizePopover()
    expect(await screen.findByRole("link", { name: /Sign in to personalize/ })).toBeTruthy()
})

test("fails closed when authentication cannot be verified", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network unavailable")))

    render(<PersonalizedLessonContent slug="attention" content="Canonical explanation" />)
    openPersonalizePopover()

    expect((await screen.findByRole("button", { name: /Personalization unavailable/ })).hasAttribute("disabled")).toBe(true)
    expect(screen.queryByRole("button", { name: "Generate personalized lesson" })).toBeNull()
    expect(screen.getAllByRole("alert")[0].textContent).toContain("Network unavailable")
})

test("shows provider errors returned after a streamed response starts", async () => {
    const fetchMock = vi.fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({
            profileConfigured: true,
            personalized: null,
        }), { status: 200, headers: { "Content-Type": "application/json" } }))
        .mockResolvedValueOnce(new Response(JSON.stringify({
            error: "Personalization provider timed out",
        }), { status: 200, headers: { "Content-Type": "application/json" } }))
    vi.stubGlobal("fetch", fetchMock)

    render(<PersonalizedLessonContent slug="attention" content="Canonical explanation" />)
    openPersonalizePopover()

    fireEvent.click(await screen.findByRole("button", { name: "Generate personalized lesson" }))
    await waitFor(() => {
        expect(screen.getAllByRole("alert").some((node) => node.textContent?.includes("Personalization provider timed out"))).toBe(true)
    })
    expect(screen.getByTestId("rendered-markdown").textContent).toBe("Canonical explanation")
})

test("renders a single unified lesson body and reading time", () => {
    authState.current = { user: null, isLoggedIn: false, authLoaded: true }
    render(
        <ArticleReaderProvider
            slug="design-production-rag-pipeline"
            readerTimeEstimate={15}
        >
            <ArticleReadingTime />
            <ArticleReaderBody
                readerContent={<div data-testid="lesson-body">Unified lesson content</div>}
            />
        </ArticleReaderProvider>,
    )

    expect(screen.getByTestId("lesson-body").textContent).toBe("Unified lesson content")
    expect(screen.getByText("15 min read")).toBeTruthy()
})
