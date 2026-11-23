// Google Analytics helpers
// Events reference: https://developers.google.com/analytics/devguides/collection/ga4/reference/events

export const GA_MEASUREMENT_ID = "G-YR84XSNV6Y"

type Gtag = (...args: unknown[]) => void
type AnalyticsParams = Record<string, string | number | boolean> & {
    // GA4 treats `source` as traffic attribution metadata, so app event details must use a specific name.
    source?: never
}
type AnalyticsWindow = Window & {
    dataLayer?: IArguments[]
    gtag?: Gtag
}

function getGtag(): Gtag {
    const analyticsWindow = window as AnalyticsWindow
    analyticsWindow.dataLayer ??= []
    analyticsWindow.gtag ??= function queuedGtag() {
        // gtag requires the function's array-like Arguments object.
        // eslint-disable-next-line prefer-rest-params
        analyticsWindow.dataLayer!.push(arguments)
    }
    return analyticsWindow.gtag
}

// ── Generic event ────────────────────────────────────────────
export function trackEvent(
    action: string,
    params?: AnalyticsParams
) {
    if (typeof window === "undefined") return
    getGtag()("event", action, params)
}

// ── Funnel-specific events ───────────────────────────────────
// These map to the open curriculum funnel: landing, article reads, and signup for progress tracking.

type FunnelEvent =
    | { step: "signup_start"; method: "email" | "google" | "apple" }
    | { step: "signup_complete" }
    | { step: "article_view"; slug: string; section: string; is_free: boolean }
    | { step: "cta_click"; location: string; label: string }

export function trackFunnel(event: FunnelEvent) {
    switch (event.step) {
        case "signup_start":
            trackEvent("sign_up_start", { method: event.method })
            break
        case "signup_complete":
            trackEvent("signup_completed")
            break
        case "article_view":
            trackEvent("article_view", {
                slug: event.slug,
                section: event.section,
                is_free: event.is_free,
            })
            break
        case "cta_click":
            trackEvent("cta_click", {
                location: event.location,
                label: event.label,
            })
            break
    }
}

// ── Pageview (for SPA navigations) ───────────────────────────
export function trackPageview(url: string) {
    if (typeof window === "undefined") return
    const pageUrl = new URL(url, window.location.origin)
    trackEvent("page_view", {
        page_path: `${pageUrl.pathname}${pageUrl.search}`,
        page_location: pageUrl.href,
        page_title: document.title,
    })
}
