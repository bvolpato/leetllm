import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, expect, test, vi } from "vitest"
import { MarkAsReadButton } from "@/components/reading-progress"
import { ReadingProgressProvider, useReadingProgress } from "./reading-progress"

type AnalyticsWindow = Window & { dataLayer?: IArguments[]; gtag?: (...args: unknown[]) => void }

const authState = vi.hoisted(() => ({
    current: {
        user: { id: "test-user" } as { id: string } | null,
        isLoggedIn: true,
        authLoaded: true,
    },
}))

vi.mock("@/lib/use-is-logged-in", () => ({
    useIsLoggedIn: () => authState.current,
}))

function ProgressConsumer({ label }: { label: string }) {
    const { markAsRead, readSlugs } = useReadingProgress()
    return (
        <button onClick={() => markAsRead(label)}>
            {label}:{readSlugs.length}
        </button>
    )
}

function AccountProgressConsumer() {
    const { readSlugs } = useReadingProgress()
    return <div>progress:{readSlugs.join(",")}</div>
}

beforeEach(() => {
    localStorage.clear()
    delete (window as AnalyticsWindow).dataLayer
    delete (window as AnalyticsWindow).gtag
    authState.current = {
        user: { id: "test-user" },
        isLoggedIn: true,
        authLoaded: true,
    }
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ progress: [] }),
    }))
})

test("records manual lesson completion with non-attribution metadata once per read transition", () => {
    render(
        <ReadingProgressProvider>
            <MarkAsReadButton slug="attention" isLoggedIn />
        </ReadingProgressProvider>
    )

    fireEvent.click(screen.getByRole("button", { name: "Mark as Read" }))
    fireEvent.click(screen.getByRole("button", { name: /Marked as Read/ }))

    const completionEvents = (window as AnalyticsWindow).dataLayer
        ?.map((event) => Array.from(event))
        .filter((event) => event[1] === "lesson_completed")
    expect(completionEvents).toEqual([[
        "event",
        "lesson_completed",
        { slug: "attention", completion_method: "manual" },
    ]])
})

test("shares one remote progress load across consumers", async () => {
    render(
        <ReadingProgressProvider>
            <ProgressConsumer label="sidebar" />
            <ProgressConsumer label="quiz" />
            <ProgressConsumer label="footer" />
        </ReadingProgressProvider>
    )

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
    expect(fetch).toHaveBeenCalledWith("/api/progress")
})

test("keeps anonymous progress local without API requests", async () => {
    authState.current = {
        user: null,
        isLoggedIn: false,
        authLoaded: true,
    }

    render(
        <ReadingProgressProvider>
            <ProgressConsumer label="anonymous-lesson" />
        </ReadingProgressProvider>
    )
    fireEvent.click(screen.getByRole("button", { name: "anonymous-lesson:0" }))

    await waitFor(() => expect(screen.getByRole("button", { name: "anonymous-lesson:1" })).toBeTruthy())
    expect(fetch).not.toHaveBeenCalled()
})

test("replaces account progress when authenticated user changes", async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock
        .mockResolvedValueOnce(Response.json({
                progress: [{ slug: "account-a-lesson", completed: true, updatedAt: "2026-01-01T00:00:00.000Z" }],
        }))
        .mockResolvedValueOnce(Response.json({
                progress: [{ slug: "account-b-lesson", completed: true, updatedAt: "2026-01-02T00:00:00.000Z" }],
        }))

    const view = render(
        <ReadingProgressProvider>
            <AccountProgressConsumer />
        </ReadingProgressProvider>
    )
    expect(await screen.findByText("progress:account-a-lesson")).toBeTruthy()

    authState.current = {
        user: { id: "other-user" },
        isLoggedIn: true,
        authLoaded: true,
    }
    view.rerender(
        <ReadingProgressProvider>
            <AccountProgressConsumer />
        </ReadingProgressProvider>
    )

    expect(await screen.findByText("progress:account-b-lesson")).toBeTruthy()
    expect(screen.queryByText(/account-a-lesson/)).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(2)
})
