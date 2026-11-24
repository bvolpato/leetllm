"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ArrowDown, ArrowUp, ArrowUpDown, BrainCircuit, CheckCircle2, Circle, Clock3, Code2, Filter, Search, TerminalSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    filterAndSortPracticeProblems,
    nextPracticeSort,
    parsePracticeListState,
    practiceListQueryString,
    practiceProblemHref,
    practiceQueryStringToSearch,
    type PracticeListState,
    type PracticeSortKey,
} from "@/lib/practice-list-state"
import { PRACTICE_LANGUAGES } from "@/lib/practice-languages"
import type { PracticeDifficulty, PracticeListItem } from "@/lib/practice"
import { usePracticeProgress } from "@/components/practice/practice-progress"
import { TheoryQuizPanel } from "@/components/practice/theory-quiz-panel"
import type { RenderedMasteryQuestionNodes } from "@/components/mastery-quiz"
import type { TheoryQuiz } from "@/lib/theory-quizzes"
import { cn } from "@/lib/utils"

const difficultyClass: Record<PracticeDifficulty, string> = {
    Easy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    Medium: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    Hard: "border-red-500/30 bg-red-500/10 text-red-300",
}

const difficultyOrder: Array<PracticeDifficulty | "All"> = ["All", "Easy", "Medium", "Hard"]
type PracticeMode = "quizzes" | "coding"

