"use client"

import { useEffect } from "react"
import { trackEvent, trackFunnel } from "@/lib/analytics"
import { useIsLoggedIn } from "@/lib/use-is-logged-in"

/**
 * Fires an article_view analytics event on mount.
 * Drop into server-rendered article pages without converting them to client.
 */
export function ArticleTracker({
    slug,
    section,
    isFree,
}: {
    slug: string
    section: string
    isFree: boolean
}) {
    const { user, isLoggedIn, authLoaded } = useIsLoggedIn()
    const userId = user?.id

    useEffect(() => {
        trackFunnel({ step: "article_view", slug, section, is_free: isFree })
        trackEvent("lesson_started", { slug, section })
    }, [slug, section, isFree])

    useEffect(() => {
        if (!authLoaded || !isLoggedIn || !userId) return

        fetch("/api/progress", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug }),
            keepalive: true,
        }).catch(() => { })
    }, [authLoaded, isLoggedIn, slug, userId])

    return null
}
