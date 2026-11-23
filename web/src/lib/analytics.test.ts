import { beforeEach, describe, expect, test, vi } from "vitest"
import { trackEvent, trackFunnel, trackPageview } from "./analytics"

type AnalyticsWindow = Window & {
    dataLayer?: IArguments[]
    gtag?: (...args: unknown[]) => void
}

describe("analytics", () => {
    beforeEach(() => {
        const analyticsWindow = window as AnalyticsWindow
        delete analyticsWindow.dataLayer
        delete analyticsWindow.gtag
        document.title = "Test page"
        window.history.replaceState({}, "", "/current")
    })

    test("queues events before Google Analytics loads", () => {
        trackEvent("lesson_started", { slug: "attention" })

        const queued = (window as AnalyticsWindow).dataLayer
        expect(queued).toHaveLength(1)
        expect(Array.from(queued![0])).toEqual([
            "event",
            "lesson_started",
            { slug: "attention" },
        ])
    })

    test("emits explicit SPA page views", () => {
        trackPageview("/learn/attention?source=plan")

        const queued = (window as AnalyticsWindow).dataLayer
        expect(Array.from(queued![0])).toEqual([
            "event",
            "page_view",
            {
                page_path: "/learn/attention?source=plan",
                page_location: "http://localhost:3000/learn/attention?source=plan",
                page_title: "Test page",
            },
        ])
    })

    test("uses an existing gtag implementation", () => {
        const gtag = vi.fn()
        ;(window as AnalyticsWindow).gtag = gtag

        trackEvent("practice_passed", { slug: "vector-search" })

        expect(gtag).toHaveBeenCalledWith("event", "practice_passed", { slug: "vector-search" })
    })

    test("uses the product signup completion event name", () => {
        const gtag = vi.fn()
        ;(window as AnalyticsWindow).gtag = gtag

        trackFunnel({ step: "signup_complete" })

        expect(gtag).toHaveBeenCalledWith("event", "signup_completed", undefined)
    })
})
