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
                className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${read
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10"
                    : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 hover:scale-[1.02]"
                    }`}
            >
                <Check
                    className={`h-4 w-4 transition-transform duration-300 ${read ? "scale-100" : "scale-75 opacity-60"
                        }`}
                />
                {read ? "Marked as Read ✓" : "Mark as Read"}
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

    return (
        <div className="space-y-1.5">
            {label && (
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground/70 font-medium">{label}</span>
                    <span className="text-muted-foreground/50">
                        {readCount}/{total}
                    </span>
                </div>
            )}
            <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                <div
                    className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
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
    return <Check className="h-3 w-3 text-emerald-400 flex-shrink-0" />
}

/** Overall progress summary */
export function OverallProgress({ totalArticles }: { totalArticles: number }) {
    const { readSlugs } = useReadingProgress()
    const readCount = Math.min(readSlugs.length, totalArticles)
    const pct = totalArticles > 0 ? Math.round((readCount / totalArticles) * 100) : 0

    return (
        <div className="rounded-xl border border-border/50 bg-card/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Your Progress
                </div>
                <span className="text-xs text-muted-foreground/60">{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700 ease-out"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <p className="text-xs text-muted-foreground/60">
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
