"use client"

import Script from "next/script"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useRef, Suspense } from "react"
import { GA_MEASUREMENT_ID, trackFunnel, trackPageview, trackEvent } from "@/lib/analytics"
import { WebVitals } from "@/components/web-vitals"

const FIRST_VISIT_KEY = "leetllm_analytics_first_visit"
const RETURN_7D_KEY = "leetllm_analytics_return_7d"
const SIGNUP_COMPLETE_KEY = "leetllm_analytics_signup_complete"

function AnalyticsPageTracker() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const lastPageviewPath = useRef<string | null>(null)

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString())
        // The auth callback marker is removed from history after recording signup completion.
        // Excluding it here keeps that URL cleanup from becoming a second page view.
        if (params.get("signup") === "complete") params.delete("signup")
        const query = params.toString()
        const url = pathname + (query ? `?${query}` : "")
        if (url === lastPageviewPath.current) return
        lastPageviewPath.current = url
        trackPageview(url)
    }, [pathname, searchParams])

    return null
}

function AnalyticsLifecycleTracker() {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        const now = Date.now()
        const firstVisit = Number(window.localStorage.getItem(FIRST_VISIT_KEY))

        if (!Number.isFinite(firstVisit) || firstVisit <= 0) {
            window.localStorage.setItem(FIRST_VISIT_KEY, String(now))
        } else if (
            now - firstVisit >= 7 * 24 * 60 * 60 * 1000 &&
            window.localStorage.getItem(RETURN_7D_KEY) !== "1"
        ) {
            trackEvent("learner_returned_7d", {
                days_since_first_visit: Math.floor((now - firstVisit) / (24 * 60 * 60 * 1000)),
            })
            window.localStorage.setItem(RETURN_7D_KEY, "1")
        }

        if (
            searchParams.get("signup") !== "complete" ||
            window.sessionStorage.getItem(SIGNUP_COMPLETE_KEY) === "1"
        ) return

        trackFunnel({ step: "signup_complete" })
        window.sessionStorage.setItem(SIGNUP_COMPLETE_KEY, "1")
        const nextParams = new URLSearchParams(searchParams.toString())
        nextParams.delete("signup")
        const nextUrl = `${pathname}${nextParams.size > 0 ? `?${nextParams}` : ""}`
        window.history.replaceState(window.history.state, "", nextUrl)
    }, [pathname, searchParams])

    return null
}

export function GoogleAnalytics() {
    // Only load in production
    if (process.env.NODE_ENV !== "production") return null

    return (
        <>
            <Script id="gtag-init" strategy="afterInteractive">
                {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = window.gtag || function(){dataLayer.push(arguments);};
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            send_page_view: false,
          });
        `}
            </Script>
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
                strategy="afterInteractive"
            />
            <WebVitals />
            <Suspense fallback={null}>
                <AnalyticsPageTracker />
                <AnalyticsLifecycleTracker />
            </Suspense>
        </>
    )
}
