import { StrictMode } from "react"
import { render } from "@testing-library/react"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals"
import { WebVitals } from "./web-vitals"

const webVitalsMock = vi.hoisted(() => ({
    onCLS: vi.fn(),
    onFCP: vi.fn(),
    onINP: vi.fn(),
    onLCP: vi.fn(),
    onTTFB: vi.fn(),
}))

vi.mock("web-vitals", () => webVitalsMock)
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }))

import { trackEvent } from "@/lib/analytics"

const registrationKey = Symbol.for("leetllm.web-vitals.registered")
type RegistrationStore = Record<symbol, boolean | undefined>

beforeEach(() => {
    vi.clearAllMocks()
    delete (window as unknown as RegistrationStore)[registrationKey]
})

afterEach(() => {
    vi.restoreAllMocks()
    delete (window as unknown as RegistrationStore)[registrationKey]
})

test("reports canonical original document attribution and Web Vitals GA fields", () => {
    vi.spyOn(performance, "getEntriesByType").mockReturnValue([
        { name: "https://leetllm.com/learn/attention?signup=complete#quiz" } as PerformanceNavigationTiming,
    ])
    window.history.replaceState({}, "", "/glossary?term=softmax#definition")

    render(<WebVitals />)
    const report = vi.mocked(onCLS).mock.calls[0][0]

    report({
        name: "CLS",
        value: 0.1234,
        delta: 0.1234,
        id: "v4-1700000000-1234567890",
        navigationId: 1,
        rating: "needs-improvement",
        navigationType: "navigate",
        entries: [],
    })

    expect(trackEvent).toHaveBeenCalledWith("CLS", {
        value: 123,
        event_label: "v4-1700000000-1234567890",
        metric_id: "v4-1700000000-1234567890",
        metric_unit: "CLSx1000",
        metric_rating: "needs-improvement",
        navigation_type: "navigate",
        page_location: "https://leetllm.com/learn/attention",
        document_path: "/learn/attention",
        non_interaction: true,
    })
})

test("uses canonical window URL fallback and reports LCP in integer milliseconds", () => {
    vi.spyOn(performance, "getEntriesByType").mockReturnValue([])
    window.history.replaceState({}, "", "/learn/attention?signup=complete#quiz")

    render(<WebVitals />)
    const report = vi.mocked(onLCP).mock.calls[0][0]
    window.history.replaceState({}, "", "/glossary?term=softmax")

    report({
        name: "LCP",
        value: 2321.6,
        delta: 2321.6,
        id: "v4-1700000000-1234567891",
        navigationId: 1,
        rating: "good",
        navigationType: "reload",
        entries: [],
    })

    expect(trackEvent).toHaveBeenCalledWith("LCP", {
        value: 2322,
        event_label: "v4-1700000000-1234567891",
        metric_id: "v4-1700000000-1234567891",
        metric_unit: "ms",
        metric_rating: "good",
        navigation_type: "reload",
        page_location: "http://localhost:3000/learn/attention",
        document_path: "/learn/attention",
        non_interaction: true,
    })
})

test("registers the five supported metrics once per document across StrictMode and remounts", () => {
    const view = render(
        <StrictMode>
            <WebVitals />
        </StrictMode>,
    )

    expect(onTTFB).toHaveBeenCalledOnce()
    expect(onFCP).toHaveBeenCalledOnce()
    expect(onLCP).toHaveBeenCalledOnce()
    expect(onINP).toHaveBeenCalledOnce()
    expect(onCLS).toHaveBeenCalledOnce()
    for (const observer of [onTTFB, onFCP, onLCP, onINP, onCLS]) {
        expect(vi.mocked(observer).mock.calls[0]).toHaveLength(1)
    }

    view.unmount()
    render(<WebVitals />)

    expect(onTTFB).toHaveBeenCalledOnce()
    expect(onFCP).toHaveBeenCalledOnce()
    expect(onLCP).toHaveBeenCalledOnce()
    expect(onINP).toHaveBeenCalledOnce()
    expect(onCLS).toHaveBeenCalledOnce()
})
