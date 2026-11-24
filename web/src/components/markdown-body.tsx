"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { LessonTableOfContents, type HeadingEntry } from "./lesson-table-of-contents"

function headingIdFromLocationHash() {
    const raw = window.location.hash.replace(/^#/, "")
    if (!raw) return ""
    try {
        return decodeURIComponent(raw)
    } catch {
        return raw
    }
}

function useRestoreHeadingHash(contentKey: string) {
    useEffect(() => {
        let allowAdjust = true
        const stopAdjusting = () => {
            allowAdjust = false
        }

        const scrollToCurrentHash = () => {
            if (!allowAdjust) return
            const id = headingIdFromLocationHash()
            if (!id) return
            document.getElementById(id)?.scrollIntoView()
        }

        scrollToCurrentHash()
        const frame = window.requestAnimationFrame(scrollToCurrentHash)
        const timeouts = [150, 400, 1200].map((ms) => window.setTimeout(scrollToCurrentHash, ms))
        const stopTimer = window.setTimeout(stopAdjusting, 2000)

        window.addEventListener("hashchange", scrollToCurrentHash)
        window.addEventListener("load", scrollToCurrentHash)
        window.addEventListener("wheel", stopAdjusting, { passive: true })
        window.addEventListener("touchmove", stopAdjusting, { passive: true })
        window.addEventListener("keydown", stopAdjusting)

        const images = Array.from(document.querySelectorAll<HTMLImageElement>(".question-content img"))
        for (const image of images) {
            if (!image.complete) image.addEventListener("load", scrollToCurrentHash)
        }

        return () => {
            allowAdjust = false
            window.cancelAnimationFrame(frame)
            for (const timeout of timeouts) window.clearTimeout(timeout)
            window.clearTimeout(stopTimer)
            window.removeEventListener("hashchange", scrollToCurrentHash)
            window.removeEventListener("load", scrollToCurrentHash)
            window.removeEventListener("wheel", stopAdjusting)
            window.removeEventListener("touchmove", stopAdjusting)
            window.removeEventListener("keydown", stopAdjusting)
            for (const image of images) image.removeEventListener("load", scrollToCurrentHash)
        }
    }, [contentKey])
}

export function MarkdownBody({
    children,
    contentKey,
    showTableOfContents = false,
    hideInlineTocOnDesktop = false,
    initialHeadings,
}: {
    children: ReactNode
    contentKey: string
    showTableOfContents?: boolean
    hideInlineTocOnDesktop?: boolean
    initialHeadings?: HeadingEntry[]
}) {
    const bodyRef = useRef<HTMLDivElement>(null)
    useRestoreHeadingHash(contentKey)
    return (
        <>
            {showTableOfContents && (
                <LessonTableOfContents
                    key={initialHeadings ? contentKey : undefined}
                    bodyRef={bodyRef}
                    content={contentKey}
                    initialHeadings={initialHeadings}
                    hideOnDesktop={hideInlineTocOnDesktop}
                />
            )}
            <div ref={bodyRef} className="question-content">{children}</div>
        </>
    )
}
