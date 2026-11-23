"use client"

import { trackFunnel } from "@/lib/analytics"

interface TrackedLinkProps {
    location: string
    label: string
    children: React.ReactNode
}

/**
 * Wraps children (usually a Link + Button) and fires a cta_click
 * funnel event when clicked. Doesn't alter DOM structure.
 */
export function TrackedCta({ location, label, children }: TrackedLinkProps) {
    return (
        <span
            onClick={() => trackFunnel({ step: "cta_click", location, label })}
            className="contents"
        >
            {children}
        </span>
    )
}
