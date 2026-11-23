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

export function LessonStudyTools({ slug, title }: { slug: string; title: string }) {
    const { isLoggedIn, authLoaded } = useIsLoggedIn()
    const [bookmarked, setBookmarked] = useState(false)
    const [note, setNote] = useState("")
    const [draft, setDraft] = useState("")
    const [sheetOpen, setSheetOpen] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        const localBookmarkState = readLocalBookmarks().find((bookmark) => bookmark.slug === slug)
        const localBookmark = localBookmarkState?.bookmarked ?? false
        const localNoteState = readLocalNotes().find((entry) => entry.slug === slug)
        const localNote = localNoteState && !localNoteState.deleted ? localNoteState.body : ""
        queueMicrotask(() => {
            if (localBookmark) setBookmarked(true)
            if (localNote) {
                setNote(localNote)
                setDraft(localNote)
            }
        })

        if (!authLoaded || !isLoggedIn) return

        fetch("/api/study-state")
            .then((response) => response.json())
            .then((state: StudyState) => {
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
                        void syncStudyAction({ action: "note", slug, body }).catch(() => { })
                    }
                }
            })
            .catch(() => { })
    }, [authLoaded, isLoggedIn, slug])

    function toggleBookmark() {
        const next = !bookmarked
        const bookmarks = readLocalBookmarks().filter((bookmark) => bookmark.slug !== slug)
        bookmarks.unshift({ slug, bookmarked: next, updatedAt: new Date().toISOString() })
        writeLocalBookmarks(bookmarks)
        setBookmarked(next)
        trackEvent("bookmark_toggled", { slug, bookmarked: next })
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
        if (isLoggedIn) void syncStudyAction({ action: "note", slug, body }).catch(() => { })
    }

    return (
        <div data-print-hidden className="flex items-center gap-1">
            <button
                type="button"
                onClick={toggleBookmark}
                className={`inline-flex size-9 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    bookmarked
                        ? "border-primary/35 bg-primary/10 text-primary"
                        : "border-border/55 text-muted-foreground hover:bg-accent hover:text-foreground"
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
                        className={`inline-flex size-9 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            note
                                ? "border-primary/35 bg-primary/10 text-primary"
                                : "border-border/55 text-muted-foreground hover:bg-accent hover:text-foreground"
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
