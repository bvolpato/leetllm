"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Check, GraduationCap, LogIn } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "leetllm_learned_practice"

function getLocalLearnedProblems(): string[] {
    if (typeof window === "undefined") return []
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}

function setLocalLearnedProblems(slugs: string[]) {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs))
}

export function usePracticeProgress() {
    const [learnedSlugs, setLearnedSlugs] = useState<string[]>([])

    useEffect(() => {
        const local = getLocalLearnedProblems()
        if (local.length > 0) {
            queueMicrotask(() => setLearnedSlugs(local))
        }

        fetch("/api/practice/progress")
            .then((response) => response.json())
            .then((data) => {
                if (!Array.isArray(data.slugs)) return
                const merged = [...new Set([...data.slugs, ...local])]
                setLearnedSlugs(merged)
                setLocalLearnedProblems(merged)

                const remote = new Set(data.slugs)
                local
                    .filter((slug) => !remote.has(slug))
                    .forEach((slug) => {
                        fetch("/api/practice/progress", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ slug }),
                        }).catch(() => { })
                    })
            })
            .catch(() => { })
    }, [])

    const learnedSet = useMemo(() => new Set(learnedSlugs), [learnedSlugs])
    const isLearned = useCallback((slug: string) => learnedSet.has(slug), [learnedSet])

    const markAsLearned = useCallback((slug: string) => {
        setLearnedSlugs((current) => {
            if (current.includes(slug)) return current
            const next = [...current, slug]
            setLocalLearnedProblems(next)
            return next
        })
        fetch("/api/practice/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug }),
        }).catch(() => { })
    }, [])

    const markAsUnlearned = useCallback((slug: string) => {
        setLearnedSlugs((current) => {
            const next = current.filter((item) => item !== slug)
            setLocalLearnedProblems(next)
            return next
        })
        fetch("/api/practice/progress", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug }),
        }).catch(() => { })
    }, [])

    return { learnedSlugs, isLearned, markAsLearned, markAsUnlearned }
}

export function MarkPracticeLearnedButton({ slug }: { slug: string }) {
    const { isLearned, markAsLearned, markAsUnlearned } = usePracticeProgress()
    const learned = isLearned(slug)

    return (
        <Button
            type="button"
            variant={learned ? "secondary" : "outline"}
            size="sm"
            className={learned ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20" : "gap-2"}
            onClick={() => learned ? markAsUnlearned(slug) : markAsLearned(slug)}
        >
            <Check className="h-4 w-4" />
            {learned ? "Learned" : "Mark Learned"}
        </Button>
    )
}

export function PracticeProgressSummary({ total }: { total: number }) {
    const { learnedSlugs } = usePracticeProgress()
    const count = Math.min(learnedSlugs.length, total)
    const pct = total > 0 ? Math.round((count / total) * 100) : 0

    return (
        <div className="rounded-lg border border-border/50 bg-card/60 p-4">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    Progress
                </div>
                <span className="text-xs text-muted-foreground">{count}/{total}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted/30">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}

export function PracticeLoginPrompt({ isLoggedIn }: { isLoggedIn: boolean }) {
    if (isLoggedIn) return null

    return (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <LogIn className="h-4 w-4" />
                Save Progress
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Local progress works without login. Sign in to sync learned problems across devices.
            </p>
            <Link href="/signup" className="mt-3 inline-block">
                <Button size="sm" variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
                    <LogIn className="h-3.5 w-3.5" />
                    Sign Up
                </Button>
            </Link>
        </div>
    )
}

export function PracticeLearnedIndicator({ slug }: { slug: string }) {
    const { isLearned } = usePracticeProgress()
    if (!isLearned(slug)) return <span className="inline-block h-2 w-2 rounded-full border border-border/70" />
    return <Check className="h-4 w-4 text-emerald-400" />
}
