"use client"

import { useEffect } from "react"
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals"
import { trackEvent } from "@/lib/analytics"

const WEB_VITALS_REGISTRATION = Symbol.for("leetllm.web-vitals.registered")
type RegistrationStore = Record<symbol, boolean | undefined>

function getDocumentAttribution() {
    const navigationEntry = performance.getEntriesByType("navigation")[0]
    const originalUrl = new URL(navigationEntry?.name || window.location.href, window.location.href)
    originalUrl.search = ""
    originalUrl.hash = ""

    return {
        page_location: originalUrl.href,
        document_path: originalUrl.pathname,
    }
}

function reportWebVital(metric: Metric, documentAttribution: ReturnType<typeof getDocumentAttribution>) {
    trackEvent(metric.name, {
        value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
        event_label: metric.id,
        metric_id: metric.id,
        metric_unit: metric.name === "CLS" ? "CLSx1000" : "ms",
        metric_rating: metric.rating,
        navigation_type: metric.navigationType,
        ...documentAttribution,
        non_interaction: true,
    })
}

function registerWebVitalsOnce() {
    const registrationStore = window as unknown as RegistrationStore
    if (registrationStore[WEB_VITALS_REGISTRATION]) return

    registrationStore[WEB_VITALS_REGISTRATION] = true
    const documentAttribution = getDocumentAttribution()
    const report = (metric: Metric) => reportWebVital(metric, documentAttribution)

    onTTFB(report)
    onFCP(report)
    onLCP(report)
    onINP(report)
    onCLS(report)
}

export function WebVitals() {
    useEffect(() => {
        registerWebVitalsOnce()
    }, [])

    return null
}
