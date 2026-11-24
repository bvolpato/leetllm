"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { MouseEvent as ReactMouseEvent } from "react"
import Link from "next/link"
import { ArrowDownAZ, ArrowUp, BarChart3, BookOpen, CircleHelp, Code2, Search } from "lucide-react"
import { CopyMarkdownButton } from "@/components/copy-markdown-button"
import { GlossaryMarkdown } from "@/components/glossary-markdown"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getGlossaryImportanceLevel } from "@/lib/glossary-importance"
import { getGlossarySummaries, useGlossaryEntry } from "@/lib/glossary-client"
import type { GlossaryEntryWithId, GlossarySummary } from "@/lib/glossary"

type SortMode = "alpha" | "importance"

type GlossaryPageClientProps = {
    initialEntry: GlossaryEntryWithId
}

function entryHref(id: string) {
    return `/glossary#${encodeURIComponent(id)}`
}

function decodeUrlToken(value: string) {
    try {
        return decodeURIComponent(value)
    } catch {
        return value
    }
}

function locationEntryId(entriesById: Map<string, GlossarySummary>) {
    if (typeof window === "undefined") return null

    const hashId = decodeUrlToken(window.location.hash.replace(/^#/, "")).trim()
    if (hashId && entriesById.has(hashId)) return hashId

    const termParam = new URLSearchParams(window.location.search).get("term")
    if (termParam && entriesById.has(termParam)) return termParam

    return null
}

function plainLeftClick(event: ReactMouseEvent<HTMLAnchorElement>) {
    return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}

function scrollTermIntoSidebar(container: HTMLElement, term: HTMLElement) {
    const padding = 8
    const visibleTop = container.scrollTop
    const visibleBottom = visibleTop + container.clientHeight
    const containerRect = container.getBoundingClientRect()
    const termRect = term.getBoundingClientRect()
    const termTop = termRect.top - containerRect.top + container.scrollTop
    const termBottom = termTop + term.offsetHeight

    if (termTop < visibleTop + padding) {
        container.scrollTo({ top: Math.max(0, termTop - padding), behavior: "auto" })
        return
    }

    if (termBottom > visibleBottom - padding) {
        container.scrollTo({ top: termBottom - container.clientHeight + padding, behavior: "auto" })
    }
}

function DetailSection({
    title,
    content,
    entryId,
    onNavigateTerm,
}: {
    title: string
    content?: string
    entryId?: string
    onNavigateTerm?: (event: ReactMouseEvent<HTMLAnchorElement>, id: string) => void
}) {
    if (!content) return null

    return (
        <section className="border-t border-border/50 pt-4">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
            <GlossaryMarkdown
                content={content}
                entryId={entryId}
                onNavigateTerm={onNavigateTerm}
                className="text-base leading-7 [color:var(--reading-ink)] [&_table]:text-base"
            />
        </section>
    )
}

function normalize(text: string) {
    return text.toLowerCase().trim()
}

function matchesQuery(entry: GlossarySummary, query: string) {
    if (!query) return true

    return [
        entry.title,
        entry.aliases?.join(" ") ?? "",
    ]
        .join(" ")
        .toLowerCase()
        .includes(query)
}

function ImportancePill({ importance }: { importance: number }) {
    const level = getGlossaryImportanceLevel(importance)

    return (
        <Badge
            variant="outline"
            className={["border text-[0.7rem] font-semibold", level.className].join(" ")}
            aria-label={`Importance: ${level.label}`}
        >
            {level.label}
        </Badge>
    )
}

function groupedByImportance(entries: GlossarySummary[]) {
    return entries.reduce<Array<{ label: string; className: string; entries: GlossarySummary[] }>>((groups, entry) => {
        const level = getGlossaryImportanceLevel(entry.importance)
        const current = groups[groups.length - 1]

        if (current?.label === level.label) {
            current.entries.push(entry)
            return groups
        }

        groups.push({ label: level.label, className: level.className, entries: [entry] })
        return groups
    }, [])
}

function termCountLabel(count: number) {
    return `${count} ${count === 1 ? "term" : "terms"}`
}

function GlossaryTermLink({
    entry,
    selected,
    showImportance,
    setSelectedTermRef,
    onClick,
}: {
    entry: GlossarySummary
    selected: boolean
    showImportance: boolean
    setSelectedTermRef: (id: string, element: HTMLAnchorElement | null) => void
    onClick: (event: ReactMouseEvent<HTMLAnchorElement>, id: string) => void
}) {
    return (
        <a
            ref={(element) => setSelectedTermRef(entry.id, element)}
            href={entryHref(entry.id)}
            onClick={(event) => onClick(event, entry.id)}
            aria-current={selected ? "true" : undefined}
            className={[
                "flex w-full items-start justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                selected
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            ].join(" ")}
        >
            <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                <span className={entry.kind === "code" ? "min-w-0 max-w-full [overflow-wrap:break-word] font-mono text-[0.9em]" : "min-w-0 max-w-full [overflow-wrap:break-word] font-medium"}>
                    {entry.title}
                </span>
                {showImportance && <ImportancePill importance={entry.importance} />}
            </span>
            {entry.kind === "code" && <Code2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
        </a>
    )
}

export function GlossaryPageClient({
    initialEntry,
}: GlossaryPageClientProps) {
    const alphabeticalEntries = getGlossarySummaries()
    const [sortMode, setSortMode] = useState<SortMode>("alpha")
    const [query, setQuery] = useState("")
    const queryRef = useRef("")
    const [searchResult, setSearchResult] = useState<{ query: string; ids: string[]; error?: string }>({ query: "", ids: [] })
    const matchedQueryRef = useRef({ query: "", ids: [] as string[] })
    const pendingLocationQueryRef = useRef<{ query: string; id: string } | null>(null)
    const [searchAttempt, setSearchAttempt] = useState(0)
    const [selectedId, setSelectedId] = useState<string>(alphabeticalEntries[0]?.id ?? "")
    const termListRef = useRef<HTMLElement>(null)
    const termBrowserRef = useRef<HTMLElement>(null)
    const searchRef = useRef<HTMLInputElement>(null)
    const detailHeadingRef = useRef<HTMLHeadingElement>(null)
    const selectedTermRefs = useRef(new Map<string, HTMLAnchorElement>())
    const entriesById = useMemo(
        () => new Map<string, GlossarySummary>(alphabeticalEntries.map((entry) => [entry.id, entry])),
        [alphabeticalEntries],
    )
    const importanceEntries = useMemo(() => [...alphabeticalEntries]
        .sort((left, right) => right.importance - left.importance || left.title.localeCompare(right.title)), [alphabeticalEntries])
    const orderedEntries = sortMode === "alpha" ? alphabeticalEntries : importanceEntries
    const normalizedQuery = normalize(query)
    const searching = Boolean(normalizedQuery && searchResult.query !== normalizedQuery)
    const searchIds = searchResult.query === normalizedQuery && !searchResult.error ? new Set(searchResult.ids) : undefined
    const filteredEntries = orderedEntries.filter((entry) => !normalizedQuery || (searchIds ? searchIds.has(entry.id) : matchesQuery(entry, normalizedQuery)))
    const importanceGroups = groupedByImportance(filteredEntries)
    const selectedSummary =
        filteredEntries.find((entry) => entry.id === selectedId) ?? filteredEntries[0]
    const { entry: selectedEntry, error: definitionError, retry: retryDefinition } = useGlossaryEntry(selectedSummary?.id ?? "", Boolean(selectedSummary), initialEntry)
    const defaultEntryId = alphabeticalEntries[0]?.id ?? ""

    const selectedVisible = Boolean(selectedSummary && filteredEntries.some((entry) => entry.id === selectedSummary.id))

    const updateQuery = useCallback((value: string) => {
        queryRef.current = value
        pendingLocationQueryRef.current = null
        setQuery(value)
    }, [])

    useEffect(() => {
        if (!normalizedQuery) return
        const controller = new AbortController()
        const timer = window.setTimeout(() => {
            fetch(`/api/glossary?q=${encodeURIComponent(normalizedQuery)}`, {
                signal: controller.signal,
                headers: { Accept: "application/json" },
            }).then(async (response) => {
                if (!response.ok) throw new Error("Search unavailable.")
                const ids: string[] = await response.json()
                if (!controller.signal.aborted) {
                    matchedQueryRef.current = { query: normalizedQuery, ids }
                    setSearchResult({ query: normalizedQuery, ids })
                    const pending = pendingLocationQueryRef.current
                    if (pending?.query === normalizedQuery) {
                        pendingLocationQueryRef.current = null
                        if (!ids.includes(pending.id)) updateQuery("")
                    }
                }
            }).catch(() => {
                if (!controller.signal.aborted) setSearchResult({ query: normalizedQuery, ids: [], error: "Search unavailable. Showing title and alias matches." })
            })
        }, 200)
        return () => {
            window.clearTimeout(timer)
            controller.abort()
        }
    }, [normalizedQuery, searchAttempt, updateQuery])

    const setSelectedTermRef = useCallback((id: string, element: HTMLAnchorElement | null) => {
        if (element) {
            selectedTermRefs.current.set(id, element)
            return
        }

        selectedTermRefs.current.delete(id)
    }, [])

    const scrollDetailIntoView = useCallback((focusHeading = false) => {
        if (typeof window === "undefined") return

        requestAnimationFrame(() => {
            if (focusHeading) detailHeadingRef.current?.focus({ preventScroll: true })
            document.getElementById("glossary-detail")?.scrollIntoView({ block: "start" })
        })
    }, [])

    const selectEntry = useCallback((id: string, options?: { updateUrl?: boolean; scrollDetail?: boolean; clearSearch?: boolean }) => {
        const entry = entriesById.get(id)
        if (!entry) return

        pendingLocationQueryRef.current = null
        if (options?.clearSearch) {
            updateQuery("")
        }

        setSelectedId(id)

        if (options?.updateUrl && typeof window !== "undefined") {
            const href = entryHref(id)
            const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`
            if (currentUrl !== href) {
                window.history.pushState({ glossaryEntryId: id }, "", href)
            }
        }

        if (options?.scrollDetail) {
            scrollDetailIntoView(true)
        }
    }, [entriesById, scrollDetailIntoView, updateQuery])

    const handleEntryLinkClick = useCallback((
        event: ReactMouseEvent<HTMLAnchorElement>,
        id: string,
        options?: { scrollDetail?: boolean; clearSearch?: boolean },
    ) => {
        if (!plainLeftClick(event)) return

        event.preventDefault()
        selectEntry(id, {
            updateUrl: true,
            scrollDetail: options?.scrollDetail,
            clearSearch: options?.clearSearch,
        })
    }, [selectEntry])

    const handleLinkedTermNavigation = useCallback((event: ReactMouseEvent<HTMLAnchorElement>, id: string) => {
        handleEntryLinkClick(event, id, { scrollDetail: true, clearSearch: true })
    }, [handleEntryLinkClick])

    const returnToTerms = useCallback(() => {
        searchRef.current?.focus({ preventScroll: true })
        termBrowserRef.current?.scrollIntoView({ block: "start" })
    }, [])

    useEffect(() => {
        function syncSelectedEntryFromLocation() {
            const linkedId = locationEntryId(entriesById)
            pendingLocationQueryRef.current = null
            if (!linkedId) {
                setSelectedId(defaultEntryId)
                return
            }

            setSelectedId(linkedId)
            const linkedEntry = entriesById.get(linkedId)
            const normalized = normalize(queryRef.current)
            if (linkedEntry && normalized && !matchesQuery(linkedEntry, normalized)) {
                if (matchedQueryRef.current.query === normalized) {
                    if (!matchedQueryRef.current.ids.includes(linkedId)) updateQuery("")
                } else {
                    pendingLocationQueryRef.current = { query: normalized, id: linkedId }
                }
            }
            scrollDetailIntoView()
        }

        syncSelectedEntryFromLocation()
        window.addEventListener("hashchange", syncSelectedEntryFromLocation)
        window.addEventListener("popstate", syncSelectedEntryFromLocation)

        return () => {
            window.removeEventListener("hashchange", syncSelectedEntryFromLocation)
            window.removeEventListener("popstate", syncSelectedEntryFromLocation)
        }
    }, [defaultEntryId, entriesById, scrollDetailIntoView, updateQuery])

    useEffect(() => {
        if (!selectedSummary || !selectedVisible) return

        requestAnimationFrame(() => {
            const container = termListRef.current
            const selectedTerm = selectedTermRefs.current.get(selectedSummary.id)
            if (container && selectedTerm) {
                scrollTermIntoSidebar(container, selectedTerm)
            }
        })
    }, [selectedSummary, selectedVisible, sortMode, normalizedQuery])

    return (
        <div className="learn-reading-page mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <div className="mb-8 max-w-3xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                    <BookOpen className="h-4 w-4" />
                    {alphabeticalEntries.length} study terms
                </div>
                <h1 className="mb-3 text-4xl font-bold tracking-tight sm:text-5xl">Glossary</h1>
                <p className="max-w-2xl text-base leading-relaxed [color:var(--reading-muted)] sm:text-lg">
                    Browse AI, ML, and LLM terms with intuition, examples, decision rules, common mistakes, and related terms.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                <aside ref={termBrowserRef} className="min-w-0 scroll-mt-24 lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)]">
                    <div className="space-y-4 rounded-lg border border-border/70 bg-card/70 p-4 shadow-sm">
                        <div>
                            <label htmlFor="glossary-search" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Search terms
                            </label>
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    ref={searchRef}
                                    id="glossary-search"
                                    value={query}
                                    maxLength={200}
                                    onChange={(event) => updateQuery(event.target.value)}
                                    className="pl-9"
                                    placeholder="RAG, gradient, KV cache..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Sort glossary terms">
                            <Button
                                type="button"
                                variant={sortMode === "alpha" ? "default" : "outline"}
                                size="sm"
                                className="gap-2"
                                aria-pressed={sortMode === "alpha"}
                                onClick={() => setSortMode("alpha")}
                            >
                                <ArrowDownAZ className="h-4 w-4" />
                                A-Z
                            </Button>
                            <Button
                                type="button"
                                variant={sortMode === "importance" ? "default" : "outline"}
                                size="sm"
                                className="gap-2"
                                aria-pressed={sortMode === "importance"}
                                onClick={() => setSortMode("importance")}
                            >
                                <BarChart3 className="h-4 w-4" />
                                Relevance
                            </Button>
                        </div>

                        <p role="status" aria-atomic="true" className="text-xs text-muted-foreground">
                            {searching ? "Searching definitions..." : `Showing ${filteredEntries.length} of ${alphabeticalEntries.length} terms.`}
                        </p>
                        {searchResult.query === normalizedQuery && searchResult.error && (
                            <p role="alert" className="text-xs text-muted-foreground">
                                {searchResult.error} <button type="button" className="text-primary underline" onClick={() => setSearchAttempt((value) => value + 1)}>Try again</button>
                            </p>
                        )}

                        <nav
                            aria-label="Glossary terms"
                            ref={termListRef}
                            className="max-h-[240px] space-y-1 overflow-y-auto pr-1 sm:max-h-[360px] lg:max-h-[calc(100vh-19rem)]"
                        >
                            {sortMode === "importance" ? (
                                importanceGroups.map((group) => (
                                    <section key={group.label} className="space-y-1">
                                        <div
                                            className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-card/95 px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur"
                                            aria-label={`${group.label}: ${termCountLabel(group.entries.length)}`}
                                        >
                                            <span className={["rounded-full border px-2 py-0.5 normal-case tracking-normal", group.className].join(" ")}>
                                                {group.label}
                                            </span>
                                            <span>{termCountLabel(group.entries.length)}</span>
                                        </div>
                                        {group.entries.map((entry) => (
                                            <GlossaryTermLink
                                                key={entry.id}
                                                entry={entry}
                                                selected={entry.id === selectedSummary?.id}
                                                showImportance={false}
                                                setSelectedTermRef={setSelectedTermRef}
                                                onClick={(event, id) => handleEntryLinkClick(event, id, {
                                                    scrollDetail: typeof window !== "undefined" && window.innerWidth < 1024,
                                                })}
                                            />
                                        ))}
                                    </section>
                                ))
                            ) : (
                                filteredEntries.map((entry) => (
                                    <GlossaryTermLink
                                        key={entry.id}
                                        entry={entry}
                                        selected={entry.id === selectedSummary?.id}
                                        showImportance
                                        setSelectedTermRef={setSelectedTermRef}
                                        onClick={(event, id) => handleEntryLinkClick(event, id, {
                                            scrollDetail: typeof window !== "undefined" && window.innerWidth < 1024,
                                        })}
                                    />
                                ))
                            )}
                        </nav>
                    </div>
                </aside>

                <section id="glossary-detail" className="min-w-0 scroll-mt-24" aria-label="Selected glossary term">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="sticky top-24 z-10 mb-3 gap-2 bg-background shadow-sm lg:hidden"
                        onClick={returnToTerms}
                    >
                        <ArrowUp className="h-4 w-4" aria-hidden="true" />
                        Back to terms
                    </Button>
                    {selectedSummary ? (
                        <article className="rounded-xl border [border-color:var(--reading-border)] [background:var(--reading-panel)] p-6 shadow-sm sm:p-7">
                            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                                <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                                    <h2 ref={detailHeadingRef} tabIndex={-1} className={["max-w-full rounded-sm [overflow-wrap:break-word] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50", selectedSummary.kind === "code" ? "font-mono text-2xl font-semibold tracking-tight sm:text-3xl" : "text-3xl font-semibold tracking-tight sm:text-4xl"].join(" ")}>
                                        {selectedSummary.title}
                                    </h2>
                                    <ImportancePill importance={selectedSummary.importance} />
                                    <div className="flex items-center gap-2">
                                        {selectedSummary.kind === "code" && (
                                            <Badge variant="outline" className="gap-1.5">
                                                <Code2 className="h-3.5 w-3.5" />
                                                code
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <CopyMarkdownButton slug={selectedSummary.id} />
                            </div>

                            {selectedSummary.aliases?.length ? (
                                <p className="mb-5 text-sm text-muted-foreground">
                                    Also known as {selectedSummary.aliases.join(", ")}.
                                </p>
                            ) : null}

                            <div className="space-y-4">
                                {selectedEntry ? <>
                                <section>
                                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Definition</h3>
                                    <GlossaryMarkdown
                                        content={selectedEntry.definition}
                                        entryId={selectedEntry.id}
                                        onNavigateTerm={handleLinkedTermNavigation}
                                        className="text-base leading-7 [color:var(--reading-ink)] [&_table]:text-base"
                                    />
                                </section>
                                <DetailSection title="Intuition" content={selectedEntry.intuition} entryId={selectedEntry.id} onNavigateTerm={handleLinkedTermNavigation} />
                                <DetailSection title="Example" content={selectedEntry.example} entryId={selectedEntry.id} onNavigateTerm={handleLinkedTermNavigation} />
                                <DetailSection title="Formula" content={selectedEntry.formula} entryId={selectedEntry.id} onNavigateTerm={handleLinkedTermNavigation} />
                                {selectedEntry.details?.map((detail) => (
                                    <DetailSection
                                        key={`${selectedEntry.id}-${detail.title}`}
                                        title={detail.title}
                                        content={detail.content}
                                        entryId={selectedEntry.id}
                                        onNavigateTerm={handleLinkedTermNavigation}
                                    />
                                ))}
                                <DetailSection title="Decision rule" content={selectedEntry.decisionRule} entryId={selectedEntry.id} onNavigateTerm={handleLinkedTermNavigation} />
                                <DetailSection title="Common mistake" content={selectedEntry.pitfall} entryId={selectedEntry.id} onNavigateTerm={handleLinkedTermNavigation} />
                                <DetailSection title="Why it matters here" content={selectedEntry.relevance} entryId={selectedEntry.id} onNavigateTerm={handleLinkedTermNavigation} />

                                {selectedEntry.related && selectedEntry.related.length > 0 && (
                                    <section className="border-t border-border/50 pt-4">
                                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Related terms</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedEntry.related.map((related) => (
                                                <Button
                                                    key={related.id}
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                    className="h-auto min-h-9 max-w-full gap-2 whitespace-normal [overflow-wrap:anywhere]"
                                                >
                                                    <a
                                                        href={entryHref(related.id)}
                                                        onClick={(event) => handleEntryLinkClick(event, related.id, {
                                                            scrollDetail: true,
                                                            clearSearch: true,
                                                        })}
                                                    >
                                                        <CircleHelp className="h-3.5 w-3.5" />
                                                        {related.title}
                                                    </a>
                                                </Button>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {selectedEntry.usage && selectedEntry.usage.length > 0 && (
                                    <section className="border-t border-border/50 pt-4">
                                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Where it appears</h3>
                                        <div className="grid gap-3 md:grid-cols-3">
                                            {selectedEntry.usage.map((item) => (
                                                <Link
                                                    key={`${item.url}-${item.excerpt}`}
                                                    href={item.url}
                                                    className="rounded-lg border border-border/60 bg-background/50 p-3 text-sm transition-colors hover:border-primary/35 hover:bg-primary/5"
                                                >
                                                    <span className="font-medium text-primary">{item.title}</span>
                                                    <span className="mt-1 line-clamp-3 block text-xs leading-relaxed text-muted-foreground">
                                                        {item.excerpt}
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {selectedEntry.code &&
                                    ![
                                        selectedEntry.definition,
                                        selectedEntry.example,
                                        selectedEntry.formula,
                                        selectedEntry.intuition,
                                        selectedEntry.decisionRule,
                                        selectedEntry.pitfall,
                                        selectedEntry.relevance,
                                        ...(selectedEntry.details?.map((detail) => detail.content) ?? []),
                                    ]
                                        .filter(Boolean)
                                        .some((section) => section!.includes("```")) && (
                                    <section className="border-t border-border/50 pt-4">
                                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Code example</h3>
                                        <GlossaryMarkdown
                                            entryId={selectedEntry.id}
                                            content={`\`\`\`${selectedEntry.code.language} title="${selectedEntry.code.title}"\n${selectedEntry.code.source.trimEnd()}\n\`\`\``}
                                            className="text-sm leading-relaxed [color:var(--reading-ink)]"
                                        />
                                    </section>
                                )}
                                </> : definitionError ? (
                                    <div role="alert">
                                        <p>{definitionError}</p>
                                        <Button type="button" variant="outline" onClick={retryDefinition}>Try again</Button>
                                    </div>
                                ) : <p role="status">Loading definition...</p>}
                            </div>
                        </article>
                    ) : (
                        <div className="rounded-lg border border-border/70 bg-card/55 p-8 text-center">
                            <h2 className="text-xl font-semibold">{searching ? "Searching definitions..." : "No matching terms"}</h2>
                            {!searching && <p className="mt-2 text-sm text-muted-foreground">Try a broader search.</p>}
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}
