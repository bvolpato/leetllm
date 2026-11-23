"use client"

import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Clock, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface LearnSearchResult {
    id: string
    title: string
    slug: string
    section: string
    difficulty: string
    timeEstimate: number
    snippet: string
    snippetSource: "shortDescription" | "content"
}

const MIN_QUERY_LENGTH = 2
const SEARCH_DEBOUNCE_MS = 120
const EMPTY_RESULTS: LearnSearchResult[] = []

function escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function getHighlightTerms(query: string) {
    return [...new Set(
        query
            .trim()
            .split(/\s+/)
            .map((term) => term.trim())
            .filter((term) => term.length >= MIN_QUERY_LENGTH)
    )]
}

function highlightText(text: string, query: string): ReactNode {
    const terms = getHighlightTerms(query)
    if (terms.length === 0) {
        return text
    }

    const regex = new RegExp(`(${terms.map(escapeRegex).join("|")})`, "ig")
    const lowerTerms = new Set(terms.map((term) => term.toLowerCase()))

    return text.split(regex).map((part, index) => {
        if (!part) {
            return null
        }

        if (lowerTerms.has(part.toLowerCase())) {
            return (
                <mark
                    key={`${part}-${index}`}
                    className="rounded-sm bg-primary/15 px-0.5 text-foreground"
                >
                    {part}
                </mark>
            )
        }

        return <span key={`${part}-${index}`}>{part}</span>
    })
}

