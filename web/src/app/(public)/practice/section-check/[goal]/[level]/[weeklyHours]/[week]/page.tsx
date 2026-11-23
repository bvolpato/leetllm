import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, BookOpen, Clock3 } from "lucide-react"
import { KnowledgeCheck } from "@/components/mastery-quiz"
import { Button } from "@/components/ui/button"
import { isPlanAnswers, type PlanAnswers } from "@/lib/learning-plan"
import { getSectionCheck } from "@/lib/learning-plan-server"
import { QUIZ_PASS_PERCENT } from "@/lib/mastery-quiz"

type PageParams = {
    goal: string
    level: string
    weeklyHours: string
    week: string
}

type PageProps = {
    params: Promise<PageParams>
}

function parseParams(params: PageParams): { answers: PlanAnswers; weekNumber: number } | null {
    const answers = {
        goal: params.goal,
        level: params.level,
        weeklyHours: Number(params.weeklyHours),
    }
    const weekNumber = Number(params.week)
    if (!isPlanAnswers(answers) || !Number.isInteger(weekNumber) || weekNumber < 1) return null
    return { answers, weekNumber }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const parsed = parseParams(await params)
    if (!parsed) return {}
    const check = getSectionCheck(parsed.answers, parsed.weekNumber)
    if (!check) return {}

    return {
        title: `Week ${check.week.number} Section Check | ${check.plan.track.title}`,
        description: `Answer ${check.questions.length} questions across ${check.week.lessons.length} lessons from week ${check.week.number} of ${check.plan.track.title}.`,
    }
}

export default async function SectionCheckPage({ params }: PageProps) {
    const parsed = parseParams(await params)
    if (!parsed) notFound()
    const check = getSectionCheck(parsed.answers, parsed.weekNumber)
    if (!check || check.questions.length === 0) notFound()
    const planParams = new URLSearchParams({
        goal: parsed.answers.goal,
        level: parsed.answers.level,
        weeklyHours: String(parsed.answers.weeklyHours),
    })

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
            <Button asChild variant="ghost" size="sm" className="-ml-2 mb-6 text-muted-foreground">
                <Link href={`/start?${planParams}#week-${check.week.number}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to plan
                </Link>
            </Button>

            <header className="mb-8 border-b border-border/40 pb-7">
                <p className="text-sm font-medium text-primary">{check.plan.track.title} · Week {check.week.number}</p>
                <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-5xl">Weekly section check</h1>
                <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                    Answer {check.questions.length} questions that connect this week&apos;s ideas. Questions draw from every lesson below, not a separate rereading task.
                </p>
                <div className="mt-5 flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {check.week.lessons.length} {check.week.lessons.length === 1 ? "lesson" : "lessons"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        About 15 minutes
                    </span>
                </div>
                <ul className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
                    {check.week.lessons.map((lesson) => (
                        <li key={lesson.slug} className="rounded-md border border-border/45 bg-card/40 px-3 py-2">
                            {lesson.title}
                        </li>
                    ))}
                </ul>
            </header>

            <KnowledgeCheck
                slug={check.slug}
                questions={check.questions}
                kind="section"
                eyebrow={`Complete week ${check.week.number}`}
                title="Section Check"
                description={`Answer all ${check.questions.length} questions without notes. Score ${QUIZ_PASS_PERCENT}% or higher to complete this week's check.`}
                completionLabel="Week check complete"
            />
        </div>
    )
}
