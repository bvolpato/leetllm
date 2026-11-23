import { render, waitFor } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { ArticleTracker } from "./article-tracker"

const auth = vi.hoisted(() => ({
    value: { user: null as { id: string } | null, isLoggedIn: false, authLoaded: false },
}))

vi.mock("@/lib/use-is-logged-in", () => ({
    useIsLoggedIn: () => auth.value,
}))

vi.mock("@/lib/analytics", () => ({
    trackEvent: vi.fn(),
    trackFunnel: vi.fn(),
}))

afterEach(() => {
    auth.value = { user: null, isLoggedIn: false, authLoaded: false }
    vi.unstubAllGlobals()
})

test("records article open after logged-in auth resolves", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true })))
    vi.stubGlobal("fetch", fetchMock)
    const { rerender } = render(
        <ArticleTracker slug="attention" section="Foundations" isFree />
    )

    expect(fetchMock).not.toHaveBeenCalled()

    auth.value = { user: { id: "user-1" }, isLoggedIn: true, authLoaded: true }
    rerender(<ArticleTracker slug="attention" section="Foundations" isFree />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
        "/api/progress",
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug: "attention" }),
            keepalive: true,
        }
    ))
})
