"use client"

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react"
import { ArrowLeft, Award, Check, CheckCircle2, CircleAlert, Clock3, ListChecks, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlossaryMarkdownSpan } from "@/components/glossary-markdown-span"
import type { RenderedMasteryQuestionNodes } from "@/components/mastery-quiz"
import { cn } from "@/lib/utils"
import type { TheoryQuiz, TheoryQuizLevel } from "@/lib/theory-quizzes"
import { trackEvent } from "@/lib/analytics"
import { recordLocalQuizAttempt, removeLocalQuizAttempt, syncStudyAction } from "@/lib/study-state"
import { isPassingQuizScore, QUIZ_PASS_PERCENT } from "@/lib/mastery-quiz"

const GLOSSARY_SPAN_PATTERN = /<span\s+data-glossary="([^"]+)">([^<]*)<\/span>/g

function FallbackInlineText({ text }: { text: string }) {
    if (!text.includes("data-glossary=")) {
        return <>{text}</>
    }
    const parts: ReactNode[] = []
    let lastIndex = 0
    for (const match of text.matchAll(GLOSSARY_SPAN_PATTERN)) {
        const matchIndex = match.index ?? 0
        if (matchIndex > lastIndex) {
            parts.push(<Fragment key={`t-${lastIndex}`}>{text.slice(lastIndex, matchIndex)}</Fragment>)
        }
        parts.push(
            <GlossaryMarkdownSpan key={`g-${matchIndex}`} data-glossary={match[1]}>
                {match[2]}
            </GlossaryMarkdownSpan>,
        )
        lastIndex = matchIndex + match[0].length
    }
    if (lastIndex < text.length) {
        parts.push(<Fragment key={`t-${lastIndex}`}>{text.slice(lastIndex)}</Fragment>)
    }
    return <>{parts}</>
}

const SCORE_KEY = "leetllm_theory_quiz_scores"
const SCORE_EVENT = "leetllm_theory_quiz_scores_changed"
const COMPLETE_KEY = "leetllm_completed_theory_quizzes"

type TheoryQuizResult = {
    correct: number
    total: number
    score: number
    passed: boolean
    attempts: number
}

const emptyScoreResults: Record<string, TheoryQuizResult> = {}
let scoreSnapshotRaw: string | null = null
let scoreSnapshot: Record<string, TheoryQuizResult> = emptyScoreResults

const levelClass: Record<TheoryQuizLevel, string> = {
    Beginner: "border-emerald-600/30 bg-emerald-500/15 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    Intermediate: "border-sky-600/30 bg-sky-500/15 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
    Advanced: "border-amber-600/35 bg-amber-500/15 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
    Expert: "border-fuchsia-600/30 bg-fuchsia-500/15 text-fuchsia-700 dark:border-fuchsia-500/30 dark:bg-fuchsia-500/10 dark:text-fuchsia-300",
}

function readJsonRecord<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback
    try {
        return JSON.parse(localStorage.getItem(key) ?? "") as T
    } catch {
        return fallback
    }
}

function readScoreResults() {
    const stored = readJsonRecord<Record<string, TheoryQuizResult>>(SCORE_KEY, {})
    return Object.fromEntries(Object.entries(stored).map(([slug, result]) => [
        slug,
        { ...result, passed: isPassingQuizScore(result.score) },
    ]))
}

function getScoreResultsSnapshot() {
    if (typeof window === "undefined") return emptyScoreResults

    const raw = localStorage.getItem(SCORE_KEY) ?? ""
    if (raw === scoreSnapshotRaw) return scoreSnapshot

    scoreSnapshotRaw = raw
    try {
        const stored = raw ? JSON.parse(raw) as Record<string, TheoryQuizResult> : emptyScoreResults
        scoreSnapshot = Object.fromEntries(Object.entries(stored).map(([slug, result]) => [
            slug,
            { ...result, passed: isPassingQuizScore(result.score) },
        ]))
    } catch {
        scoreSnapshot = emptyScoreResults
    }
    return scoreSnapshot
}

function getServerScoreResultsSnapshot() {
    return emptyScoreResults
}