export function LearnSearchBox() {
    const router = useRouter()
    const containerRef = useRef<HTMLDivElement>(null)
    const listboxRef = useRef<HTMLDivElement>(null)
    const searchId = useId()
    const resultsId = `${searchId}-results`
    const helpId = `${searchId}-help`
    const statusId = `${searchId}-status`
    const [query, setQuery] = useState("")
    const [search, setSearch] = useState<{
        query: string
        results: LearnSearchResult[]
        total: number
        status: "idle" | "loading" | "success" | "error"
    }>({ query: "", results: [], total: 0, status: "idle" })
    const [isOpen, setIsOpen] = useState(false)
    const [activeIndex, setActiveIndex] = useState(-1)
    const trimmedQuery = query.trim()
    const isQueryReady = trimmedQuery.length >= MIN_QUERY_LENGTH

    useEffect(() => {
        function handlePointerDown(event: PointerEvent) {
            if (!containerRef.current?.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener("pointerdown", handlePointerDown)
        return () => document.removeEventListener("pointerdown", handlePointerDown)
    }, [])

    useEffect(() => {
        if (!isQueryReady) {
            return
        }

        const controller = new AbortController()
        const timeoutId = window.setTimeout(async () => {
            setSearch({ query: trimmedQuery, results: [], total: 0, status: "loading" })

            try {
                const response = await fetch(`/api/search/learn?q=${encodeURIComponent(trimmedQuery)}`, {
                    signal: controller.signal,
                })
                if (!response.ok) throw new Error("Search unavailable")
                const data = await response.json() as { total: number; results: LearnSearchResult[] }
                if (controller.signal.aborted) return

                setSearch({ query: trimmedQuery, results: data.results, total: data.total, status: "success" })
                setActiveIndex(data.results.length > 0 ? 0 : -1)
            } catch (error) {
                if (!controller.signal.aborted && (error as Error).name !== "AbortError") {
                    setSearch({ query: trimmedQuery, results: [], total: 0, status: "error" })
                    setActiveIndex(-1)
                }
            }
        }, SEARCH_DEBOUNCE_MS)

        return () => {
            controller.abort()
            window.clearTimeout(timeoutId)
        }
    }, [isQueryReady, trimmedQuery])

    const isCurrentQuery = isQueryReady && search.query === trimmedQuery
    const visibleResults = isCurrentQuery ? search.results : EMPTY_RESULTS
    const visibleTotal = isCurrentQuery ? search.total : 0
    const isLoading = isQueryReady && (!isCurrentQuery || search.status === "loading")
    const hasError = isCurrentQuery && search.status === "error"
    const showResults = isOpen && isQueryReady
    const activeResult = showResults ? visibleResults[activeIndex] : undefined
    const statusText = !isQueryReady ? "" : isLoading ? "Searching..." : hasError
        ? "Search is unavailable. Please try again in a moment."
        : visibleTotal === 0 ? "No matches. Try a different topic or concept."
        : visibleTotal > visibleResults.length ? `Showing ${visibleResults.length} of ${visibleTotal} matches`
        : `${visibleTotal} match${visibleTotal === 1 ? "" : "es"}`

    useEffect(() => {
        if (!showResults || activeIndex < 0) return
        const listbox = listboxRef.current
        const option = listbox?.querySelector<HTMLElement>(`[data-result-index="${activeIndex}"]`)
        if (!listbox || !option) return
        const listBounds = listbox.getBoundingClientRect()
        const optionBounds = option.getBoundingClientRect()
        if (optionBounds.top < listBounds.top) {
            listbox.scrollTop -= listBounds.top - optionBounds.top
        } else if (optionBounds.bottom > listBounds.bottom) {
            listbox.scrollTop += optionBounds.bottom - listBounds.bottom
        }
    }, [activeIndex, showResults, visibleResults])

    function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.nativeEvent.isComposing || event.keyCode === 229) return
        if (event.key === "Escape") {
            setIsOpen(false)
            return
        }

        if (visibleResults.length === 0) {
            return
        }

        if (event.key === "ArrowDown") {
            event.preventDefault()
            setIsOpen(true)
            setActiveIndex((current) => (current + 1) % visibleResults.length)
        }

        if (event.key === "ArrowUp") {
            event.preventDefault()
            setIsOpen(true)
            setActiveIndex((current) => (current <= 0 ? visibleResults.length - 1 : current - 1))
        }

        if (event.key === "Enter" && activeResult) {
            event.preventDefault()
            setIsOpen(false)
            router.push(`/learn/${activeResult.slug}`)
        }
    }

    return (
        <div ref={containerRef} className="relative mt-8 max-w-3xl" onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false)
        }}>
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="search"
                    role="combobox"
                    aria-autocomplete="list"
                    value={query}
                    onChange={(event) => {
                        setQuery(event.target.value)
                        setActiveIndex(-1)
                        setIsOpen(true)
                    }}
                    onFocus={() => {
                        if (isQueryReady) {
                            setIsOpen(true)
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Search curriculum"
                    aria-label="Search curriculum"
                    aria-expanded={showResults}
                    aria-controls={showResults ? resultsId : undefined}
                    aria-describedby={`${helpId} ${statusId}`}
                    aria-activedescendant={activeResult ? `${resultsId}-${activeResult.id}` : undefined}
                    className="h-11 rounded-xl border-border/60 bg-card/80 pl-10 pr-4 text-base md:text-sm shadow-sm"
                />
            </div>
            <p id={helpId} className="mt-2 text-xs text-muted-foreground">Search topics, concepts, or lesson text. Use arrow keys to browse and Enter to open a lesson.</p>
            <p id={statusId} role="status" className="sr-only">{statusText}</p>

            {showResults && (
                <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-border/60 bg-background/98 shadow-xl shadow-primary/5 backdrop-blur">
                    <div className="border-b border-border/50 px-4 py-2 text-xs text-muted-foreground">
                        {statusText}
                    </div>

                    <div ref={listboxRef} id={resultsId} role="listbox" aria-label="Matching lessons" aria-busy={isLoading} className="max-h-[min(28rem,50dvh)] overflow-y-auto py-1">
                        {visibleResults.map((result, index) => (
                            <Link
                                key={result.id}
                                id={`${resultsId}-${result.id}`}
                                data-result-index={index}
                                href={`/learn/${result.slug}`}
                                role="option"
                                tabIndex={-1}
                                aria-selected={activeIndex === index}
                                onMouseEnter={() => setActiveIndex(index)}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "block px-4 py-3 transition-colors",
                                    activeIndex === index ? "bg-accent" : "hover:bg-accent/70"
                                )}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium leading-snug text-foreground">
                                            {highlightText(result.title, query)}
                                        </div>
                                        <div className="mt-1 text-xs leading-5 text-muted-foreground">
                                            {highlightText(result.snippet, query)}
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {result.timeEstimate}m
                                    </div>
                                </div>
                                <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                                    <span>{result.section}</span>
                                    <span aria-hidden>•</span>
                                    <span>{result.difficulty}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
