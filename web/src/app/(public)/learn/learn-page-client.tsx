"use client"

import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    ArrowRight,
    Clock,
    BookOpen,
    BrainCircuit,
    ChevronRight,
    ChevronLeft,
    Target,
    Check,
} from "lucide-react"
import Link from "next/link"
import {
    LoginToTrackPrompt,
} from "@/components/reading-progress"
import { useReadingProgress } from "@/lib/reading-progress"
import { useIsLoggedIn } from "@/lib/use-is-logged-in"
import { LearnSearchBox } from "./learn-search-box"
import { LessonVideoButton } from "@/components/lesson-video-button"
import type { LessonVideo } from "@/lib/lesson-videos"

const LEARN_SIDEBAR_STORAGE_KEY = "leetllm_learn_sidebar_visible"

interface ArticleData {
    id: string
    title: string
    slug: string
    shortDescription: string
    difficulty: string
    category: string
    timeEstimate: number
    diffConfig: { color: string; bg: string; border: string }
    catConfig: { icon: string; color: string }
    video?: LessonVideo
}

interface SectionData {
    name: string
    config: { icon: string; description: string; color: string }
    questions: ArticleData[]
}

export function LearnPageClient({
    sectionsData,
    totalCount,
    isLoggedIn,
}: {
    sectionsData: SectionData[]
    totalCount: number
    isLoggedIn?: boolean
}) {
    const { isRead } = useReadingProgress()
    const { isLoggedIn: clientIsLoggedIn, authLoaded } = useIsLoggedIn()
    const [showSidebar, setShowSidebar] = useState(true)
    const sidebarToggleRef = useRef<HTMLButtonElement>(null)
    const restoreToggleFocus = useRef(false)
    const resolvedIsLoggedIn = authLoaded ? clientIsLoggedIn : (isLoggedIn ?? false)

    useEffect(() => {
        if (typeof window === "undefined") return

        try {
            const stored = window.localStorage.getItem(LEARN_SIDEBAR_STORAGE_KEY)
            if (stored === null) return
            queueMicrotask(() => setShowSidebar(stored !== "0"))
        } catch {
            // Browsing the curriculum also works when storage is disabled.
        }
    }, [])

    useEffect(() => {
        if (!restoreToggleFocus.current) return
        sidebarToggleRef.current?.focus({ preventScroll: true })
        restoreToggleFocus.current = false
    }, [showSidebar])

    function toggleSidebar() {
        const next = !showSidebar
        restoreToggleFocus.current = true
        setShowSidebar(next)
        try {
            window.localStorage.setItem(LEARN_SIDEBAR_STORAGE_KEY, next ? "1" : "0")
        } catch {
            // Keep the current session usable without a saved preference.
        }
    }

    const allArticles = sectionsData.flatMap((section) => section.questions)
    const completedCount = allArticles.filter((question) => isRead(question.slug)).length
    const nextUnreadArticle = allArticles.find((question) => !isRead(question.slug))
    const entryArticle = nextUnreadArticle ?? allArticles[0]

    const totalEstimate = sectionsData.reduce(
        (sum, s) => sum + s.questions.reduce((a, q) => a + q.timeEstimate, 0),
        0
    )
    const sectionStats = sectionsData.map((section) => {
        const readCount = section.questions.reduce(
            (count, question) => count + (isRead(question.slug) ? 1 : 0),
            0
        )
        const totalTopics = section.questions.length

        return {
            readCount,
            totalTopics,
        }
    })
    const firstIncompleteStepIndex = sectionStats.findIndex(
        (stats) => stats.totalTopics === 0 || stats.readCount < stats.totalTopics
    )
    const currentStepIndex =
        sectionStats.length === 0
            ? -1
            : firstIncompleteStepIndex === -1
                ? sectionStats.length - 1
                : firstIncompleteStepIndex

        return (
            <div className="learn-reading-page mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                <div className="flex gap-8">
                    {/* ═══ Left Sidebar — Full Curriculum ═══ */}
                {showSidebar ? (
                    <aside data-testid="learn-sidebar" className="hidden lg:block w-64 flex-shrink-0">
                        <div className="sticky top-24 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 pb-8">
                            <div className="flex justify-end">
                                <Button
                                    ref={sidebarToggleRef}
                                    type="button"
                                    variant="outline"
                                    size="icon-sm"
                                    onClick={toggleSidebar}
                                    aria-label="Hide sidebar"
                                    title="Hide sidebar"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            {/* Section Navigation */}
                            {sectionsData.map((section, sectionIndex) => {
                                return (
                                    <div key={section.name}>
                                        <a
                                            href={`#${section.name.toLowerCase().replace(/ /g, "-")}`}
                                            className="flex items-center gap-2 mb-1.5 group rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                            aria-label={`Jump to step ${sectionIndex + 1}: ${section.name}`}
                                        >
                                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-[10px] font-semibold text-primary/90">
                                                {sectionIndex + 1}
                                            </span>
                                            <span className="text-base">{section.config.icon}</span>
                                            <span className="text-xs font-semibold [color:var(--reading-heading)] group-hover:text-primary transition-colors">
                                                {section.name}
                                            </span>
                                        </a>
                                        <nav className="mt-2 space-y-0.5" aria-label={`${section.name} topics`}>
                                            {section.questions.map((q) => {
                                                const read = isRead(q.slug)
                                                return (
                                                    <Link
                                                        key={q.id}
                                                        href={`/learn/${q.slug}`}
                                                        className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${read
                                                            ? "text-emerald-500/90 hover:text-emerald-500"
                                                            : "[color:var(--reading-muted)] hover:[color:var(--reading-heading)] hover:bg-card/80"
                                                            }`}
                                                    >
                                                        {read ? (
                                                            <Check className="h-2.5 w-2.5 flex-shrink-0 text-emerald-400" />
                                                        ) : (
                                                            <ChevronRight className="h-2.5 w-2.5 flex-shrink-0 text-muted-foreground/60" />
                                                        )}
                                                        <span>{q.title}</span>
                                                    </Link>
                                                )
                                            })}
                                        </nav>
                                    </div>
                                )
                            })}

                            {/* Login CTA */}
                            <LoginToTrackPrompt isLoggedIn={resolvedIsLoggedIn} authLoaded={authLoaded} />
                        </div>
                    </aside>
                ) : (
                    <div className="hidden lg:flex w-8 flex-shrink-0">
                        <div className="sticky top-24">
                            <Button
                                ref={sidebarToggleRef}
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                onClick={toggleSidebar}
                                aria-label="Show sidebar"
                                title="Show sidebar"
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* ═══ Main Content ═══ */}
                <div className="flex-1 min-w-0">
                    {/* Hero */}
                    <div className="max-w-3xl mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                            <BookOpen className="h-4 w-4" />
                            All {totalCount} lessons free · No account needed
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                            Learn LLM Engineering
                        </h1>
                        <p className="text-lg [color:var(--reading-muted)] leading-relaxed max-w-2xl">
                            Pick a question you want to answer or a system you want to build.
                            Work through small examples, run the code, and follow the ideas into larger AI systems.
                        </p>
                        {entryArticle && (
                            <div className="mt-6">
                                <div className="flex flex-wrap gap-3">
                                    <Button asChild size="lg" className="h-auto min-h-11 whitespace-normal">
                                        <Link href={`/learn/${entryArticle.slug}`}>
                                            {completedCount === 0 ? "Start learning" : nextUnreadArticle ? "Continue learning" : "Revisit the first lesson"}
                                            <ArrowRight className="h-4 w-4 shrink-0" />
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="lg" className="h-auto min-h-11 whitespace-normal">
                                        <Link href="/start">Build my learning plan</Link>
                                    </Button>
                                </div>
                                <p className="mt-3 text-sm [color:var(--reading-muted)]">
                                    {entryArticle.title} · {entryArticle.timeEstimate} min
                                    {completedCount > 0 && ` · ${completedCount} of ${totalCount} lessons completed`}
                                </p>
                            </div>
                        )}
                        <LearnSearchBox />
                        <div className="flex items-center gap-6 mt-6 text-sm [color:var(--reading-subtle)] flex-wrap">
                            <span className="flex items-center gap-1.5">
                                <Target className="h-4 w-4 text-primary" />
                                {totalCount} topics
                            </span>
                            <span className="flex items-center gap-1.5">
                                <BrainCircuit className="h-4 w-4" />
                                {sectionsData.length} modules
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4" />
                                {Math.round(totalEstimate / 60)}h total content
                            </span>
                            <span className="flex items-center gap-1.5 text-primary">
                                <BookOpen className="h-4 w-4" />
                                Open curriculum
                            </span>
                        </div>
                    </div>

                    {/* Step-by-step Roadmap */}
                    <section
                        className="mb-14"
                        aria-labelledby="roadmap-title"
                        aria-describedby="roadmap-description"
                    >
                        <div className="mb-4">
                            <h2 id="roadmap-title" className="text-lg font-semibold tracking-tight">
                                Step-by-step roadmap
                            </h2>
                            <p id="roadmap-description" className="text-sm [color:var(--reading-muted)]">
                                Start at the beginning if you are new to the field. Each module builds on ideas you have already worked through.
                            </p>
                        </div>



                        <details className="group rounded-xl border border-border/60 bg-card/40">
                            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
                                <ChevronRight aria-hidden className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
                                Explore the {sectionsData.length}-module roadmap
                            </summary>
                        <ol className="space-y-3 px-3 pb-4 sm:px-4" aria-label="Learning roadmap steps">
                            {sectionsData.map((section, sectionIndex) => {
                                const isLastStep = sectionIndex === sectionsData.length - 1
                                const stats = sectionStats[sectionIndex]
                                const readCount = stats?.readCount || 0
                                const totalTopics = stats?.totalTopics || 0
                                const isCompleted =
                                    totalTopics > 0 && readCount === totalTopics
                                const isCurrentStep = sectionIndex === currentStepIndex
                                const stepStatus = isCompleted
                                    ? "Completed"
                                    : isCurrentStep
                                        ? "Current step"
                                        : readCount > 0
                                            ? "In progress"
                                            : "Upcoming"
                                const sectionMinutes = section.questions.reduce(
                                    (sum, question) => sum + question.timeEstimate,
                                    0
                                )
                                const sectionHours = Math.max(
                                    1,
                                    Math.round(sectionMinutes / 60)
                                )

                                return (
                                    <li key={section.name} className="relative pl-14">
                                        {!isLastStep && (
                                            <span
                                                aria-hidden
                                                className={`absolute left-[1.05rem] top-11 bottom-[-0.75rem] w-px ${sectionIndex < currentStepIndex
                                                    ? "bg-primary/40"
                                                    : "bg-border/70"
                                                    }`}
                                            />
                                        )}

                                        <span
                                            className={`absolute left-0 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${isCompleted
                                                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                                                : isCurrentStep
                                                    ? "border-primary/40 bg-primary/15 text-primary"
                                                    : "border-primary/30 bg-primary/10 text-primary"
                                                }`}
                                        >
                                            {sectionIndex + 1}
                                        </span>

                                        <a
                                            href={`#${section.name.toLowerCase().replace(/ /g, "-")}`}
                                            className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                            aria-label={`Open step ${sectionIndex + 1}: ${section.name}`}
                                            aria-current={isCurrentStep ? "step" : undefined}
                                        >
                                            <Card
                                                className={`learn-reading-card transition-all hover:shadow-lg hover:shadow-primary/5 ${isCurrentStep
                                                    ? "border-primary/35"
                                                    : "hover:border-primary/30"
                                                    }`}
                                            >
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <div className="text-xs uppercase tracking-wide text-primary/80 mb-1.5">
                                                                Step {sectionIndex + 1} of {sectionsData.length}
                                                            </div>
                                                            <h3 className="font-semibold text-base group-hover:text-primary transition-colors flex items-center gap-2">
                                                                <span className="text-lg">{section.config.icon}</span>
                                                                {section.name}
                                                            </h3>
                                                        </div>
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${isCompleted
                                                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                                                : isCurrentStep
                                                                    ? "bg-primary/15 text-primary"
                                                                    : "bg-muted/60 text-muted-foreground"
                                                                }`}
                                                        >
                                                            {stepStatus}
                                                        </span>
                                                    </div>

                                                    <p className="text-sm [color:var(--reading-muted)] mt-2 line-clamp-2">
                                                        {section.config.description}
                                                    </p>



                                                    <div className="mt-3 flex items-center gap-4 flex-wrap text-xs [color:var(--reading-subtle)]">
                                                        <span>{section.questions.length} topics</span>
                                                        <span>~{sectionHours}h</span>
                                                        <span className="text-primary/80 inline-flex items-center gap-1">
                                                            {isLastStep
                                                                ? "Final step"
                                                                : `Next: Step ${sectionIndex + 2}`}
                                                            {!isLastStep && (
                                                                <ArrowRight className="h-3 w-3" />
                                                            )}
                                                        </span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </a>
                                    </li>
                                )
                            })}
                        </ol>
                        </details>
                    </section>

                    {/* Sections with Articles */}
                    <div className="space-y-14">
                        {sectionsData.map((section) => {
                            return (
                                <section
                                    key={section.name}
                                    id={section.name.toLowerCase().replace(/ /g, "-")}
                                    className="scroll-mt-24"
                                >
                                    {/* Section Header */}
                                    <div className="flex items-start gap-3 mb-4">
                                        <span className="text-2xl mt-0.5">{section.config.icon}</span>
                                        <div className="flex-1">
                                            <h2 className="text-xl font-bold tracking-tight">
                                                {section.name}
                                            </h2>
                                            <p className="text-sm [color:var(--reading-muted)] mt-0.5">
                                                {section.config.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Articles */}
                                    <div className="grid gap-2">
                                        {section.questions.map((question, i) => (
                                            <ArticleRow
                                                key={question.id}
                                                question={question}
                                                isRead={isRead(question.slug)}
                                                index={i + 1}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )
                        })}
                    </div>

                    {/* Bottom CTA */}
                    {authLoaded && !resolvedIsLoggedIn && (
                        <div className="mt-16">
                            <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20 overflow-hidden">
                                <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-6 py-10 px-8">
                                    <div className="text-center sm:text-left">
                                        <h3 className="text-2xl font-bold mb-2">
                                            Track progress across the curriculum
                                        </h3>
                                        <p className="text-muted-foreground max-w-md">
                                            Create a free account to save read status across devices. Lessons stay open without login.
                                        </p>
                                    </div>
                                        <Button asChild size="lg" className="gap-2 whitespace-nowrap">
                                            <Link href="/signup">
                                            Create Free Account
                                            <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function ArticleRow({
    question,
    isRead,
    index,
}: {
    question: ArticleData
    isRead: boolean
    index: number
}) {
    const content = (
        <div
            className={`group flex items-center gap-3 pl-4 ${question.video ? "pr-16" : "pr-4"} py-3 rounded-lg border transition-all duration-200 ${isRead
                ? "bg-emerald-500/[0.03] border-emerald-500/15 hover:border-emerald-500/25"
                : "bg-card/70 border-border/40 hover:border-primary/30 hover:bg-card/90 cursor-pointer hover:shadow-sm hover:shadow-primary/5"
                }`}
        >
            {/* Status indicator */}
            <div
                className={`flex items-center justify-center w-7 h-7 rounded-md border flex-shrink-0 ${isRead
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : "bg-primary/5 border-primary/10 group-hover:bg-primary/10"
                    } transition-colors`}
            >
                {isRead ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                    <span className="text-xs font-medium text-muted-foreground/70">
                        {index}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <h3
                        className={`font-medium text-sm leading-snug ${isRead
                            ? "text-emerald-500/90"
                            : "group-hover:text-primary transition-colors"
                            }`}
                    >
                        {question.title}
                    </h3>
                </div>
                <p
                    className="text-xs mt-1 line-clamp-2 text-muted-foreground leading-relaxed"
                >
                    {question.shortDescription}
                </p>
                <span className="mt-1 block text-xs text-muted-foreground md:hidden">
                    {question.difficulty} · {question.timeEstimate} min
                </span>
            </div>

            {/* Meta */}
            <div className="hidden md:flex items-center gap-2.5 flex-shrink-0">
                <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${question.diffConfig.bg} ${question.diffConfig.border} ${question.diffConfig.color}`}
                >
                    {question.difficulty}
                </Badge>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {question.timeEstimate}m
                </span>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0">
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
            </div>
        </div>
    )

    return (
        <div className="relative">
            <Link
                href={`/learn/${question.slug}`}
                className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={`${question.title} (${question.timeEstimate} minutes)`}
            >
                {content}
            </Link>
            {question.video && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <LessonVideoButton key={question.video.sha256} video={question.video} iconOnly />
                </div>
            )}
        </div>
    )
}
