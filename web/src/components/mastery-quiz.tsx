"use client"

import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react"
import { trackEvent } from "@/lib/analytics"
import { Award, Check, CircleAlert, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlossaryMarkdownSpan } from "@/components/glossary-markdown-span"
import { useReadingProgress } from "@/lib/reading-progress"
import { recordLocalQuizAttempt, removeLocalQuizAttempt, syncStudyAction, type QuizKind } from "@/lib/study-state"
import {
    isPassingMasteryScore,
    isPassingQuizScore,
    masteryScorePercent,
    MASTERY_PASS_PERCENT,
    type MasteryQuizQuestion,
} from "@/lib/mastery-quiz"

export interface RenderedMasteryQuestionNodes {
    question: ReactNode
    options: Record<string, ReactNode>
    answer: ReactNode
    explanation: ReactNode
}

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
    renderedQuestions,
}: {
    slug: string
    questions: MasteryQuizQuestion[]
    renderedQuestions?: RenderedMasteryQuestionNodes[]
}) {
    return (
        <KnowledgeCheck
            slug={slug}
            questions={questions}
            renderedQuestions={renderedQuestions}
            kind="mastery"
            eyebrow="Check your understanding"
            title="Mastery Check"
            description={`Check each question as you go, or answer all of them and check together. Score ${MASTERY_PASS_PERCENT}% or higher to complete this lesson.`}
            completionLabel="Lesson complete"
        />
    )
}

type KnowledgeCheckQuestion = MasteryQuizQuestion & { section?: string }

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"]

