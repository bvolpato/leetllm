import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, expect, test, vi } from "vitest"
import { ArticleComments } from "./article-comments"

let intersectionCallback: IntersectionObserverCallback | null = null
let observerOptions: IntersectionObserverInit | undefined

class TestIntersectionObserver {
    root = null
    rootMargin = ""
    thresholds = [0]

    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        intersectionCallback = callback
        observerOptions = options
    }

    observe() { }
    unobserve() { }
    disconnect() { }
    takeRecords(): IntersectionObserverEntry[] { return [] }
}

vi.mock("@/lib/use-is-logged-in", () => ({
    useIsLoggedIn: () => ({ user: null, isLoggedIn: false, authLoaded: true }),
}))

beforeEach(() => {
    intersectionCallback = null
    observerOptions = undefined
    vi.stubGlobal("IntersectionObserver", TestIntersectionObserver)
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ comments: [] }),
    }))
})

test("defers comments request until discussion is opened", async () => {
    render(<ArticleComments slug="attention" />)

    expect(screen.getByRole("heading", { name: "Discussion" })).toBeTruthy()
    expect(screen.getByText("Discussion loads when you reach this section.")).toBeTruthy()
    expect(fetch).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "Load discussion" }))

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
    expect(fetch).toHaveBeenCalledWith("/api/comments?slug=attention")
})

test("loads comments once when discussion nears viewport", async () => {
    render(<ArticleComments slug="tensor-shapes" />)

    expect(observerOptions).toEqual({ rootMargin: "600px 0px" })
    act(() => {
        intersectionCallback?.(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            {} as IntersectionObserver,
        )
    })

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
    expect(fetch).toHaveBeenCalledWith("/api/comments?slug=tensor-shapes")
})
