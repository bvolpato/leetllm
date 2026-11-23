"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
    ArrowRight,
    BookOpen,
    BrainCircuit,
    Check,
    CheckCircle2,
    Clock,
    Code2,
    Flag,
    GraduationCap,
    RotateCcw,
    Route,
    Target,
} from "lucide-react"
import { usePracticeProgress } from "@/components/practice/practice-progress"
import { Button } from "@/components/ui/button"
import { useReadingProgress } from "@/lib/reading-progress"
import { trackEvent } from "@/lib/analytics"
import { useIsLoggedIn } from "@/lib/use-is-logged-in"
import {
    readLocalQuizHistory,
    STUDY_STATE_EVENT,
    syncStudyAction,
    type QuizAttempt,
    type StudyState,
} from "@/lib/study-state"
import {
    buildLearningPlan,
    experienceLevelOptions,
    getCompletedPlanActivityIds,
    isPlanAnswers,
    learnerGoalOptions,
    weeklyHourOptions,
    type ExperienceLevel,
    type LearnerGoal,
    type LearningPlanCatalog,
    type PlanActivityKind,
    type PlanAnswers,
    type PlanTrack,
    type WeeklyHours,
} from "@/lib/learning-plan"

const STORAGE_KEY = "leetllm_learning_plan_v1"

const activityLabels: Record<PlanActivityKind, string> = {
    lesson: "Learn",
    section: "Section check",
    coding: "Coding lab",
    exam: "Exam",
    milestone: "Milestone",
}

function ActivityIcon({ kind }: { kind: PlanActivityKind }) {
    const className = "h-4 w-4"
    if (kind === "lesson") return <BookOpen className={className} />
    if (kind === "section") return <BrainCircuit className={className} />
    if (kind === "coding") return <Code2 className={className} />
    if (kind === "exam") return <GraduationCap className={className} />
    return <Flag className={className} />
}

function OptionButton({
    selected,
    title,
    description,
    onClick,
}: {
    selected: boolean
    title: string
    description: string
    onClick: () => void
}) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={onClick}
            className={`relative min-h-24 rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                selected
                    ? "border-primary bg-primary/10"
                    : "border-border/60 bg-card/45 hover:border-primary/45 hover:bg-card/75"
            }`}
        >
            <span className="flex items-start justify-between gap-3">
                <span className="font-semibold leading-snug">{title}</span>
                <span className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                    {selected && <Check className="h-3.5 w-3.5" />}
                </span>
            </span>
            <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">{description}</span>
        </button>
    )
}

function mergeQuizAttempts(left: QuizAttempt[], right: QuizAttempt[]) {
    return [...new Map([...left, ...right].map((attempt) => [attempt.id, attempt])).values()]
}