export function PracticePageClient({
    problems,
    theoryQuizzes,
    renderedQuizzes,
    initialSearch = "",
}: {
    problems: PracticeListItem[]
    theoryQuizzes: TheoryQuiz[]
    renderedQuizzes?: Record<string, RenderedMasteryQuestionNodes[]>
    initialSearch?: string
}) {
    const router = useRouter()
    const pathname = usePathname()
    const [currentSearch, setCurrentSearch] = useState(initialSearch)
    const effectiveSearch = initialSearch || currentSearch
    const searchKey = effectiveSearch
    const [draftQuery, setDraftQuery] = useState<{ source: string; value: string } | null>(null)
    const { isLearned } = usePracticeProgress()

    const categories = useMemo(() => ["All", ...new Set(problems.map((problem) => problem.category))], [problems])
    const initialSearchParams = useMemo(() => new URLSearchParams(effectiveSearch), [effectiveSearch])
    const mode: PracticeMode = initialSearchParams.get("mode") === "coding" ? "coding" : "quizzes"
    const selectedQuizSlug = initialSearchParams.get("quiz")
    const listState = useMemo(() => parsePracticeListState(initialSearchParams, categories), [categories, initialSearchParams])
    const query = draftQuery?.source === searchKey ? draftQuery.value : listState.query
    const effectiveState = useMemo(() => ({ ...listState, query }), [listState, query])
    const originalIndex = useMemo(() => new Map(problems.map((problem, index) => [problem.slug, index])), [problems])
    const learnedCount = useMemo(
        () => problems.filter((problem) => isLearned(problem.slug)).length,
        [isLearned, problems]
    )
    const learnedPct = problems.length > 0 ? Math.round((learnedCount / problems.length) * 100) : 0
    const filtered = useMemo(
        () => filterAndSortPracticeProblems(problems, effectiveState, isLearned),
        [effectiveState, isLearned, problems]
    )

    const counts = useMemo(() => ({
        Easy: problems.filter((problem) => problem.difficulty === "Easy").length,
        Medium: problems.filter((problem) => problem.difficulty === "Medium").length,
        Hard: problems.filter((problem) => problem.difficulty === "Hard").length,
    }), [problems])

    useEffect(() => {
        if (initialSearch) return

        function syncCurrentSearch() {
            setCurrentSearch(practiceQueryStringToSearch(window.location.search))
        }

        syncCurrentSearch()
        window.addEventListener("popstate", syncCurrentSearch)
        return () => window.removeEventListener("popstate", syncCurrentSearch)
    }, [initialSearch])

    function updateState(patch: Partial<PracticeListState>) {
        const next = { ...effectiveState, ...patch }
        const queryString = withMode(practiceListQueryString(next), "coding")

        if (patch.query !== undefined) setDraftQuery({ source: searchKey, value: patch.query })
        setCurrentSearch(practiceQueryStringToSearch(queryString))
        router.replace(`${pathname}${queryString}`, { scroll: false })
    }

    function withMode(queryString: string, nextMode: PracticeMode) {
        const params = new URLSearchParams(queryString.startsWith("?") ? queryString.slice(1) : queryString)
        if (nextMode === "coding") {
            params.set("mode", "coding")
        } else {
            params.delete("mode")
        }
        const query = params.toString()
        return query ? `?${query}` : ""
    }

    function setMode(nextMode: PracticeMode) {
        const queryString = withMode(practiceListQueryString(effectiveState), nextMode)
        setCurrentSearch(practiceQueryStringToSearch(queryString))
        router.replace(`${pathname}${queryString}`, { scroll: false })
    }

    function sortBy(sort: PracticeSortKey) {
        updateState(nextPracticeSort(effectiveState, sort))
    }

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
            <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                        {mode === "quizzes" ? <BrainCircuit className="h-3.5 w-3.5" /> : <TerminalSquare className="h-3.5 w-3.5" />}
                        {mode === "quizzes" ? "Theory quizzes" : "Python 3 + Java"}
                    </div>
                    <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Practice</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        {mode === "quizzes"
                            ? "Global concept checks for LLM engineering, retrieval, agents, training, inference, and AI platform judgment."
                            : "Coding drills for AI systems interviews: state, queues, caches, schedulers, parsers, rate limits, and production invariants."}
                    </p>
                </div>
                <div className="grid gap-3 sm:w-[360px]">
                    <div role="group" className="inline-flex h-10 rounded-lg border border-border bg-background p-1" aria-label="Practice mode">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-pressed={mode === "quizzes"}
                            className={cn("h-8 flex-1 gap-2 text-sm", mode === "quizzes" && "bg-accent text-accent-foreground")}
                            onClick={() => setMode("quizzes")}
                        >
                            <BrainCircuit className="h-4 w-4" />
                            Quizzes
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-pressed={mode === "coding"}
                            className={cn("h-8 flex-1 gap-2 text-sm", mode === "coding" && "bg-accent text-accent-foreground")}
                            onClick={() => setMode("coding")}
                        >
                            <TerminalSquare className="h-4 w-4" />
                            Coding
                        </Button>
                    </div>
                    {mode === "coding" && (
                        <div className="grid grid-cols-3 gap-2">
                            {(["Easy", "Medium", "Hard"] as const).map((level) => (
                                <div key={level} className="rounded-lg border border-border/50 bg-card/60 p-3 text-center">
                                    <div className="text-lg font-semibold">{counts[level]}</div>
                                    <div className="text-xs text-muted-foreground">{level}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </header>

            {mode === "quizzes" ? (
                <TheoryQuizPanel
                    key={selectedQuizSlug ?? "quiz-list"}
                    quizzes={theoryQuizzes}
                    renderedQuizzes={renderedQuizzes}
                    initialQuizSlug={selectedQuizSlug}
                />
            ) : (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
                    <section className="min-w-0">
                        <div className="mt-8 rounded-lg border border-border/50 bg-card/50">
                            <div className="border-b border-border/50 p-4">
                                <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
                                    <label className="relative block">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            aria-label="Search problems"
                                            value={query}
                                            onChange={(event) => updateState({ query: event.target.value })}
                                            placeholder="Search problems"
                                            className="pl-9"
                                        />
                                    </label>
                                    <SegmentedFilter
                                        label="Difficulty"
                                        options={difficultyOrder}
                                        value={listState.difficulty}
                                        onChange={(value) => updateState({ difficulty: value as PracticeDifficulty | "All" })}
                                    />
                                    <select
                                        aria-label="Category"
                                        className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                                        value={listState.category}
                                        onChange={(event) => updateState({ category: event.target.value })}
                                    >
                                        {categories.map((item) => <option key={item}>{item}</option>)}
                                    </select>
                                    <SegmentedFilter
                                        label="Status"
                                        options={["All", "Open", "Learned"]}
                                        value={listState.status}
                                        onChange={(value) => updateState({ status: value as "All" | "Open" | "Learned" })}
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[740px] text-sm">
                                    <thead className="border-b border-border/50 text-xs uppercase tracking-wide text-muted-foreground">
                                        <tr>
                                            <SortableHeader label="#" sortKey="roadmap" state={listState} onSort={sortBy} className="w-16" />
                                            <SortableHeader label="Problem" sortKey="title" state={listState} onSort={sortBy} />
                                            <SortableHeader label="Difficulty" sortKey="difficulty" state={listState} onSort={sortBy} />
                                            <SortableHeader label="Category" sortKey="category" state={listState} onSort={sortBy} />
                                            <SortableHeader label="Tests" sortKey="tests" state={listState} onSort={sortBy} />
                                            <SortableHeader label="Time" sortKey="time" state={listState} onSort={sortBy} />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((problem) => (
                                            <tr key={problem.slug} className="border-b border-border/30 last:border-0 hover:bg-accent/30">
                                                <td className="px-4 py-3 text-xs tabular-nums text-muted-foreground">
                                                    {(originalIndex.get(problem.slug) ?? 0) + 1}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Link href={practiceProblemHref(problem.slug, effectiveState)} className="group block">
                                                        <div className="flex items-center gap-2">
                                                            <span className="sr-only">{isLearned(problem.slug) ? "Learned" : "Open"}:</span>
                                                            {isLearned(problem.slug) ? (
                                                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                                                            ) : (
                                                                <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/45" aria-hidden="true" />
                                                            )}
                                                            <div className="font-medium text-foreground group-hover:text-primary">{problem.title}</div>
                                                        </div>
                                                        <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">{problem.summary}</div>
                                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                                            {problem.tags.slice(0, 3).map((tag) => (
                                                                <span key={tag} className="rounded-md bg-muted/50 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className={difficultyClass[problem.difficulty]}>
                                                        {problem.difficulty}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{problem.category}</td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {problem.sampleTestCount} sample / {problem.hiddenTestCount} hidden
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <Clock3 className="h-3.5 w-3.5" />
                                                        {problem.timeEstimateMinutes}m
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                        {filtered.length === 0 && (
                            <div className="flex flex-col items-center gap-3 px-4 py-14 text-center">
                                <Filter className="h-8 w-8 text-muted-foreground/60" />
                                <div>
                                    <p className="font-medium">No problems match filters</p>
                                    <p className="mt-1 text-sm text-muted-foreground">Clear a filter or search for another topic.</p>
                                </div>
                            </div>
                        )}
                        </div>
                    </section>

                    <aside className="space-y-4">
                        <div className="rounded-lg border border-border/50 bg-card/60 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    Progress
                                </div>
                                <span className="text-xs text-muted-foreground">{learnedCount}/{problems.length}</span>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted/30">
                                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${learnedPct}%` }} />
                            </div>
                        </div>
                        <div className="rounded-lg border border-border/50 bg-card/60 p-4">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <Code2 className="h-4 w-4 text-primary" />
                                Runtime
                            </div>
                            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center justify-between">
                                    <span>Language</span>
                                    <span className="text-foreground">{Object.values(PRACTICE_LANGUAGES).map((language) => language.label).join(" / ")}</span>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-emerald-300">
                                <CheckCircle2 className="h-4 w-4" />
                                Interview Loop
                            </div>
                            <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                Clarify behavior, pass sample tests, submit hidden tests, then read follow-ups and invariants.
                            </p>
                        </div>
                    </aside>
                </div>
            )}
        </div>
    )
}

function SortableHeader({
    label,
    sortKey,
    state,
    onSort,
    className,
}: {
    label: string
    sortKey: PracticeSortKey
    state: PracticeListState
    onSort: (sort: PracticeSortKey) => void
    className?: string
}) {
    const active = state.sort === sortKey
    const Icon = active ? state.direction === "asc" ? ArrowUp : ArrowDown : ArrowUpDown

    return (
        <th className={cn("px-4 py-3 text-left", className)} aria-sort={active ? state.direction === "asc" ? "ascending" : "descending" : "none"}>
            <button
                type="button"
                className={cn(
                    "inline-flex items-center gap-1.5 rounded px-1 py-0.5 transition-colors hover:bg-muted hover:text-foreground",
                    active && "text-foreground"
                )}
                onClick={() => onSort(sortKey)}
            >
                {label}
                <Icon className="h-3.5 w-3.5" />
            </button>
        </th>
    )
}

function SegmentedFilter({
    label,
    options,
    value,
    onChange,
}: {
    label: string
    options: string[]
    value: string
    onChange: (value: string) => void
}) {
    return (
        <div role="group" className="inline-flex h-9 items-center rounded-md border border-border bg-background p-0.5" aria-label={label}>
            {options.map((option) => (
                <Button
                    key={option}
                    type="button"
                    variant="ghost"
                    size="xs"
                    aria-pressed={value === option}
                    className={cn(
                        "h-7 px-2 text-xs",
                        value === option && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => onChange(option)}
                >
                    {option}
                </Button>
            ))}
        </div>
    )
}
