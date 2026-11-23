"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
    ArrowRight,
    Bookmark,
    BookOpen,
    BrainCircuit,
    Check,
    CheckCircle2,
    Clock,
    Code2,
    FileQuestion,
    Flag,
    GraduationCap,
    LoaderCircle,
    NotebookPen,
    RotateCcw,
    Route,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    buildLearningPlan,
    getCompletedPlanActivityIds,
    isPlanAnswers,
    type LearningPlanCatalog,
    type PlanActivity,
    type PlanAnswers,
    type PlanTrack,
} from "@/lib/learning-plan"
import { findContinueLesson, recentQuizAttempts, weakQuizAttempts, type CompletedItem, type DashboardLesson } from "@/lib/dashboard"
import { getSectionCheckHrefFromSlug } from "@/lib/section-check"
import {
    readLocalBookmarks,
    readLocalNotes,
    readLocalQuizHistory,
    readLocalReadProgress,
    mergeReadProgress,
    migrateLegacyQuizResults,
    removeLocalQuizAttempt,
    shouldSyncReadProgress,
    syncStudyAction,
    writeLocalBookmarks,
    writeLocalNotes,
    writeLocalReadProgress,
    type QuizAttempt,
    type ReadProgressItem,
    type StudyBookmark,
    type StudyNote,
    type StudyState,
} from "@/lib/study-state"

const PLAN_STORAGE_KEY = "leetllm_learning_plan_v1"

type QuizSummary = { slug: string; title: string; level: string }
type ProgressResponse = { slugs?: string[]; completed?: CompletedItem[]; progress?: ReadProgressItem[] }
type LocalPlan = PlanAnswers & { updatedAt?: string }

function readLocalPlan(): LocalPlan | null {
    try {
        const raw = localStorage.getItem(PLAN_STORAGE_KEY)
        const value: unknown = raw ? JSON.parse(raw) : null
        return isPlanAnswers(value) ? value as LocalPlan : null
    } catch {
        return null
    }
}

function readLocalSlugArray(key: string): string[] {
    try {
        const value: unknown = JSON.parse(localStorage.getItem(key) ?? "[]")
        return Array.isArray(value) ? value.filter((slug): slug is string => typeof slug === "string") : []
    } catch {
        return []
    }
}