export function LearningPlanBuilder({
    tracks,
    catalog,
}: {
    tracks: PlanTrack[]
    catalog: LearningPlanCatalog
}) {
    const [goal, setGoal] = useState<LearnerGoal | null>(null)
    const [level, setLevel] = useState<ExperienceLevel | null>(null)
    const [weeklyHours, setWeeklyHours] = useState<WeeklyHours | null>(null)
    const [submittedAnswers, setSubmittedAnswers] = useState<PlanAnswers | null>(null)
    const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([])
    const headingRef = useRef<HTMLHeadingElement>(null)
    const planRevision = useRef(0)
    const restoredFromUrl = useRef(false)
    const pendingFocus = useRef<string | null>(null)
    const { readSlugs } = useReadingProgress()
    const { learnedSlugs } = usePracticeProgress()
    const { isLoggedIn, authLoaded } = useIsLoggedIn()

    useEffect(() => {
        let cancelled = false
        let storedAnswers: PlanAnswers | null = null
        const params = new URLSearchParams(window.location.search)
        const urlAnswers = {
            goal: params.get("goal"),
            level: params.get("level"),
            weeklyHours: Number(params.get("weeklyHours")),
        }
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
                const answers: unknown = JSON.parse(stored)
                if (isPlanAnswers(answers)) storedAnswers = answers
            }
        } catch {
            localStorage.removeItem(STORAGE_KEY)
        }
        if (isPlanAnswers(urlAnswers)) {
            storedAnswers = urlAnswers
            restoredFromUrl.current = true
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...urlAnswers, updatedAt: new Date().toISOString() }))
            if (/^#week-\d+$/.test(window.location.hash)) pendingFocus.current = window.location.hash.slice(1)
        }

        const refreshQuizAttempts = () => setQuizAttempts(readLocalQuizHistory())
        queueMicrotask(() => {
            if (cancelled) return
            refreshQuizAttempts()
            if (storedAnswers) {
                setGoal(storedAnswers.goal)
                setLevel(storedAnswers.level)
                setWeeklyHours(storedAnswers.weeklyHours)
                setSubmittedAnswers(storedAnswers)
            }
        })
        window.addEventListener(STUDY_STATE_EVENT, refreshQuizAttempts)
        return () => {
            cancelled = true
            window.removeEventListener(STUDY_STATE_EVENT, refreshQuizAttempts)
        }
    }, [])

    useEffect(() => {
        if (!authLoaded || !isLoggedIn) return
        let cancelled = false
        const revision = planRevision.current
        const preferLocalPlan = restoredFromUrl.current
        let localPlan: (PlanAnswers & { updatedAt?: string }) | null = null
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            try {
                const value: unknown = JSON.parse(stored)
                if (isPlanAnswers(value)) localPlan = value as PlanAnswers & { updatedAt?: string }
            } catch { }
        }

        fetch("/api/study-state")
            .then((response) => response.json())
            .then((state: StudyState) => {
                if (cancelled) return
                setQuizAttempts((current) => mergeQuizAttempts(current, state.quizAttempts ?? []))
                if (revision !== planRevision.current) return
                const remotePlan = state.plan && isPlanAnswers(state.plan) ? state.plan : null
                if (localPlan && (preferLocalPlan || !remotePlan || Boolean(localPlan.updatedAt && localPlan.updatedAt > remotePlan.updatedAt))) {
                    void syncStudyAction({ action: "plan", answers: localPlan }).catch(() => { })
                    return
                }
                if (!remotePlan) return
                const answers: PlanAnswers = {
                    goal: remotePlan.goal,
                    level: remotePlan.level,
                    weeklyHours: remotePlan.weeklyHours,
                }
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...answers, updatedAt: remotePlan.updatedAt }))
                setGoal(answers.goal)
                setLevel(answers.level)
                setWeeklyHours(answers.weeklyHours)
                setSubmittedAnswers(answers)
            })
            .catch(() => {
                if (cancelled || revision !== planRevision.current) return
                if (localPlan) void syncStudyAction({ action: "plan", answers: localPlan }).catch(() => { })
            })
        return () => { cancelled = true }
    }, [authLoaded, isLoggedIn])

    useEffect(() => {
        const target = pendingFocus.current
        if (!target || (target !== "heading" && !submittedAnswers)) return
        const frame = requestAnimationFrame(() => {
            pendingFocus.current = null
            const heading = target === "heading"
                ? headingRef.current
                : document.getElementById(`${target}-title`)
            heading?.focus({ preventScroll: true })
            heading?.scrollIntoView?.({
                block: "start",
                behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
            })
        })
        return () => cancelAnimationFrame(frame)
    }, [submittedAnswers])

    const plan = useMemo(
        () => submittedAnswers ? buildLearningPlan(tracks, submittedAnswers, catalog) : null,
        [catalog, submittedAnswers, tracks]
    )
    const readSet = useMemo(() => new Set(readSlugs), [readSlugs])
    const learnedSet = useMemo(() => new Set(learnedSlugs), [learnedSlugs])
    const passedSection = useMemo(
        () => new Set(quizAttempts.filter((attempt) => attempt.kind === "section" && attempt.passed).map((attempt) => attempt.slug)),
        [quizAttempts]
    )
    const passedTheory = useMemo(
        () => new Set(quizAttempts.filter((attempt) => attempt.kind === "theory" && attempt.passed).map((attempt) => attempt.slug)),
        [quizAttempts]
    )
    const completedActivityIds = useMemo(() => plan ? getCompletedPlanActivityIds(plan, {
        readLessonSlugs: readSet,
        passedSectionSlugs: passedSection,
        completedPracticeSlugs: learnedSet,
        passedTheorySlugs: passedTheory,
    }) : new Set<string>(), [learnedSet, passedSection, passedTheory, plan, readSet])
    const allActivities = useMemo(() => plan?.weeks.flatMap((week) => week.activities) ?? [], [plan])
    const requiredActivities = allActivities.filter((activity) => activity.required)
    const completedActivities = requiredActivities.filter((activity) => completedActivityIds.has(activity.id)).length
    const nextActivity = requiredActivities.find((activity) => !completedActivityIds.has(activity.id) && activity.href)

    function clearPlanUrl() {
        const url = new URL(window.location.href)
        for (const key of ["goal", "level", "weeklyHours"]) url.searchParams.delete(key)
        if (/^#week-\d+$/.test(url.hash)) url.hash = ""
        window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`)
    }

    function createPlan() {
        if (!goal || !level || !weeklyHours) return
        planRevision.current += 1
        pendingFocus.current = "heading"
        clearPlanUrl()
        const answers = { goal, level, weeklyHours }
        const nextPlan = buildLearningPlan(tracks, answers, catalog)
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...answers, updatedAt: new Date().toISOString() }))
        setSubmittedAnswers(answers)
        if (isLoggedIn) void syncStudyAction({ action: "plan", answers }).catch(() => { })
        trackEvent("track_selected", {
            track: nextPlan.track.slug,
            goal,
            level,
            weekly_hours: weeklyHours,
            plan_weeks: nextPlan.weeks.length,
            plan_activities: nextPlan.weeks.reduce((total, week) => total + week.activities.length, 0),
        })
    }

    function resetPlan() {
        planRevision.current += 1
        pendingFocus.current = "heading"
        clearPlanUrl()
        localStorage.removeItem(STORAGE_KEY)
        setSubmittedAnswers(null)
        setGoal(null)
        setLevel(null)
        setWeeklyHours(null)
    }

    if (plan) {
        const progress = requiredActivities.length > 0 ? Math.round((completedActivities / requiredActivities.length) * 100) : 0

        return (
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
                <header className="border-b border-border/40 pb-7">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="max-w-3xl">
                            <p className="text-sm font-medium text-primary">Your learning plan</p>
                            <h1 ref={headingRef} tabIndex={-1} className="mt-2 scroll-mt-24 text-3xl font-bold leading-tight sm:text-5xl">{plan.track.title}</h1>
                            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">{plan.track.outcome}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={resetPlan} className="gap-2 text-muted-foreground">
                            <RotateCcw className="h-4 w-4" />
                            Build another plan
                        </Button>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <div className="flex items-center gap-3 border-l-2 border-primary/50 pl-3">
                            <Route className="h-4 w-4 text-primary" />
                            <span><strong>{plan.weeks.length} weeks</strong><br /><span className="text-sm text-muted-foreground">Weekly learning loops</span></span>
                        </div>
                        <div className="flex items-center gap-3 border-l-2 border-primary/50 pl-3">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>
                                <strong>{plan.answers.weeklyHours}{plan.answers.weeklyHours === 2 ? "+" : ""} hours/week</strong><br />
                                <span className="text-sm text-muted-foreground">
                                    {plan.answers.weeklyHours === 2 ? "Two lessons plus project work" : "Read, connect, build"}
                                </span>
                            </span>
                        </div>
                        <div className="flex items-center gap-3 border-l-2 border-primary/50 pl-3">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            <span>
                                <strong>
                                    <span>{plan.track.lessons.length} lessons</span>
                                    <span> + {allActivities.filter((activity) => activity.kind === "coding").length} labs</span>
                                </strong><br />
                                <span className="text-sm text-muted-foreground">{requiredActivities.length} required activities</span>
                            </span>
                        </div>
                    </div>

                    {plan.foundationBridgeLessonCount > 0 && (
                        <p className="mt-5 text-sm text-muted-foreground">
                            Starts with {plan.foundationBridgeLessonCount} prerequisite lessons, then moves into {plan.track.title.toLowerCase()}.
                        </p>
                    )}

                    <div className="mt-6 max-w-xl">
                        <div className="mb-2 flex justify-between text-sm text-muted-foreground">
                            <span>Required activity progress</span>
                            <span>{completedActivities}/{requiredActivities.length} · {progress}%</span>
                        </div>
                        <div
                            className="h-2 overflow-hidden rounded-full bg-muted"
                            role="progressbar"
                            aria-label="Learning plan progress"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={progress}
                        >
                            <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
                        </div>
                    </div>

                    <div className="mt-7 flex flex-wrap gap-3">
                        {nextActivity ? (
                            <Button asChild size="lg">
                                <Link href={nextActivity.href!}>
                                    {completedActivities > 0 ? "Continue plan" : "Start plan"}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        ) : (
                            <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 font-medium text-emerald-500">
                                <CheckCircle2 className="h-4 w-4" />
                                Plan complete
                            </div>
                        )}
                        <Button asChild variant="outline" size="lg">
                            <Link href={`/tracks/${plan.track.slug}`}>View full track</Link>
                        </Button>
                    </div>
                </header>

                <section className="mt-9" aria-label="Weekly learning plan">
                    <div className="mb-6 max-w-3xl">
                        <h2 className="text-2xl font-bold">Weekly learning loops</h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            Read the week&apos;s lessons in order, then take one section check that combines their themes. Coding labs and project milestones turn those ideas into evidence.
                        </p>
                    </div>

                    <div className="grid gap-9">
                        {plan.weeks.map((week) => {
                            const weekComplete = week.activities.filter((activity) => activity.required).every((activity) => completedActivityIds.has(activity.id))
                            return (
                                <section key={week.number} id={`week-${week.number}`} aria-labelledby={`week-${week.number}-title`}>
                                    <div className="mb-3 flex flex-col gap-2 border-b border-border/40 pb-3 sm:flex-row sm:items-end sm:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 id={`week-${week.number}-title`} tabIndex={-1} className="scroll-mt-24 text-lg font-semibold">Week {week.number}: {week.title}</h3>
                                                {weekComplete && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">Complete</span>}
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground">{week.focus}</p>
                                        </div>
                                        <span className="shrink-0 text-sm text-muted-foreground">About {week.totalMinutes} min</span>
                                    </div>
                                    <ol className="grid gap-2">
                                        {week.activities.map((activity) => {
                                            const complete = completedActivityIds.has(activity.id)
                                            const isNext = nextActivity?.id === activity.id
                                            const content = (
                                                <>
                                                    <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${complete ? "bg-emerald-500/15 text-emerald-500" : "bg-primary/10 text-primary"}`}>
                                                        {complete ? <Check className="h-4 w-4" /> : <ActivityIcon kind={activity.kind} />}
                                                    </span>
                                                    <span className="min-w-0">
                                                        <span className="flex flex-wrap items-center gap-2">
                                                            <span className="text-xs font-semibold uppercase tracking-wide text-primary">{activityLabels[activity.kind]}</span>
                                                            {!activity.required && <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Optional</span>}
                                                            {isNext && <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">Up next</span>}
                                                        </span>
                                                        <span className="mt-1 block font-medium leading-snug group-hover:text-primary">{activity.title}</span>
                                                        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{activity.description}</span>
                                                    </span>
                                                    <span className="shrink-0 text-xs text-muted-foreground sm:text-right">{activity.minutes} min</span>
                                                </>
                                            )
                                            const className = `group grid min-h-16 gap-3 rounded-md border p-3 transition-colors sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:items-center ${
                                                activity.kind === "milestone"
                                                    ? "border-amber-500/30 bg-amber-500/[0.06]"
                                                    : "border-border/45 bg-card/40 hover:border-primary/40 hover:bg-card/70"
                                            }`

                                            return (
                                                <li key={activity.id}>
                                                    {activity.href ? (
                                                        <Link href={activity.href} className={className} aria-current={isNext ? "step" : undefined}>
                                                            {content}
                                                        </Link>
                                                    ) : (
                                                        <div className={className}>{content}</div>
                                                    )}
                                                </li>
                                            )
                                        })}
                                    </ol>
                                </section>
                            )
                        })}
                    </div>
                </section>
            </div>
        )
    }

    const complete = Boolean(goal && level && weeklyHours)

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
            <header className="max-w-3xl border-b border-border/40 pb-7">
                <p className="flex items-center gap-2 text-sm font-medium text-primary"><Target className="h-4 w-4" />Personal plan</p>
                <h1 ref={headingRef} tabIndex={-1} className="mt-3 scroll-mt-24 text-3xl font-bold leading-tight sm:text-5xl">Start with a path you can finish</h1>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                    Choose goal, experience, and weekly time. Get a four-to-twenty-week loop of lessons, weekly section checks, coding labs, project milestones, and final exam.
                </p>
            </header>

            <div className="mt-9 grid gap-10">
                <fieldset>
                    <legend className="text-xl font-semibold">1. What are you working toward?</legend>
                    <p className="mt-1 text-sm text-muted-foreground">Choose role or outcome closest to your goal.</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {learnerGoalOptions.map((option) => (
                            <OptionButton key={option.value} {...option} selected={goal === option.value} onClick={() => setGoal(option.value)} />
                        ))}
                    </div>
                </fieldset>

                <fieldset>
                    <legend className="text-xl font-semibold">2. What is your current level?</legend>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        {experienceLevelOptions.map((option) => (
                            <OptionButton key={option.value} {...option} selected={level === option.value} onClick={() => setLevel(option.value)} />
                        ))}
                    </div>
                </fieldset>

                <fieldset>
                    <legend className="text-xl font-semibold">3. How much time can you study each week?</legend>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        {weeklyHourOptions.map((option) => (
                            <OptionButton key={option.value} {...option} selected={weeklyHours === option.value} onClick={() => setWeeklyHours(option.value)} />
                        ))}
                    </div>
                </fieldset>

                <div className="border-t border-border/40 pt-6">
                    <Button size="lg" disabled={!complete} onClick={createPlan}>
                        Build my plan
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