export function KnowledgeCheck({
    slug,
    questions,
    renderedQuestions,
    kind,
    eyebrow,
    title,
    description,
    completionLabel,
}: {
    slug: string
    questions: KnowledgeCheckQuestion[]
    renderedQuestions?: RenderedMasteryQuestionNodes[]
    kind: Extract<QuizKind, "mastery" | "section">
    eyebrow: string
    title: string
    description: string
    completionLabel: string
}) {
    const { isRead, markAsRead } = useReadingProgress()
    const [selections, setSelections] = useState<Record<number, string>>({})
    const [checkedQuestions, setCheckedQuestions] = useState<Record<number, string>>({})
    const [checkedSelections, setCheckedSelections] = useState<Record<number, string> | null>(null)
    const [result, setResult] = useState<MasteryResult | null>(null)
    const [bestResult, setBestResult] = useState<MasteryResult | null>(null)
    const lessonComplete = kind === "mastery" && isRead(slug)
    const answeredCount = Object.keys(selections).length
    const checkedCount = Object.keys(checkedQuestions).length
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

    function finalizeScore(finalAnswers: Record<number, string>) {
        const correct = questions.reduce(
            (count, question, index) => count + (finalAnswers[index] === question.answer ? 1 : 0),
            0,
        )
        const attempts = (bestResult?.attempts ?? 0) + 1
        const nextResult = {
            correct,
            total: questions.length,
            score: masteryScorePercent(correct, questions.length),
            passed: isPassingMasteryScore(correct, questions.length),
            attempts,
        }
        setCheckedSelections({ ...finalAnswers })
        setCheckedQuestions({ ...finalAnswers })
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

    function checkSingleQuestion(questionIndex: number) {
        const selected = selections[questionIndex]
        if (selected === undefined) return

        const nextChecked = { ...checkedQuestions, [questionIndex]: selected }
        setCheckedQuestions(nextChecked)

        const everyQuestionCheckedUpToDate = questions.every(
            (_question, idx) => nextChecked[idx] !== undefined && nextChecked[idx] === selections[idx],
        )
        if (everyQuestionCheckedUpToDate) {
            finalizeScore(nextChecked)
        }
    }

    function submitQuiz() {
        if (!allAnswered) return
        finalizeScore(selections)
    }

    function retryQuiz() {
        setSelections({})
        setCheckedQuestions({})
        setCheckedSelections(null)
        setResult(null)
    }

    const checkedCorrectCount = questions.reduce(
        (count, question, index) => count + (checkedQuestions[index] === question.answer ? 1 : 0),
        0,
    )

    return (
        <section
            id={kind === "mastery" ? "mastery-quiz" : "section-check"}
            aria-labelledby={`${kind}-quiz-title`}
            className="reader-prose-block my-12 scroll-mt-20 overflow-hidden rounded-2xl border [border-color:var(--reading-border)] [background:var(--reading-panel)] shadow-sm shadow-black/5"
        >
            <div className="border-b [border-color:var(--reading-border)] bg-primary/[0.045] px-5 py-5 sm:px-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                            <Award className="h-4 w-4" />
                            {eyebrow}
                        </div>
                        <h2 id={`${kind}-quiz-title`} className="text-xl font-bold sm:text-2xl [color:var(--reading-heading)]">
                            {title}
                        </h2>
                        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed [color:var(--reading-muted)]">
                            {description}
                        </p>
                    </div>
                    {(lessonComplete || bestResult?.passed) && (
                        <div data-print-hidden className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            <Check className="h-3.5 w-3.5" />
                            {completionLabel}
                        </div>
                    )}
                </div>
                <div data-print-hidden className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs tabular-nums [color:var(--reading-subtle)]">
                    <span>
                        {checkedCount > 0
                            ? `${checkedCount} of ${questions.length} checked · ${checkedCorrectCount} correct`
                            : `${answeredCount} of ${questions.length} answered`}
                    </span>
                    {bestResult && (
                        <span>
                            Best score: {bestResult.score}% · {bestResult.attempts} {bestResult.attempts === 1 ? "attempt" : "attempts"}
                        </span>
                    )}
                </div>
            </div>
            <div
                data-print-hidden
                role="progressbar"
                aria-label="Quiz completion progress"
                aria-valuenow={questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-1 w-full bg-border/60 dark:bg-white/10"
            >
                <div
                    className={`h-full transition-all duration-300 ease-out ${
                        result?.passed ? "bg-emerald-500" : "bg-primary"
                    }`}
                    style={{ width: `${questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0}%` }}
                />
            </div>

            <div className="divide-y divide-[color:var(--reading-border)]/70 px-5 sm:px-7">
                {questions.map((question, questionIndex) => {
                    const selected = selections[questionIndex]
                    const checkedSelection = checkedQuestions[questionIndex]
                    const isQuestionChecked = checkedSelection !== undefined
                    const changedSinceCheck = Boolean(
                        (result && checkedSelections?.[questionIndex] !== undefined && selected !== checkedSelections[questionIndex])
                        || (isQuestionChecked && selected !== checkedSelection),
                    )
                    const answeredCorrectly = checkedSelection === question.answer
                    const showQuestionFeedback = isQuestionChecked || Boolean(result)
                    const canCheckThisQuestion = selected !== undefined && (!isQuestionChecked || changedSinceCheck)

                    const rendered = renderedQuestions?.[questionIndex]

                    return (
                        <fieldset key={`${questionIndex}-${question.question}`} className="space-y-3.5 py-6">
                            <legend className="text-base font-semibold leading-relaxed [color:var(--reading-heading)]">
                                {question.section && (
                                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-primary">{question.section}</span>
                                )}
                                <span className="mr-2 font-mono text-sm font-semibold text-primary">
                                    {questionIndex + 1}.
                                </span>
                                {rendered?.question ?? <FallbackInlineText text={question.question} />}
                            </legend>
                            <div className="grid gap-2">
                                {displayedOptions[questionIndex].map((option, optionIndex) => {
                                    const selectedOption = selected === option
                                    const correctOption = showQuestionFeedback && option === question.answer
                                    const wrongSelection = showQuestionFeedback && checkedSelection === option && !correctOption
                                    const letter = OPTION_LETTERS[optionIndex] ?? String(optionIndex + 1)

                                    return (
                                        <label
                                            key={option}
                                            className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm leading-relaxed transition-colors focus-within:ring-2 focus-within:ring-primary/40 ${
                                                correctOption
                                                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                                                    : wrongSelection
                                                        ? "border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-200"
                                                        : selectedOption
                                                            ? "border-primary/50 bg-primary/10 [color:var(--reading-heading)]"
                                                            : "[border-color:var(--reading-border)] bg-background/40 [color:var(--reading-ink)] hover:border-primary/35 hover:bg-primary/[0.04]"
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
                                                className="sr-only"
                                            />
                                            <span
                                                aria-hidden="true"
                                                data-option-letter={correctOption ? undefined : letter}
                                                className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-sans text-[11px] font-semibold transition-colors ${
                                                    correctOption
                                                        ? "border-emerald-500 bg-emerald-500 text-white"
                                                        : wrongSelection
                                                            ? "border-red-500 bg-red-500 text-white before:content-[attr(data-option-letter)]"
                                                            : selectedOption
                                                                ? "border-primary bg-primary text-primary-foreground before:content-[attr(data-option-letter)]"
                                                                : "[border-color:var(--reading-border)] [color:var(--reading-subtle)] before:content-[attr(data-option-letter)]"
                                                }`}
                                            >
                                                {correctOption ? <Check className="h-3 w-3" /> : null}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                {rendered?.options[option] ?? <FallbackInlineText text={option} />}
                                            </span>
                                        </label>
                                    )
                                })}
                            </div>
                            {canCheckThisQuestion && (
                                <div data-print-hidden className="flex justify-end">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => checkSingleQuestion(questionIndex)}
                                        className="h-8 rounded-lg border-primary/30 text-xs font-medium text-primary hover:bg-primary/10"
                                    >
                                        {isQuestionChecked ? `Recheck question ${questionIndex + 1}` : `Check question ${questionIndex + 1}`}
                                    </Button>
                                </div>
                            )}
                            <div
                                data-print-only
                                className="hidden rounded-lg border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-3 text-sm leading-relaxed"
                            >
                                <p className="mb-1 font-semibold [color:var(--reading-heading)]">
                                    Correct answer: {rendered?.answer ?? <FallbackInlineText text={question.answer} />}
                                </p>
                                <p className="[color:var(--reading-muted)]">
                                    {rendered?.explanation ?? <FallbackInlineText text={question.explanation} />}
                                </p>
                            </div>
                            {showQuestionFeedback && (
                                <div
                                    data-print-hidden
                                    className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${
                                        changedSinceCheck
                                            ? "border-sky-500/25 bg-sky-500/[0.07]"
                                            : answeredCorrectly
                                                ? "border-emerald-500/25 bg-emerald-500/[0.07]"
                                                : "border-amber-500/25 bg-amber-500/[0.07]"
                                    }`}
                                >
                                    <p className="mb-1 flex items-center gap-1.5 font-semibold [color:var(--reading-heading)]">
                                        {changedSinceCheck ? (
                                            <>Changed since last check. Correct answer: {rendered?.answer ?? <FallbackInlineText text={question.answer} />}</>
                                        ) : answeredCorrectly ? (
                                            <>
                                                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                                                Correct
                                            </>
                                        ) : (
                                            <>Correct answer: {rendered?.answer ?? <FallbackInlineText text={question.answer} />}</>
                                        )}
                                    </p>
                                    <p className="[color:var(--reading-muted)]">
                                        {rendered?.explanation ?? <FallbackInlineText text={question.explanation} />}
                                    </p>
                                </div>
                            )}
                        </fieldset>
                    )
                })}
            </div>

            <div data-print-hidden className="border-t [border-color:var(--reading-border)] bg-background/25 px-5 py-5 sm:px-7">
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
                        {allAnswered ? "All questions answered." : `${questions.length - answeredCount} ${questions.length - answeredCount === 1 ? "question" : "questions"} remaining.`}
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
