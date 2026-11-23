"use client"

import { useEffect, useMemo, useState } from "react"
import { trackEvent } from "@/lib/analytics"
import { Award, Check, CircleAlert, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InlineMarkdown } from "@/components/inline-markdown"
import { useReadingProgress } from "@/lib/reading-progress"
import { recordLocalQuizAttempt, removeLocalQuizAttempt, syncStudyAction, type QuizKind } from "@/lib/study-state"
import {
    isPassingMasteryScore,
    isPassingQuizScore,
    masteryScorePercent,
    MASTERY_PASS_PERCENT,
    type MasteryQuizQuestion,
} from "@/lib/mastery-quiz"

const STORAGE_KEYS: Record<"mastery" | "section", string> = {
    mastery: "leetllm_mastery_quiz_scores",
    section: "leetllm_section_check_scores",
}

type MasteryResult = {
    correct: number
    total: number
    score: number
    passed: boolean
    attempts: number
}

function readRawStoredResults(kind: "mastery" | "section"): Record<string, MasteryResult> {
    if (typeof window === "undefined") return {}
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS[kind]) ?? "{}") as Record<string, MasteryResult>
    } catch {
        return {}
    }
}

function readStoredResults(kind: "mastery" | "section"): Record<string, MasteryResult> {
    return Object.fromEntries(Object.entries(readRawStoredResults(kind)).map(([slug, result]) => [
        slug,
        { ...result, passed: isPassingQuizScore(result.score) },
    ]))
}

function saveResult(kind: "mastery" | "section", slug: string, result: MasteryResult) {
    const stored = readStoredResults(kind)
    const previous = stored[slug]
    stored[slug] = previous && previous.score > result.score
        ? { ...previous, attempts: result.attempts }
        : result
    localStorage.setItem(STORAGE_KEYS[kind], JSON.stringify(stored))
}

function hashString(value: string): number {
    let hash = 2166136261
    for (const character of value) {
        hash ^= character.charCodeAt(0)
        hash = Math.imul(hash, 16777619)
    }
    return hash >>> 0
}

// Keep answer positions stable per lesson while removing source-order cues.
function shuffledOptions(options: string[], seed: string): string[] {
    return options
        .map((option, index) => ({ option, index, score: hashString(`${seed}:${option}`) }))
        .sort((left, right) => left.score - right.score || left.index - right.index)
        .map(({ option }) => option)
}

export function MasteryQuiz({
    slug,
    questions,
}: {
    slug: string
    questions: MasteryQuizQuestion[]
}) {
    return (
        <KnowledgeCheck
            slug={slug}
            questions={questions}
            kind="mastery"
            eyebrow="Complete the lesson"
            title="Mastery Check"
            description={`Answer every question, then check your score. Score ${MASTERY_PASS_PERCENT}% or higher to mark this lesson complete.`}
            completionLabel="Lesson complete"
        />
    )
}

type KnowledgeCheckQuestion = MasteryQuizQuestion & { section?: string }

