import { render } from "@testing-library/react"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { GoogleAnalytics } from "./google-analytics"

type AnalyticsWindow = Window & { dataLayer?: IArguments[]; gtag?: (...args: unknown[]) => void }

const navigationCache = vi.hoisted(() => ({
    search: "",
    params: null as URLSearchParams | null,
}))

vi.mock("next/script", () => ({ default: () => null }))
vi.mock("@/components/web-vitals", () => ({ WebVitals: () => null }))
vi.mock("next/navigation", () => ({
    usePathname: () => window.location.pathname,
    useSearchParams: () => {
        const search = window.location.search
        if (navigationCache.search !== search || !navigationCache.params) {
            navigationCache.search = search
            navigationCache.params = new URLSearchParams(search)
        }
        return navigationCache.params
    },
}))

beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production")
    localStorage.clear()
    sessionStorage.clear()
    delete (window as AnalyticsWindow).dataLayer
    delete (window as AnalyticsWindow).gtag
    navigationCache.search = ""
    navigationCache.params = null
    window.history.replaceState({}, "", "/learn/attention")
})

afterEach(() => vi.unstubAllEnvs())

test("tracks signup completion once and avoids a duplicate page view when cleaning its callback URL", () => {
    window.history.replaceState({}, "", "/learn/attention?chapter=1&signup=complete")
    const view = render(<GoogleAnalytics />)

    view.rerender(<GoogleAnalytics />)

    const events = (window as AnalyticsWindow).dataLayer?.map((event) => Array.from(event))
    expect(events?.filter((event) => event[1] === "page_view")).toEqual([[
        "event",
        "page_view",
        {
            page_path: "/learn/attention?chapter=1",
            page_location: "http://localhost:3000/learn/attention?chapter=1",
            page_title: "",
        },
    ]])
    expect(events?.filter((event) => event[1] === "signup_completed")).toEqual([
        ["event", "signup_completed", undefined],
    ])
    expect(window.location.search).toBe("?chapter=1")
})

test("records one seven-day return after the first visit threshold", () => {
    const eightDaysMs = 8 * 24 * 60 * 60 * 1000
    localStorage.setItem("leetllm_analytics_first_visit", String(Date.now() - eightDaysMs))
    const view = render(<GoogleAnalytics />)

    window.history.replaceState({}, "", "/learn/attention?tab=practice")
    view.rerender(<GoogleAnalytics />)

    const returnedEvents = (window as AnalyticsWindow).dataLayer
        ?.map((event) => Array.from(event))
        .filter((event) => event[1] === "learner_returned_7d")
    expect(returnedEvents).toEqual([[
        "event",
        "learner_returned_7d",
        { days_since_first_visit: 8 },
    ]])
})