function subscribeScoreResults(onStoreChange: () => void) {
    if (typeof window === "undefined") return () => { }

    function handleStorage(event: StorageEvent) {
        if (event.key === SCORE_KEY) onStoreChange()
    }

    function handleLocalChange() {
        onStoreChange()
    }

    window.addEventListener("storage", handleStorage)
    window.addEventListener(SCORE_EVENT, handleLocalChange)
    return () => {
        window.removeEventListener("storage", handleStorage)
        window.removeEventListener(SCORE_EVENT, handleLocalChange)
    }
}

function saveScoreResult(slug: string, result: TheoryQuizResult) {
    const stored = readScoreResults()
    const previous = stored[slug]
    stored[slug] = previous && previous.score > result.score
        ? { ...previous, attempts: result.attempts }
        : result
    localStorage.setItem(SCORE_KEY, JSON.stringify(stored))
    window.dispatchEvent(new Event(SCORE_EVENT))
}

function getCompletedQuizzes(): string[] {
    return readJsonRecord<string[]>(COMPLETE_KEY, [])
}

function setCompletedQuizzes(slugs: string[]) {
    if (typeof window === "undefined") return
    localStorage.setItem(COMPLETE_KEY, JSON.stringify(slugs))
}

function useTheoryQuizProgress() {
    const [completedSlugs, setCompletedSlugs] = useState<string[]>([])

    useEffect(() => {
        const passingStored = Object.entries(readScoreResults())
            .filter(([, result]) => result.passed)
            .map(([slug]) => slug)
        const local = [...new Set([...getCompletedQuizzes(), ...passingStored])]
        setCompletedQuizzes(local)
        if (local.length > 0) {
            queueMicrotask(() => setCompletedSlugs(local))
        }

        fetch("/api/practice/progress?kind=quiz")
            .then((response) => response.json())
            .then((data) => {
                if (!Array.isArray(data.slugs)) return
                const merged = [...new Set([...data.slugs, ...local])]
                setCompletedSlugs(merged)
                setCompletedQuizzes(merged)

                const remote = new Set(data.slugs)
                local
                    .filter((slug) => !remote.has(slug))
                    .forEach((slug) => {
                        fetch("/api/practice/progress", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ slug, kind: "quiz" }),
                        }).catch(() => { })
                    })
            })
            .catch(() => { })
    }, [])

    const completedSet = useMemo(() => new Set(completedSlugs), [completedSlugs])
    const isCompleted = useCallback((slug: string) => completedSet.has(slug), [completedSet])

    const markCompleted = useCallback((slug: string) => {
        setCompletedSlugs((current) => {
            if (current.includes(slug)) return current
            const next = [...current, slug]
            setCompletedQuizzes(next)
            return next
        })
        fetch("/api/practice/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug, kind: "quiz" }),
        }).catch(() => { })
    }, [])

    return { completedSlugs, isCompleted, markCompleted }
}

function hashString(value: string): number {
    let hash = 2166136261
    for (const character of value) {
        hash ^= character.charCodeAt(0)
        hash = Math.imul(hash, 16777619)
    }
    return hash >>> 0
}

function shuffledOptions(options: string[], seed: string): string[] {
    return options
        .map((option, index) => ({ option, index, score: hashString(`${seed}:${option}`) }))
        .sort((left, right) => left.score - right.score || left.index - right.index)
        .map(({ option }) => option)
}

function scorePercent(correct: number, total: number) {
    if (total <= 0) return 0
    return Math.round((correct / total) * 100)
}

