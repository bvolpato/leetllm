import type { QuizAttempt } from "./study-state"

export type DashboardLesson = {
    slug: string
    title: string
    shortDescription: string
    section: string
    timeEstimate: number
}

export type CompletedItem = {
    slug: string
    completedAt: string
}

export function findContinueLesson(
    lessons: DashboardLesson[],
    completed: CompletedItem[],
    preferredSlugs?: string[]
): DashboardLesson | null {
    const completedSet = new Set(completed.map((item) => item.slug))
    if (preferredSlugs) {
        const preferred = preferredSlugs
            .map((slug) => lessons.find((lesson) => lesson.slug === slug))
            .find((lesson) => lesson && !completedSet.has(lesson.slug))
        if (preferred) return preferred
    }

    const latest = [...completed]
        .filter((item) => lessons.some((lesson) => lesson.slug === item.slug))
        .sort((left, right) => right.completedAt.localeCompare(left.completedAt))[0]
    if (latest) {
        const latestIndex = lessons.findIndex((lesson) => lesson.slug === latest.slug)
        const afterLatest = lessons.slice(latestIndex + 1).find((lesson) => !completedSet.has(lesson.slug))
        if (afterLatest) return afterLatest
    }

    return lessons.find((lesson) => !completedSet.has(lesson.slug)) ?? null
}

export function weakQuizAttempts(attempts: QuizAttempt[]): QuizAttempt[] {
    const bestByQuiz = new Map<string, QuizAttempt>()
    for (const attempt of attempts) {
        const key = `${attempt.kind}:${attempt.slug}`
        const current = bestByQuiz.get(key)
        if (!current || attempt.score > current.score) bestByQuiz.set(key, attempt)
    }
    return [...bestByQuiz.values()]
        .filter((attempt) => !attempt.passed)
        .sort((left, right) => left.score - right.score || right.attemptedAt.localeCompare(left.attemptedAt))
}

export function recentQuizAttempts(attempts: QuizAttempt[], limit = 5): QuizAttempt[] {
    return [...attempts]
        .sort((left, right) => right.attemptedAt.localeCompare(left.attemptedAt))
        .slice(0, limit)
}
