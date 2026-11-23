"use client"

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react"
import {
    mergeReadProgress,
    readLocalReadProgress,
    shouldSyncReadProgress,
    writeLocalReadProgress,
    type ReadProgressItem,
} from "@/lib/study-state"
import { useIsLoggedIn } from "@/lib/use-is-logged-in"

const READ_PROGRESS_EVENT = "leetllm:read-progress-changed"
const READ_PROGRESS_OWNER_KEY = "leetllm:read-progress-owner"

interface ReadingProgressContextValue {
    readSlugs: string[]
    markAsRead: (slug: string) => void
    markAsUnread: (slug: string) => void
    isRead: (slug: string) => boolean
}

const ReadingProgressContext = createContext<ReadingProgressContextValue | null>(null)

function readOwnedLocalProgress(ownerId?: string) {
    if (typeof window === "undefined") return []
    const storedOwnerId = localStorage.getItem(READ_PROGRESS_OWNER_KEY)
    if (ownerId ? storedOwnerId && storedOwnerId !== ownerId : storedOwnerId) return []
    return readLocalReadProgress()
}

function setLocalProgress(progress: ReadProgressItem[], ownerId?: string) {
    if (typeof window === "undefined") return
    writeLocalReadProgress(progress)
    if (ownerId) {
        localStorage.setItem(READ_PROGRESS_OWNER_KEY, ownerId)
    } else {
        localStorage.removeItem(READ_PROGRESS_OWNER_KEY)
    }
    const slugs = progress.filter((item) => item.completed).map((item) => item.slug)
    window.dispatchEvent(new CustomEvent<string[]>(READ_PROGRESS_EVENT, { detail: slugs }))
}

function updateLocalProgress(slug: string, completed: boolean, ownerId?: string) {
    const current = readOwnedLocalProgress(ownerId).filter((item) => item.slug !== slug)
    const next = [{ slug, completed, updatedAt: new Date().toISOString() }, ...current]
    setLocalProgress(next, ownerId)
    return next.filter((item) => item.completed).map((item) => item.slug)
}

export function ReadingProgressProvider({ children }: { children: ReactNode }) {
    const { user, isLoggedIn, authLoaded } = useIsLoggedIn()
    const [readSlugs, setReadSlugs] = useState<string[]>([])
    const syncedUserId = useRef<string | null>(null)

    useEffect(() => {
        function handleProgressChange(event: Event) {
            const progressEvent = event as CustomEvent<string[]>
            if (Array.isArray(progressEvent.detail)) {
                setReadSlugs(progressEvent.detail)
            }
        }

        window.addEventListener(READ_PROGRESS_EVENT, handleProgressChange)

        const localProgress = readOwnedLocalProgress()
        const localSlugs = localProgress.filter((item) => item.completed).map((item) => item.slug)
        if (localSlugs.length > 0) {
            queueMicrotask(() => setReadSlugs(localSlugs))
        }

        return () => window.removeEventListener(READ_PROGRESS_EVENT, handleProgressChange)
    }, [])

    useEffect(() => {
        if (!authLoaded) return
        if (!isLoggedIn || !user) {
            syncedUserId.current = null
            const localSlugs = readOwnedLocalProgress()
                .filter((item) => item.completed)
                .map((item) => item.slug)
            queueMicrotask(() => setReadSlugs(localSlugs))
            return
        }
        if (syncedUserId.current === user.id) return

        if (syncedUserId.current) {
            queueMicrotask(() => setReadSlugs([]))
        }
        syncedUserId.current = user.id
        let cancelled = false

        fetch("/api/progress")
            .then((response) => {
                if (!response.ok) throw new Error(`Progress request failed with ${response.status}`)
                return response.json()
            })
            .then((data) => {
                if (cancelled) return
                const currentLocalProgress = readOwnedLocalProgress(user.id)
                const remoteProgress: ReadProgressItem[] = Array.isArray(data.progress)
                    ? data.progress
                    : (data.completed ?? []).map((item: { slug: string; completedAt: string }) => ({
                        slug: item.slug,
                        completed: true,
                        updatedAt: item.completedAt,
                    }))
                const merged = mergeReadProgress(remoteProgress, currentLocalProgress)
                setReadSlugs(merged.filter((item) => item.completed).map((item) => item.slug))
                setLocalProgress(merged, user.id)

                const remoteBySlug = new Map(remoteProgress.map((item) => [item.slug, item]))
                for (const item of currentLocalProgress) {
                    const remote = remoteBySlug.get(item.slug)
                    if (shouldSyncReadProgress(item, remote)) {
                        fetch("/api/progress", {
                            method: item.completed ? "POST" : "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ slug: item.slug }),
                        }).catch(() => { })
                    }
                }
            })
            .catch(() => { })

        return () => {
            cancelled = true
        }
    }, [authLoaded, isLoggedIn, user])

    const markAsRead = useCallback((slug: string) => {
        setReadSlugs(updateLocalProgress(slug, true, user?.id))
        if (isLoggedIn) {
            fetch("/api/progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug }),
            }).catch(() => { })
        }
    }, [isLoggedIn, user?.id])

    const markAsUnread = useCallback((slug: string) => {
        setReadSlugs(updateLocalProgress(slug, false, user?.id))
        if (isLoggedIn) {
            fetch("/api/progress", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug }),
            }).catch(() => { })
        }
    }, [isLoggedIn, user?.id])

    const readSlugsSet = useMemo(() => new Set(readSlugs), [readSlugs])
    const isRead = useCallback((slug: string) => readSlugsSet.has(slug), [readSlugsSet])
    const value = useMemo(() => ({
        readSlugs,
        markAsRead,
        markAsUnread,
        isRead,
    }), [isRead, markAsRead, markAsUnread, readSlugs])

    return (
        <ReadingProgressContext.Provider value={value}>
            {children}
        </ReadingProgressContext.Provider>
    )
}

export function useReadingProgress() {
    const context = useContext(ReadingProgressContext)
    if (!context) {
        throw new Error("useReadingProgress must be used within ReadingProgressProvider")
    }
    return context
}