function mergeBookmarks(remote: StudyBookmark[], local: StudyBookmark[]) {
    const bySlug = new Map<string, StudyBookmark>()
    for (const bookmark of [...local, ...remote]) {
        const current = bySlug.get(bookmark.slug)
        if (!current || bookmark.updatedAt > current.updatedAt) bySlug.set(bookmark.slug, bookmark)
    }
    return [...bySlug.values()].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

function mergeNotes(remote: StudyNote[], local: StudyNote[]) {
    const bySlug = new Map<string, StudyNote>()
    for (const note of [...local, ...remote]) {
        const current = bySlug.get(note.slug)
        if (!current || note.updatedAt > current.updatedAt) bySlug.set(note.slug, note)
    }
    return [...bySlug.values()].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

export function DashboardClient({
    lessons,
    tracks,
    quizzes,
    catalog,
}: {
    lessons: DashboardLesson[]
    tracks: PlanTrack[]
    quizzes: QuizSummary[]
    catalog: LearningPlanCatalog
}) {
    const [loading, setLoading] = useState(true)
    const [completedLessons, setCompletedLessons] = useState<CompletedItem[]>([])
    const [completedPractice, setCompletedPractice] = useState<string[]>([])
    const [completedTheory, setCompletedTheory] = useState<string[]>([])
    const [bookmarks, setBookmarks] = useState<StudyBookmark[]>([])
    const [notes, setNotes] = useState<StudyNote[]>([])
    const [attempts, setAttempts] = useState<QuizAttempt[]>([])
    const [answers, setAnswers] = useState<PlanAnswers | null>(null)

    useEffect(() => {
        const localBookmarks = readLocalBookmarks()
        const localNotes = readLocalNotes()
        migrateLegacyQuizResults()
        const localAttempts = readLocalQuizHistory()
        const localPlan = readLocalPlan()
        const localLessonProgress = readLocalReadProgress()
        const localPracticeSlugs = readLocalSlugArray("leetllm_learned_practice")
        const localTheorySlugs = readLocalSlugArray("leetllm_completed_theory_quizzes")

        Promise.all([
            fetch("/api/progress").then((response) => response.ok ? response.json() : { slugs: [], completed: [] }).catch(() => ({ slugs: [], completed: [] })) as Promise<ProgressResponse>,
            fetch("/api/practice/progress").then((response) => response.ok ? response.json() : { slugs: [] }).catch(() => ({ slugs: [] })) as Promise<ProgressResponse>,
            fetch("/api/practice/progress?kind=quiz").then((response) => response.ok ? response.json() : { slugs: [] }).catch(() => ({ slugs: [] })) as Promise<ProgressResponse>,
            fetch("/api/study-state").then((response) => response.ok ? response.json() : { bookmarks: [], notes: [], quizAttempts: [], plan: null }).catch(() => ({ bookmarks: [], notes: [], quizAttempts: [], plan: null })) as Promise<StudyState>,
        ])
            .then(async ([lessonProgress, practiceProgress, theoryProgress, remote]) => {
                const mergedBookmarks = mergeBookmarks(remote.bookmarks ?? [], localBookmarks)
                const mergedNotes = mergeNotes(remote.notes ?? [], localNotes)
                const remotePlan = remote.plan && isPlanAnswers(remote.plan) ? remote.plan : null
                const selectedPlan = localPlan?.updatedAt && remotePlan?.updatedAt && localPlan.updatedAt > remotePlan.updatedAt
                    ? localPlan
                    : remotePlan ?? localPlan

                const remoteLessonProgress = lessonProgress.progress ?? (lessonProgress.completed ?? []).map((item) => ({
                    slug: item.slug,
                    completed: true,
                    updatedAt: item.completedAt,
                }))
                const mergedReadProgress = mergeReadProgress(remoteLessonProgress, localLessonProgress)
                const mergedLessonProgress = mergedReadProgress
                    .filter((item) => item.completed)
                    .map((item) => ({ slug: item.slug, completedAt: item.updatedAt }))
                const mergedPractice = [...new Set([...(practiceProgress.slugs ?? []), ...localPracticeSlugs])]
                const mergedTheory = [...new Set([...(theoryProgress.slugs ?? []), ...localTheorySlugs])]

                setCompletedLessons(mergedLessonProgress)
                setCompletedPractice(mergedPractice)
                setCompletedTheory(mergedTheory)
                setBookmarks(mergedBookmarks)
                setNotes(mergedNotes)
                const mergedAttempts = new Map<string, QuizAttempt>()
                for (const attempt of [...(remote.quizAttempts ?? []), ...localAttempts]) {
                    const key = attempt.id ?? `${attempt.kind}:${attempt.slug}:${attempt.correct}:${attempt.total}:${attempt.attemptedAt}`
                    mergedAttempts.set(key, attempt)
                }
                setAttempts([...mergedAttempts.values()])
                setAnswers(selectedPlan)
                writeLocalBookmarks(mergedBookmarks)
                writeLocalNotes(mergedNotes)
                writeLocalReadProgress(mergedReadProgress)
                if (selectedPlan) localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(selectedPlan))

                const pending: Promise<void>[] = []
                const remoteLessonBySlug = new Map(remoteLessonProgress.map((item) => [item.slug, item]))
                for (const item of localLessonProgress) {
                    const remoteItem = remoteLessonBySlug.get(item.slug)
                    if (shouldSyncReadProgress(item, remoteItem)) {
                        pending.push(fetch("/api/progress", {
                            method: item.completed ? "POST" : "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ slug: item.slug }),
                        }).then((response) => { if (!response.ok) throw new Error("Lesson sync failed") }))
                    }
                }
                const remotePracticeSlugs = new Set(practiceProgress.slugs ?? [])
                for (const slug of localPracticeSlugs) {
                    if (!remotePracticeSlugs.has(slug)) {
                        pending.push(fetch("/api/practice/progress", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ slug, kind: "coding" }),
                        }).then((response) => { if (!response.ok) throw new Error("Practice sync failed") }))
                    }
                }
                const remoteTheorySlugs = new Set(theoryProgress.slugs ?? [])
                for (const slug of localTheorySlugs) {
                    if (!remoteTheorySlugs.has(slug)) {
                        pending.push(fetch("/api/practice/progress", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ slug, kind: "quiz" }),
                        }).then((response) => { if (!response.ok) throw new Error("Quiz progress sync failed") }))
                    }
                }
                const remoteBookmarks = new Map((remote.bookmarks ?? []).map((item) => [item.slug, item]))
                for (const bookmark of localBookmarks) {
                    const remoteBookmark = remoteBookmarks.get(bookmark.slug)
                    if (!remoteBookmark || bookmark.updatedAt > remoteBookmark.updatedAt) {
                        pending.push(syncStudyAction({ action: "bookmark", slug: bookmark.slug, bookmarked: bookmark.bookmarked }))
                    }
                }
                const remoteNotes = new Map((remote.notes ?? []).map((item) => [item.slug, item]))
                for (const note of localNotes) {
                    const remoteNote = remoteNotes.get(note.slug)
                    if (!remoteNote || note.updatedAt > remoteNote.updatedAt) {
                        pending.push(syncStudyAction({ action: "note", slug: note.slug, body: note.deleted ? "" : note.body }))
                    }
                }
                for (const attempt of localAttempts) {
                    if (attempt.kind === "section") continue
                    pending.push(syncStudyAction({
                        action: "quiz_attempt",
                        id: attempt.id,
                        kind: attempt.kind,
                        slug: attempt.slug,
                        correct: attempt.correct,
                        total: attempt.total,
                    }).then(() => removeLocalQuizAttempt(attempt.id)))
                }
                if (localPlan && (!remotePlan || Boolean(localPlan.updatedAt && localPlan.updatedAt > remotePlan.updatedAt))) {
                    pending.push(syncStudyAction({ action: "plan", answers: localPlan }))
                }
                if (pending.length > 0) {
                    await Promise.all(pending)
                }
            })
            .catch(() => {
                setBookmarks(localBookmarks)
                setNotes(localNotes)
                setAttempts(localAttempts)
                setAnswers(localPlan)
            })
            .finally(() => setLoading(false))
    }, [])

    const plan = useMemo(() => answers ? buildLearningPlan(tracks, answers, catalog) : null, [answers, catalog, tracks])
    const completedSet = useMemo(() => new Set(completedLessons.map((item) => item.slug)), [completedLessons])
    const completedPracticeSet = useMemo(() => new Set(completedPractice), [completedPractice])
    const completedTheorySet = useMemo(() => new Set(completedTheory), [completedTheory])
    const passedSectionSet = useMemo(
        () => new Set(attempts.filter((attempt) => attempt.kind === "section" && attempt.passed).map((attempt) => attempt.slug)),
        [attempts]
    )
    const completedPlanActivityIds = useMemo(() => plan ? getCompletedPlanActivityIds(plan, {
        readLessonSlugs: completedSet,
        passedSectionSlugs: passedSectionSet,
        completedPracticeSlugs: completedPracticeSet,
        passedTheorySlugs: completedTheorySet,
    }) : new Set<string>(), [completedPracticeSet, completedSet, completedTheorySet, passedSectionSet, plan])
    const planActivities = useMemo(() => plan?.weeks.flatMap((week) => week.activities) ?? [], [plan])
    const requiredPlanActivities = planActivities.filter((activity) => activity.required)
    const nextPlanActivity = requiredPlanActivities.find((activity) => !completedPlanActivityIds.has(activity.id) && activity.href)
    const continueLesson = findContinueLesson(
        lessons,
        completedLessons,
        plan?.track.lessons.map((lesson) => lesson.slug)
    )
    const currentWeek = plan?.weeks.find((week) => week.activities.some((activity) => activity.required && !completedPlanActivityIds.has(activity.id)))
    const weak = weakQuizAttempts(attempts).slice(0, 3)
    const recent = recentQuizAttempts(attempts)
    const lessonBySlug = useMemo(() => new Map(lessons.map((lesson) => [lesson.slug, lesson])), [lessons])
    const quizBySlug = useMemo(() => new Map(quizzes.map((quiz) => [quiz.slug, quiz])), [quizzes])
    const activeBookmarks = bookmarks.filter((bookmark) => bookmark.bookmarked)
    const activeNotes = notes.filter((note) => !note.deleted)

    function quizTitle(attempt: QuizAttempt) {
        if (attempt.kind === "section") return "Weekly section check"
        return attempt.kind === "mastery"
            ? lessonBySlug.get(attempt.slug)?.title ?? attempt.slug
            : quizBySlug.get(attempt.slug)?.title ?? attempt.slug
    }

    function quizHref(attempt: QuizAttempt) {
        if (attempt.kind === "section") return getSectionCheckHrefFromSlug(attempt.slug) ?? "/start"
        return attempt.kind === "mastery" ? `/learn/${attempt.slug}#mastery-quiz` : `/practice?quiz=${attempt.slug}#theory-quiz`
    }

    function planActivityIcon(activity: PlanActivity) {
        if (activity.kind === "section") return <BrainCircuit className="h-4 w-4" />
        if (activity.kind === "coding") return <Code2 className="h-4 w-4" />
        if (activity.kind === "exam") return <GraduationCap className="h-4 w-4" />
        if (activity.kind === "milestone") return <Flag className="h-4 w-4" />
        return <BookOpen className="h-4 w-4" />
    }

    function planActivityLabel(activity: PlanActivity) {
        if (activity.kind === "section") return "Section check"
        if (activity.kind === "coding") return "Coding lab"
        return activity.kind
    }

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center" aria-label="Loading learning dashboard">
                <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-5xl pb-10">
            <header className="border-b border-border/40 pb-6">
                <p className="text-sm font-medium text-primary">Your learning</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Pick up where you left off</h1>
                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    <span>{completedLessons.length} lessons completed</span>
                    <span>{completedTheory.length} theory quizzes passed</span>
                    <span>{completedPractice.length} coding problems passed</span>
                </div>
            </header>

            <section className="py-7" aria-labelledby="continue-heading">
                <h2 id="continue-heading" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Continue</h2>
                {nextPlanActivity?.href ? (
                    <Link
                        href={nextPlanActivity.href}
                        className="group mt-3 grid gap-3 rounded-lg border border-primary/30 bg-primary/[0.045] p-4 transition-colors hover:border-primary/50 hover:bg-primary/[0.075] sm:grid-cols-[auto_1fr_auto] sm:items-center"
                    >
                        <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">{planActivityIcon(nextPlanActivity)}</span>
                        <span className="min-w-0">
                            <span className="block font-semibold group-hover:text-primary">{nextPlanActivity.title}</span>
                            <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{nextPlanActivity.description}</span>
                            <span className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="capitalize">{planActivityLabel(nextPlanActivity)}</span>
                                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{nextPlanActivity.minutes} min</span>
                            </span>
                        </span>
                        <ArrowRight className="h-5 w-5 text-primary" />
                    </Link>
                ) : !plan && continueLesson ? (
                    <Link
                        href={`/learn/${continueLesson.slug}`}
                        className="group mt-3 grid gap-3 rounded-lg border border-primary/30 bg-primary/[0.045] p-4 transition-colors hover:border-primary/50 hover:bg-primary/[0.075] sm:grid-cols-[auto_1fr_auto] sm:items-center"
                    >
                        <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary"><BookOpen className="h-5 w-5" /></span>
                        <span className="min-w-0">
                            <span className="block font-semibold group-hover:text-primary">{continueLesson.title}</span>
                            <span className="mt-1 line-clamp-1 block text-sm text-muted-foreground">{continueLesson.shortDescription}</span>
                            <span className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{continueLesson.section}</span>
                                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{continueLesson.timeEstimate} min</span>
                            </span>
                        </span>
                        <ArrowRight className="h-5 w-5 text-primary" />
                    </Link>
                ) : (
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-500">
                        <CheckCircle2 className="h-4 w-4" />
                        Plan complete. Review weak topics or choose next track.
                    </div>
                )}
            </section>

            <div className="grid gap-10 border-t border-border/40 py-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
                <section aria-labelledby="plan-heading">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 id="plan-heading" className="text-xl font-semibold">Current plan</h2>
                            {plan && <p className="mt-1 text-sm text-muted-foreground">{plan.track.title} · {plan.answers.weeklyHours === 2 ? "2+ hours/week" : `${plan.answers.weeklyHours} hours/week`}</p>}
                        </div>
                        <Button asChild variant="ghost" size="sm" className="gap-2">
                            <Link href="/start"><Route className="h-4 w-4" />{plan ? "Edit" : "Build plan"}</Link>
                        </Button>
                    </div>

                    {plan && currentWeek ? (
                        <div className="mt-5">
                            <div className="mb-3 flex items-center justify-between text-sm">
                                <span className="font-medium">Week {currentWeek.number} of {plan.weeks.length}: {currentWeek.title}</span>
                                <span className="text-muted-foreground">About {currentWeek.totalMinutes} min</span>
                            </div>
                            <ol className="grid gap-2">
                                {currentWeek.activities.map((activity) => {
                                    const complete = completedPlanActivityIds.has(activity.id)
                                    const content = (
                                        <>
                                            <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs ${complete ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                                                {complete ? <Check className="h-3.5 w-3.5" /> : planActivityIcon(activity)}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-xs font-medium uppercase tracking-wide text-primary">
                                                    {planActivityLabel(activity)}
                                                </span>
                                                <span className="mt-0.5 block text-sm font-medium group-hover:text-primary">{activity.title}</span>
                                            </span>
                                            <span className="text-xs text-muted-foreground">{activity.minutes}m</span>
                                        </>
                                    )
                                    return (
                                        <li key={activity.id}>
                                            {activity.href ? (
                                                <Link href={activity.href} className="group flex min-h-12 items-center gap-3 rounded-md border border-border/45 px-3 py-2 hover:border-primary/35 hover:bg-card/60">
                                                    {content}
                                                </Link>
                                            ) : (
                                                <div className="group flex min-h-12 items-center gap-3 rounded-md border border-amber-500/30 bg-amber-500/[0.05] px-3 py-2">
                                                    {content}
                                                </div>
                                            )}
                                        </li>
                                    )
                                })}
                            </ol>
                        </div>
                    ) : plan ? (
                        <div className="mt-5 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-emerald-500">
                            <CheckCircle2 className="h-4 w-4" />
                            All {requiredPlanActivities.length} required plan activities complete.
                        </div>
                    ) : (
                        <div className="mt-5 rounded-md border border-dashed border-border/60 p-5">
                            <p className="font-medium">No focused plan yet</p>
                            <p className="mt-1 text-sm text-muted-foreground">Choose one goal and get a four-to-twenty-week path.</p>
                            <Button asChild size="sm" className="mt-4"><Link href="/start">Build my plan</Link></Button>
                        </div>
                    )}
                </section>

                <section aria-labelledby="review-heading">
                    <h2 id="review-heading" className="text-xl font-semibold">Review next</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Quizzes below mastery threshold.</p>
                    {weak.length > 0 ? (
                        <div className="mt-4 grid gap-2">
                            {weak.map((attempt) => (
                                <Link key={`${attempt.kind}:${attempt.slug}`} href={quizHref(attempt)} className="group flex items-center gap-3 rounded-md border border-border/45 p-3 hover:border-primary/35 hover:bg-card/60">
                                    <RotateCcw className="h-4 w-4 shrink-0 text-amber-500" />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium group-hover:text-primary">{quizTitle(attempt)}</span>
                                        <span className="text-xs text-muted-foreground">Best score {attempt.score}%</span>
                                    </span>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="mt-4 rounded-md border border-dashed border-border/60 p-4 text-sm text-muted-foreground">No weak topics yet. Quiz results will create a focused review queue.</p>
                    )}
                </section>
            </div>

            <section className="border-t border-border/40 pt-7" aria-labelledby="library-heading">
                <h2 id="library-heading" className="text-xl font-semibold">Study library</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <details className="rounded-md border border-border/45 bg-card/30 p-4">
                        <summary className="flex cursor-pointer list-none items-center gap-2 font-medium"><Bookmark className="h-4 w-4 text-primary" />Bookmarks <span className="ml-auto text-sm text-muted-foreground">{activeBookmarks.length}</span></summary>
                        <div className="mt-4 grid gap-2 border-t border-border/40 pt-3">
                            {activeBookmarks.length > 0 ? activeBookmarks.slice(0, 8).map((bookmark) => (
                                <Link key={bookmark.slug} href={`/learn/${bookmark.slug}`} className="line-clamp-2 text-sm hover:text-primary">{lessonBySlug.get(bookmark.slug)?.title ?? bookmark.slug}</Link>
                            )) : <span className="text-sm text-muted-foreground">Bookmark lessons to keep them here.</span>}
                        </div>
                    </details>

                    <details className="rounded-md border border-border/45 bg-card/30 p-4">
                        <summary className="flex cursor-pointer list-none items-center gap-2 font-medium"><NotebookPen className="h-4 w-4 text-primary" />Notes <span className="ml-auto text-sm text-muted-foreground">{activeNotes.length}</span></summary>
                        <div className="mt-4 grid gap-3 border-t border-border/40 pt-3">
                            {activeNotes.length > 0 ? activeNotes.slice(0, 8).map((note) => (
                                <Link key={note.slug} href={`/learn/${note.slug}`} className="group">
                                    <span className="line-clamp-1 text-sm font-medium group-hover:text-primary">{lessonBySlug.get(note.slug)?.title ?? note.slug}</span>
                                    <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{note.body}</span>
                                </Link>
                            )) : <span className="text-sm text-muted-foreground">Lesson notes will appear here.</span>}
                        </div>
                    </details>

                    <details className="rounded-md border border-border/45 bg-card/30 p-4">
                        <summary className="flex cursor-pointer list-none items-center gap-2 font-medium"><FileQuestion className="h-4 w-4 text-primary" />Quiz history <span className="ml-auto text-sm text-muted-foreground">{attempts.length}</span></summary>
                        <div className="mt-4 grid gap-3 border-t border-border/40 pt-3">
                            {recent.length > 0 ? recent.map((attempt) => (
                                <Link key={`${attempt.kind}:${attempt.slug}:${attempt.attemptedAt}`} href={quizHref(attempt)} className="flex items-start justify-between gap-3 text-sm hover:text-primary">
                                    <span className="line-clamp-2">{quizTitle(attempt)}</span>
                                    <span className={attempt.passed ? "text-emerald-500" : "text-amber-500"}>{attempt.score}%</span>
                                </Link>
                            )) : <span className="text-sm text-muted-foreground">Submitted quizzes will appear here.</span>}
                        </div>
                    </details>
                </div>
            </section>
        </div>
    )
}
