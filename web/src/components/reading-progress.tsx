"use client"

import { useState } from "react"
import { Check, BookOpen, LogIn, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { trackEvent } from "@/lib/analytics"
import { useReadingProgress } from "@/lib/reading-progress"

/** "Mark as Read" button shown at the end of articles */
export function MarkAsReadButton({
    slug,
    nextSlug,
    nextTitle,
    isLoggedIn,
    authLoaded = true,
}: {
    slug: string
    nextSlug?: string
    nextTitle?: string
    isLoggedIn: boolean
    authLoaded?: boolean
}) {
    const { isRead, markAsRead, markAsUnread } = useReadingProgress()
    const [showLoginPrompt, setShowLoginPrompt] = useState(false)
    const read = isRead(slug)

    return (
        <div className="flex flex-col items-center gap-4 py-8 border-t border-border/30">
            <button
                type="button"
                onClick={() => {
                    if (read) {
                        markAsUnread(slug)
                        setShowLoginPrompt(false)
                        return
                    }

                    markAsRead(slug)
                    trackEvent("lesson_completed", { slug, completion_method: "manual" })
                    if (authLoaded && !isLoggedIn) setShowLoginPrompt(true)
                }}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${read
                    ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/18"
                    : "bg-primary/10 text-primary border border-primary/25 hover:bg-primary/15"
                    }`}
            >
                <Check
                    className={`h-4 w-4 transition-opacity ${read ? "opacity-100" : "opacity-65"}`}
                    aria-hidden="true"
                />
                {read ? "Marked as Read" : "Mark as Read"}
            </button>
            {showLoginPrompt && (
                <div className="w-full max-w-md">
                    <LoginToTrackPrompt isLoggedIn={isLoggedIn} authLoaded={authLoaded} />
                </div>
            )}
            {nextSlug && (
                <Link href={`/learn/${nextSlug}`}>
                    <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-primary">
                        Next: {nextTitle}
                        <ArrowRight className="h-4 w-4 text-primary" />
                    </Button>
                </Link>
            )}
        </div>
    )
}

/** Progress bar for a section */
export function SectionProgress({
    sectionSlugs,
    label,
}: {
    sectionSlugs: string[]
    label?: string
}) {
    const { isRead } = useReadingProgress()
    const readCount = sectionSlugs.filter(isRead).length
    const total = sectionSlugs.length
    const pct = total > 0 ? Math.round((readCount / total) * 100) : 0

    const complete = total > 0 && readCount === total

    return (
        <div className="space-y-1.5">
            {label && (
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">{label}</span>
                    <span className="tabular-nums text-muted-foreground">
                        {readCount}/{total}
                    </span>
                </div>
            )}
            <div
                role="progressbar"
                aria-label={label ?? "Section progress"}
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-1 rounded-full bg-border/80 dark:bg-white/10 overflow-hidden"
            >
                <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${complete ? "bg-emerald-500" : "bg-primary"}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    )
}

/** Sidebar reading indicator for individual article links */
export function ReadIndicator({ slug }: { slug: string }) {
    const { isRead } = useReadingProgress()
    const read = isRead(slug)

    if (!read) return null
    return <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
}

/** Overall progress summary */
export function OverallProgress({ totalArticles }: { totalArticles: number }) {
    const { readSlugs } = useReadingProgress()
    const readCount = Math.min(readSlugs.length, totalArticles)
    const pct = totalArticles > 0 ? Math.round((readCount / totalArticles) * 100) : 0
    const complete = totalArticles > 0 && readCount === totalArticles

    return (
        <div className="rounded-lg border border-border/60 bg-card/50 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold [color:var(--reading-heading)]">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    Your Progress
                </div>
                <span className="text-xs font-medium tabular-nums [color:var(--reading-muted)]">{pct}%</span>
            </div>
            <div
                role="progressbar"
                aria-label="Overall curriculum progress"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-1.5 rounded-full bg-border/80 dark:bg-white/10 overflow-hidden"
            >
                <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${complete ? "bg-emerald-500" : "bg-primary"}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <p className="text-xs tabular-nums [color:var(--reading-subtle)]">
                {readCount} of {totalArticles} articles completed
            </p>
        </div>
    )
}

/** Login prompt for progress tracking */
export function LoginToTrackPrompt({
    isLoggedIn,
    authLoaded = true,
}: {
    isLoggedIn: boolean
    authLoaded?: boolean
}) {
    if (!authLoaded || isLoggedIn) return null

    return (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <LogIn className="h-4 w-4" />
                Track Your Progress
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
                Create a free account to save your reading progress across devices. Lessons stay open without login.
            </p>
            <Link href="/signup">
                <Button size="sm" variant="outline" className="w-full gap-2 text-xs border-primary/30 text-primary hover:bg-primary/10">
                    <LogIn className="h-3 w-3" />
                    Sign Up Free
                </Button>
            </Link>
        </div>
    )
}
