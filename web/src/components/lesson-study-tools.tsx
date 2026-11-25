"use client"

import { useEffect, useState } from "react"
import { Bookmark, NotebookPen } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { useIsLoggedIn } from "@/lib/use-is-logged-in"
import { trackEvent } from "@/lib/analytics"
import {
    readLocalBookmarks,
    readLocalNotes,
    syncStudyAction,
    writeLocalBookmarks,
    writeLocalNotes,
    type StudyState,
} from "@/lib/study-state"

const STUDY_STATE_CACHE_TTL_MS = 60_000

type StudyStateCacheEntry = {
    userKey: string
    fetchedAt: number
    state: StudyState
}

let studyStateCache: StudyStateCacheEntry | null = null
let studyStateInFlight: { userKey: string; promise: Promise<StudyState> } | null = null

function invalidateStudyStateCache() {
    studyStateCache = null
    studyStateInFlight = null
}

function getCachedStudyState(userKey: string): Promise<StudyState> {
    const now = Date.now()
    if (
        studyStateCache &&
        studyStateCache.userKey === userKey &&
        now - studyStateCache.fetchedAt < STUDY_STATE_CACHE_TTL_MS
    ) {
        return Promise.resolve(studyStateCache.state)
    }

    if (studyStateInFlight && studyStateInFlight.userKey === userKey) {
        return studyStateInFlight.promise
    }

    const promise = fetch("/api/study-state")
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Study state fetch failed: ${response.status}`)
            }
            return response.json() as Promise<StudyState>
        })
        .then((state) => {
            studyStateCache = { userKey, fetchedAt: Date.now(), state }
            return state
        })
        .finally(() => {
            if (studyStateInFlight?.promise === promise) {
                studyStateInFlight = null
            }
        })

    studyStateInFlight = { userKey, promise }
    return promise
}

export function LessonStudyTools({ slug, title }: { slug: string; title: string }) {
    const { user, isLoggedIn, authLoaded } = useIsLoggedIn()
    const userKey = user?.id ?? (isLoggedIn ? "__authenticated__" : null)
    const [bookmarked, setBookmarked] = useState(false)
    const [note, setNote] = useState("")
    const [draft, setDraft] = useState("")
    const [sheetOpen, setSheetOpen] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        let cancelled = false
        const localBookmarkState = readLocalBookmarks().find((bookmark) => bookmark.slug === slug)
        const localNoteState = readLocalNotes().find((entry) => entry.slug === slug)
        queueMicrotask(() => {
            if (cancelled) return
            const currentBookmarkState = readLocalBookmarks().find((bookmark) => bookmark.slug === slug)
            const currentNoteState = readLocalNotes().find((entry) => entry.slug === slug)
            const currentNote = currentNoteState && !currentNoteState.deleted ? currentNoteState.body : ""
            setBookmarked(currentBookmarkState?.bookmarked ?? false)
            setNote(currentNote)
            setDraft(currentNote)
        })

        if (!authLoaded) {
            return () => { cancelled = true }
        }
        if (!isLoggedIn || !userKey) {
            invalidateStudyStateCache()
            return () => { cancelled = true }
        }

        getCachedStudyState(userKey)
            .then((state: StudyState) => {
                if (cancelled) return
                const remoteBookmarkState = state.bookmarks.find((bookmark) => bookmark.slug === slug)
                const bookmarkState = !remoteBookmarkState || (localBookmarkState && localBookmarkState.updatedAt > remoteBookmarkState.updatedAt)
                    ? localBookmarkState
                    : remoteBookmarkState
                if (bookmarkState) {
                    setBookmarked(bookmarkState.bookmarked)
                    writeLocalBookmarks([
                        bookmarkState,
                        ...readLocalBookmarks().filter((bookmark) => bookmark.slug !== slug),
                    ])
                    if (bookmarkState === localBookmarkState) {
                        invalidateStudyStateCache()
                        void syncStudyAction({ action: "bookmark", slug, bookmarked: bookmarkState.bookmarked }).catch(() => { })
                    }
                }

                const remoteNoteState = state.notes.find((entry) => entry.slug === slug)
                const noteState = !remoteNoteState || (localNoteState && localNoteState.updatedAt > remoteNoteState.updatedAt)
                    ? localNoteState
                    : remoteNoteState
                if (noteState) {
                    const body = noteState.deleted ? "" : noteState.body
                    setNote(body)
                    setDraft(body)
                    writeLocalNotes([
                        noteState,
                        ...readLocalNotes().filter((entry) => entry.slug !== slug),
                    ])
                    if (noteState === localNoteState) {
                        invalidateStudyStateCache()
                        void syncStudyAction({ action: "note", slug, body }).catch(() => { })
                    }
                }
            })
            .catch(() => { })

        return () => {
            cancelled = true
        }
    }, [authLoaded, isLoggedIn, userKey, slug])

    function toggleBookmark() {
        const next = !bookmarked
        const bookmarks = readLocalBookmarks().filter((bookmark) => bookmark.slug !== slug)
        bookmarks.unshift({ slug, bookmarked: next, updatedAt: new Date().toISOString() })
        writeLocalBookmarks(bookmarks)
        setBookmarked(next)
        trackEvent("bookmark_toggled", { slug, bookmarked: next })
        invalidateStudyStateCache()
        if (isLoggedIn) void syncStudyAction({ action: "bookmark", slug, bookmarked: next }).catch(() => { })
    }

    function saveNote() {
        const body = draft.trim()
        const notes = readLocalNotes().filter((entry) => entry.slug !== slug)
        notes.unshift({ slug, body, deleted: !body, updatedAt: new Date().toISOString() })
        writeLocalNotes(notes)
        setNote(body)
        setDraft(body)
        setSaved(true)
        trackEvent("lesson_note_saved", { slug, has_note: Boolean(body) })
        invalidateStudyStateCache()
        if (isLoggedIn) void syncStudyAction({ action: "note", slug, body }).catch(() => { })
    }

    return (
        <div data-print-hidden className="flex items-center gap-1.5">
            <button
                type="button"
                onClick={toggleBookmark}
                className={`inline-flex size-8 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    bookmarked
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-[color:var(--reading-border)] bg-background [color:var(--reading-muted)] hover:bg-accent hover:[color:var(--reading-heading)] dark:bg-input/30 dark:hover:bg-input/50"
                }`}
                aria-label={bookmarked ? `Remove bookmark for ${title}` : `Bookmark ${title}`}
                title={bookmarked ? "Remove bookmark" : "Bookmark lesson"}
            >
                <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
            </button>

            <Sheet open={sheetOpen} onOpenChange={(open) => {
                setSheetOpen(open)
                setSaved(false)
                if (open) setDraft(note)
            }}>
                <SheetTrigger asChild>
                    <button
                        type="button"
                        className={`inline-flex size-8 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            note
                                ? "border-primary/40 bg-primary/10 text-primary"
                                : "border-[color:var(--reading-border)] bg-background [color:var(--reading-muted)] hover:bg-accent hover:[color:var(--reading-heading)] dark:bg-input/30 dark:hover:bg-input/50"
                        }`}
                        aria-label={`Notes for ${title}`}
                        title="Lesson notes"
                    >
                        <NotebookPen className="h-4 w-4" />
                    </button>
                </SheetTrigger>
                <SheetContent className="w-[min(92vw,28rem)] sm:max-w-md">
                    <SheetHeader className="border-b border-border/50 pr-12">
                        <SheetTitle>Lesson note</SheetTitle>
                        <SheetDescription className="line-clamp-2">{title}</SheetDescription>
                    </SheetHeader>
                    <div className="flex flex-1 flex-col px-4">
                        <label htmlFor={`lesson-note-${slug}`} className="sr-only">Note</label>
                        <textarea
                            id={`lesson-note-${slug}`}
                            value={draft}
                            onChange={(event) => {
                                setDraft(event.target.value)
                                setSaved(false)
                            }}
                            maxLength={10000}
                            placeholder="Capture an idea, question, or follow-up."
                            className="min-h-64 w-full flex-1 resize-none rounded-md border border-border/60 bg-card/50 p-3 text-sm leading-relaxed outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                        />
                    </div>
                    <SheetFooter className="border-t border-border/50">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-xs text-muted-foreground">
                                {saved ? "Saved" : isLoggedIn ? "Synced to your account" : "Saved on this device"}
                            </span>
                            <Button type="button" onClick={saveNote}>Save note</Button>
                        </div>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    )
}