export function TheoryQuizPanel({
    quizzes,
    renderedQuizzes,
    initialQuizSlug,
}: {
    quizzes: TheoryQuiz[]
    renderedQuizzes?: Record<string, RenderedMasteryQuestionNodes[]>
    initialQuizSlug?: string | null
}) {
    const panelRef = useRef<HTMLDivElement>(null)
    const listHeadingRef = useRef<HTMLHeadingElement>(null)
    const quizTitleRef = useRef<HTMLHeadingElement>(null)
    const validInitialSlug = quizzes.some((quiz) => quiz.slug === initialQuizSlug) ? initialQuizSlug : undefined
    const levels = useMemo(() => ["All", ...new Set(quizzes.map((quiz) => quiz.level))] as Array<TheoryQuizLevel | "All">, [quizzes])
    const [level, setLevel] = useState<TheoryQuizLevel | "All">("All")
    const [mobileView, setMobileView] = useState<"list" | "quiz">(validInitialSlug ? "quiz" : "list")
    const filteredQuizzes = useMemo(
        () => level === "All" ? quizzes : quizzes.filter((quiz) => quiz.level === level),
        [level, quizzes]
    )
    const [selectedSlug, setSelectedSlug] = useState(validInitialSlug ?? quizzes[0]?.slug ?? "")
    const selectedQuiz = filteredQuizzes.find((quiz) => quiz.slug === selectedSlug) ?? filteredQuizzes[0] ?? quizzes[0]
    const bestResults = useSyncExternalStore(subscribeScoreResults, getScoreResultsSnapshot, getServerScoreResultsSnapshot)
    const { completedSlugs, isCompleted, markCompleted } = useTheoryQuizProgress()

    if (!selectedQuiz) return null

    const bestResult = bestResults[selectedQuiz.slug]
    const completedCount = quizzes.filter((quiz) => isCompleted(quiz.slug)).length
    const completionPct = quizzes.length > 0 ? Math.round((completedCount / quizzes.length) * 100) : 0

    function saveResult(quiz: TheoryQuiz, nextResult: TheoryQuizResult) {
        saveScoreResult(quiz.slug, nextResult)
        if (nextResult.passed) {
            markCompleted(quiz.slug)
        }
    }

    function focusPanelTop(target: "quiz" | "list") {
        const scroll = () => {
            const heading = target === "quiz" ? quizTitleRef.current : listHeadingRef.current
            heading?.focus({ preventScroll: true })
            panelRef.current?.scrollIntoView?.({
                block: "start",
                behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
            })
        }
        if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(scroll)
        } else {
            scroll()
        }
    }

    function openQuiz(slug: string) {
        setSelectedSlug(slug)
        setMobileView("quiz")
        focusPanelTop("quiz")
    }

    function showQuizList() {
        setMobileView("list")
        focusPanelTop("list")
    }

    return (
        <div id="theory-quiz" ref={panelRef} className="scroll-mt-20 grid gap-6 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
            <aside className={cn("space-y-4", mobileView === "list" ? "block" : "hidden lg:block")}>
                <div className="rounded-lg border border-border/50 bg-card/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            Quiz Progress
                        </div>
                        <span className="text-xs text-muted-foreground">{completedCount}/{quizzes.length}</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted/30">
                        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${completionPct}%` }} />
                    </div>
                </div>

                <div className="rounded-lg border border-border/50 bg-card/50 p-3">
                    <h2 ref={listHeadingRef} tabIndex={-1} className="mb-3 text-sm font-medium">Theory quizzes</h2>
                    <div role="group" className="mb-3 flex flex-wrap gap-1.5" aria-label="Quiz level">
                        {levels.map((item) => (
                            <Button
                                key={item}
                                type="button"
                                variant="ghost"
                                size="xs"
                                aria-pressed={level === item}
                                className={cn("h-8 px-2 text-xs", level === item && "bg-accent text-accent-foreground")}
                                onClick={() => {
                                    setLevel(item)
                                    setMobileView("list")
                                }}
                            >
                                {item}
                            </Button>
                        ))}
                    </div>
                    <div className="grid gap-2">
                        {filteredQuizzes.map((quiz) => {
                            const active = quiz.slug === selectedQuiz.slug
                            const best = bestResults[quiz.slug]
                            const complete = completedSlugs.includes(quiz.slug)

                            return (
                                <button
                                    key={quiz.slug}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => openQuiz(quiz.slug)}
                                    className={cn(
                                        "w-full rounded-lg border p-3 text-left transition-colors",
                                        active
                                            ? "border-primary/45 bg-primary/10"
                                            : "border-border/45 bg-background/30 hover:border-primary/30 hover:bg-card/70"
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="min-w-0">
                                            <span className="block font-medium leading-snug">{quiz.title}</span>
                                            <span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted-foreground">
                                                {quiz.description}
                                            </span>
                                        </span>
                                        {complete && <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />}
                                    </div>
                                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                        <span className={cn("rounded-full border px-2 py-0.5", levelClass[quiz.level])}>
                                            {quiz.level}
                                        </span>
                                        <span>{quiz.questions.length} questions</span>
                                        <span>{quiz.estimatedMinutes}m</span>
                                        {best && <span>best {best.score}%</span>}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </aside>

            <div className={cn(mobileView === "quiz" ? "block" : "hidden lg:block")}>
                <ActiveTheoryQuiz
                    key={selectedQuiz.slug}
                    quiz={selectedQuiz}
                    renderedQuestions={renderedQuizzes?.[selectedQuiz.slug]}
                    bestResult={bestResult}
                    titleRef={quizTitleRef}
                    onBackToList={mobileView === "quiz" ? showQuizList : undefined}
                    onResult={(nextResult) => saveResult(selectedQuiz, nextResult)}
                />
            </div>
        </div>
    )
}

function ActiveTheoryQuiz({
    quiz,
    renderedQuestions,
    bestResult,
    titleRef,
    onBackToList,
    onResult,
}: {
    quiz: TheoryQuiz
    renderedQuestions?: RenderedMasteryQuestionNodes[]
    bestResult?: TheoryQuizResult
    titleRef: RefObject<HTMLHeadingElement | null>
    onBackToList?: () => void
    onResult: (result: TheoryQuizResult) => void
}) {
    const [selections, setSelections] = useState<Record<number, string>>({})
    const [checkedSelections, setCheckedSelections] = useState<Record<number, string> | null>(null)
    const [result, setResult] = useState<TheoryQuizResult | null>(null)
    const answeredCount = Object.keys(selections).length
    const allAnswered = answeredCount === quiz.questions.length
    const displayedOptions = quiz.questions.map((question, index) =>
        shuffledOptions(question.options, `${quiz.slug}:${index}:${question.question}`)
    )

    function submitQuiz() {
        if (!allAnswered) return

        const correct = quiz.questions.reduce(
            (count, question, index) => count + (selections[index] === question.answer ? 1 : 0),
            0
        )
        const score = scorePercent(correct, quiz.questions.length)
        const nextResult = {
            correct,
            total: quiz.questions.length,
            score,
            passed: quiz.questions.length > 0 && isPassingQuizScore(score),
            attempts: (bestResult?.attempts ?? 0) + 1,
        }

        setCheckedSelections({ ...selections })
        setResult(nextResult)
        trackEvent("quiz_submitted", {
            quiz_type: "theory",
            slug: quiz.slug,
            score: nextResult.score,
            passed: nextResult.passed,
            attempt: nextResult.attempts,
        })
        const localAttempt = recordLocalQuizAttempt({
            kind: "theory",
            slug: quiz.slug,
            correct: nextResult.correct,
            total: nextResult.total,
        })
        void syncStudyAction({
            action: "quiz_attempt",
            id: localAttempt.id,
            kind: "theory",
            slug: quiz.slug,
            correct: nextResult.correct,
            total: nextResult.total,
        }).then(() => removeLocalQuizAttempt(localAttempt.id)).catch(() => { })
        onResult(nextResult)
    }

    function resetQuiz() {
        setSelections({})
        setCheckedSelections(null)
        setResult(null)
    }

    return (
            <section className="min-w-0 rounded-lg border border-border/50 bg-card/50">
                <div className="border-b border-border/50 p-4 sm:p-5">
                    {onBackToList && (
                        <Button type="button" variant="ghost" size="sm" onClick={onBackToList} className="-ml-2 mb-3 gap-2 lg:hidden">
                            <ArrowLeft className="h-4 w-4" />
                            Back to quizzes
                        </Button>
                    )}
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", levelClass[quiz.level])}>
                                    {quiz.level}
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <ListChecks className="h-3.5 w-3.5" />
                                    {quiz.questions.length} questions
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Clock3 className="h-3.5 w-3.5" />
                                    {quiz.estimatedMinutes}m
                                </span>
                            </div>
                            <h2 ref={titleRef} tabIndex={-1} className="mt-3 text-2xl font-bold tracking-tight">{quiz.title}</h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                {quiz.description}
                            </p>
                        </div>
                        {bestResult && (
                            <div className="rounded-lg border border-border/50 bg-background/45 px-3 py-2 text-sm">
                                <div className="text-xs text-muted-foreground">Best score</div>
                                <div className="font-semibold">{bestResult.score}%</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-7 p-4 sm:p-5">
                    {quiz.questions.map((question, questionIndex) => {
                        const selected = selections[questionIndex]
                        const checked = checkedSelections?.[questionIndex]
                        const correctOption = question.answer
                        const hasResult = Boolean(result)

                        const rendered = renderedQuestions?.[questionIndex]

                        return (
                            <fieldset key={`${quiz.slug}-${questionIndex}`} className="space-y-3">
                                <legend className="text-base font-semibold leading-relaxed">
                                    <span className="mr-2 text-primary">{questionIndex + 1}.</span>
                                    {rendered?.question ?? <FallbackInlineText text={question.question} />}
                                </legend>
                                <div className="grid gap-2">
                                    {displayedOptions[questionIndex].map((option) => {
                                        const selectedOption = selected === option
                                        const wasChecked = checked === option
                                        const isCorrect = option === correctOption
                                        const showCorrect = hasResult && isCorrect
                                        const showWrong = hasResult && wasChecked && !isCorrect

                                        return (
                                            <label
                                                key={option}
                                                className={cn(
                                                    "flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm leading-relaxed transition-colors",
                                                    showCorrect
                                                        ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                                        : showWrong
                                                            ? "border-red-500/35 bg-red-500/10 text-red-700 dark:text-red-300"
                                                            : selectedOption
                                                                ? "border-primary/45 bg-primary/10 text-foreground"
                                                                : "border-border/60 bg-background/30 text-foreground/85 hover:border-primary/30 hover:bg-primary/[0.04]"
                                                )}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`${quiz.slug}-${questionIndex}`}
                                                    value={option}
                                                    checked={selectedOption}
                                                    onChange={() => {
                                                        setSelections((current) => ({ ...current, [questionIndex]: option }))
                                                        setCheckedSelections(null)
                                                        setResult(null)
                                                    }}
                                                    className="mt-1 h-4 w-4 accent-[var(--primary)]"
                                                />
                                                <span>{rendered?.options[option] ?? <FallbackInlineText text={option} />}</span>
                                            </label>
                                        )
                                    })}
                                </div>
                                {result && (
                                    <div
                                        className={cn(
                                            "rounded-lg border px-4 py-3 text-sm leading-relaxed",
                                            checked === correctOption
                                                ? "border-emerald-500/25 bg-emerald-500/[0.07]"
                                                : "border-amber-500/25 bg-amber-500/[0.07]"
                                        )}
                                    >
                                        <p className="mb-1 font-semibold">
                                            {checked === correctOption
                                                ? "Correct"
                                                : <>Correct answer: {rendered?.answer ?? <FallbackInlineText text={correctOption} />}</>}
                                        </p>
                                        <p className="text-muted-foreground">
                                            {rendered?.explanation ?? <FallbackInlineText text={question.explanation} />}
                                        </p>
                                    </div>
                                )}
                            </fieldset>
                        )
                    })}
                </div>

                <div className="border-t border-border/50 p-4 sm:p-5">
                    {result && (
                        <div
                            role="status"
                            className={cn(
                                "mb-4 flex items-start gap-3 rounded-xl border px-4 py-4 text-sm",
                                result.passed
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                    : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                            )}
                        >
                            {result.passed ? <Award className="mt-0.5 h-4 w-4" /> : <CircleAlert className="mt-0.5 h-4 w-4" />}
                            <div>
                                <p className="font-semibold">
                                    {result.correct}/{result.total} correct · {result.score}%
                                </p>
                                <p className="mt-1">
                                    {result.passed ? "Quiz complete." : `Score ${QUIZ_PASS_PERCENT}% or higher to complete this quiz.`}
                                </p>
                            </div>
                        </div>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                            {answeredCount}/{quiz.questions.length} answered
                        </p>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={resetQuiz} className="gap-2">
                                <RotateCcw className="h-4 w-4" />
                                Reset
                            </Button>
                            <Button type="button" disabled={!allAnswered} onClick={submitQuiz} className="gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                Check Answers
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
    )
}