export function KnowledgeCheck({
    slug,
    questions,
    kind,
    eyebrow,
    title,
    description,
    completionLabel,
}: {
    slug: string
    questions: KnowledgeCheckQuestion[]
    kind: Extract<QuizKind, "mastery" | "section">
    eyebrow: string
    title: string
    description: string
    completionLabel: string
}) {
    const { isRead, markAsRead } = useReadingProgress()
    const [selections, setSelections] = useState<Record<number, string>>({})
    const [checkedSelections, setCheckedSelections] = useState<Record<number, string> | null>(null)
    const [result, setResult] = useState<MasteryResult | null>(null)
    const [bestResult, setBestResult] = useState<MasteryResult | null>(null)
    const lessonComplete = kind === "mastery" && isRead(slug)
    const answeredCount = Object.keys(selections).length
    const allAnswered = answeredCount === questions.length
    const displayedOptions = useMemo(
        () => questions.map((question, index) => shuffledOptions(
            question.options,
            `${slug}:${index}:${question.question}`,
        )),
        [questions, slug],
    )
    const changedAfterCheckCount = result && checkedSelections
        ? questions.reduce((count, _question, index) => (
            checkedSelections[index] !== undefined && selections[index] !== checkedSelections[index]
                ? count + 1
                : count
        ), 0)
        : 0
    const resultIsStale = changedAfterCheckCount > 0

    useEffect(() => {
        const rawResults = readRawStoredResults(kind)
        const rawStored = rawResults[slug]
        const stored = rawStored && { ...rawStored, passed: isPassingQuizScore(rawStored.score) }
        if (stored) {
            queueMicrotask(() => setBestResult(stored))
            if (!rawStored.passed && stored.passed) {
                rawResults[slug] = stored
                localStorage.setItem(STORAGE_KEYS[kind], JSON.stringify(rawResults))
                if (kind === "mastery" && !lessonComplete) markAsRead(slug)
            }
        }
    }, [kind, lessonComplete, markAsRead, slug])

    const correctCount = useMemo(
        () => questions.reduce(
            (count, question, index) => count + (selections[index] === question.answer ? 1 : 0),
            0,
        ),
        [questions, selections],
    )

    function submitQuiz() {
        if (!allAnswered) return

        const attempts = (bestResult?.attempts ?? 0) + 1
        const nextResult = {
            correct: correctCount,
            total: questions.length,
            score: masteryScorePercent(correctCount, questions.length),
            passed: isPassingMasteryScore(correctCount, questions.length),
            attempts,
        }
        setCheckedSelections({ ...selections })
        setResult(nextResult)
        const nextBest = !bestResult || nextResult.score >= bestResult.score
            ? nextResult
            : { ...bestResult, attempts }
        setBestResult(nextBest)
        saveResult(kind, slug, nextResult)
        trackEvent("quiz_submitted", {
            quiz_type: kind,
            slug,
            score: nextResult.score,
            passed: nextResult.passed,
            attempt: attempts,
        })
        const localAttempt = recordLocalQuizAttempt({
            kind,
            slug,
            correct: nextResult.correct,
            total: nextResult.total,
        })
        if (kind !== "section") {
            void syncStudyAction({
                action: "quiz_attempt",
                id: localAttempt.id,
                kind,
                slug,
                correct: nextResult.correct,
                total: nextResult.total,
            }).then(() => removeLocalQuizAttempt(localAttempt.id)).catch(() => { })
        }

        if (kind === "mastery" && nextResult.passed) {
            if (!lessonComplete && !bestResult?.passed) {
                trackEvent("lesson_completed", { slug, completion_method: "mastery_quiz" })
            }
            markAsRead(slug)
        }
    }

    function retryQuiz() {
        setSelections({})
        setCheckedSelections(null)
        setResult(null)
    }

    return (
        <section
            id={kind === "mastery" ? "mastery-quiz" : "section-check"}
            aria-labelledby={`${kind}-quiz-title`}
            className="my-12 scroll-mt-20 overflow-hidden rounded-2xl border border-primary/25 bg-primary/[0.035] shadow-sm shadow-black/10"
        >
            <div className="border-b border-primary/15 bg-primary/[0.055] px-5 py-5 sm:px-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                            <Award className="h-4 w-4" />
                            {eyebrow}
                        </div>
                        <h2 id={`${kind}-quiz-title`} className="text-2xl font-bold [color:var(--reading-heading)]">
                            {title}
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed [color:var(--reading-muted)]">
                            {description}
                        </p>
                    </div>
                    {(lessonComplete || bestResult?.passed) && (
                        <div data-print-hidden className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-500">
                            <Check className="h-3.5 w-3.5" />
                            {completionLabel}
                        </div>
                    )}
                </div>
                {bestResult && (
                    <p data-print-hidden className="mt-3 text-xs [color:var(--reading-subtle)]">
                        Best score: {bestResult.score}% · {bestResult.attempts} {bestResult.attempts === 1 ? "attempt" : "attempts"}
                    </p>
                )}
            </div>

            <div className="space-y-8 px-5 py-6 sm:px-7">
                {questions.map((question, questionIndex) => {
                    const selected = selections[questionIndex]
                    const checkedSelection = checkedSelections?.[questionIndex]
                    const changedSinceCheck = Boolean(
                        result && checkedSelection !== undefined && selected !== checkedSelection,
                    )
                    const answeredCorrectly = checkedSelection === question.answer

                    return (
                        <fieldset key={`${questionIndex}-${question.question}`} className="space-y-3">
                            <legend className="text-base font-semibold leading-relaxed [color:var(--reading-heading)]">
                                {question.section && (
                                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-primary">{question.section}</span>
                                )}
                                <span className="mr-2 text-primary">{questionIndex + 1}.</span>
                                <InlineMarkdown>{question.question}</InlineMarkdown>
                            </legend>
                            <div className="grid gap-2">
                                {displayedOptions[questionIndex].map((option) => {
                                    const selectedOption = selected === option
                                    const correctOption = result && option === question.answer
                                    const wrongSelection = result && checkedSelection === option && !correctOption

                                    return (
                                        <label
                                            key={option}
                                            className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm leading-relaxed transition-colors ${
                                                correctOption
                                                    ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                                    : wrongSelection
                                                        ? "border-red-500/35 bg-red-500/10 text-red-700 dark:text-red-300"
                                                        : selectedOption
                                                            ? "border-primary/45 bg-primary/10 [color:var(--reading-heading)]"
                                                            : "border-border/60 bg-background/30 [color:var(--reading-ink)] hover:border-primary/30 hover:bg-primary/[0.04]"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name={`${kind}-question-${questionIndex}`}
                                                value={option}
                                                checked={selectedOption}
                                                onChange={() => {
                                                    setSelections((current) => ({ ...current, [questionIndex]: option }))
                                                }}
                                                className="mt-1 h-4 w-4 accent-[var(--primary)]"
                                            />
                                            <span><InlineMarkdown>{option}</InlineMarkdown></span>
                                        </label>
                                    )
                                })}
                            </div>
                            <div
                                data-print-only
                                className="hidden rounded-lg border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-3 text-sm leading-relaxed"
                            >
                                <p className="mb-1 font-semibold [color:var(--reading-heading)]">
                                    Correct answer: <InlineMarkdown>{question.answer}</InlineMarkdown>
                                </p>
                                <p className="[color:var(--reading-muted)]">
                                    <InlineMarkdown>{question.explanation}</InlineMarkdown>
                                </p>
                            </div>
                            {result && (
                                <div
                                    data-print-hidden
                                    className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${
                                        changedSinceCheck
                                            ? "border-sky-500/25 bg-sky-500/[0.07]"
                                            : answeredCorrectly
                                            ? "border-emerald-500/25 bg-emerald-500/[0.07]"
                                            : "border-amber-500/25 bg-amber-500/[0.07]"
                                    }`}
                                >
                                    <p className="mb-1 font-semibold [color:var(--reading-heading)]">
                                        {changedSinceCheck
                                            ? <>Changed since last check. Correct answer: <InlineMarkdown>{question.answer}</InlineMarkdown></>
                                            : answeredCorrectly
                                                ? "Correct"
                                                : <>Correct answer: <InlineMarkdown>{question.answer}</InlineMarkdown></>}
                                    </p>
                                    <p className="[color:var(--reading-muted)]">
                                        <InlineMarkdown>{question.explanation}</InlineMarkdown>
                                    </p>
                                </div>
                            )}
                        </fieldset>
                    )
                })}
            </div>

            <div data-print-hidden className="border-t border-primary/15 bg-background/25 px-5 py-5 sm:px-7">
                {result && (
                    <div
                        role="status"
                        className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-4 ${
                            resultIsStale
                                ? "border-sky-500/30 bg-sky-500/10"
                                : result.passed
                                ? "border-emerald-500/30 bg-emerald-500/10"
                                : "border-amber-500/30 bg-amber-500/10"
                        }`}
                    >
                        {resultIsStale
                            ? <CircleAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-500" />
                            : result.passed
                                ? <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                                : <CircleAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />}
                        <div>
                            <p className="font-semibold [color:var(--reading-heading)]">
                                {resultIsStale
                                    ? "Answers changed since last check"
                                    : result.passed ? kind === "mastery" ? "Mastery check passed" : `${title} passed` : "Keep practicing"}
                            </p>
                            <p className="mt-1 text-sm [color:var(--reading-muted)]">
                                Score: {result.correct}/{result.total} ({result.score}%).
                                {resultIsStale
                                    ? ` ${changedAfterCheckCount} ${changedAfterCheckCount === 1 ? "answer has" : "answers have"} changed; recheck to refresh your score.`
                                    : result.passed
                                    ? kind === "mastery" ? " This lesson is now marked complete." : " This week's section check is complete."
                                    : ` You need a score of ${MASTERY_PASS_PERCENT}% or higher to complete ${kind === "mastery" ? "the lesson" : "this check"}.`}
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs [color:var(--reading-subtle)]">
                        {allAnswered ? "All questions answered." : `${questions.length - answeredCount} questions remaining.`}
                    </p>
                    <div className="flex gap-2">
                        {result && !resultIsStale ? (
                            <Button type="button" variant="outline" onClick={retryQuiz}>
                                <RotateCcw className="h-4 w-4" />
                                Retake
                            </Button>
                        ) : (
                            <Button type="button" disabled={!allAnswered} onClick={submitQuiz}>
                                {resultIsStale ? "Recheck answers" : "Check answers"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}
