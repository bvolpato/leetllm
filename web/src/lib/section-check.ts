import type { PlanAnswers } from "./learning-plan"
import type { MasteryQuizQuestion } from "./mastery-quiz"

export const SECTION_CHECK_QUESTION_COUNT = 10

export type SectionCheckLesson = {
    slug: string
    title: string
    questions: MasteryQuizQuestion[]
}

export type SectionCheckQuestion = MasteryQuizQuestion & {
    lessonSlug: string
    section: string
}

function hashString(value: string): string {
    let hash = 2166136261
    for (const character of value) {
        hash ^= character.charCodeAt(0)
        hash = Math.imul(hash, 16777619)
    }
    return (hash >>> 0).toString(16).padStart(8, "0")
}

export function getSectionCheckSlug(
    answers: PlanAnswers,
    weekNumber: number,
    lessonSlugs: string[],
): string {
    const lessonHash = hashString(lessonSlugs.join("|"))
    return `${answers.goal}-${answers.level}-${answers.weeklyHours}h-week-${weekNumber}-${lessonHash}`
}

export function getSectionCheckHref(answers: PlanAnswers, weekNumber: number): string {
    return `/practice/section-check/${answers.goal}/${answers.level}/${answers.weeklyHours}/${weekNumber}`
}

export function getSectionCheckHrefFromSlug(slug: string): string | null {
    const match = slug.match(/^(foundations|ml|rag|agents|inference|training|research|interviews)-(new|working|advanced)-(2|4|6)h-week-([1-9]|1\d|20)-[0-9a-f]{8}$/)
    if (!match) return null
    return `/practice/section-check/${match[1]}/${match[2]}/${match[3]}/${match[4]}`
}

export function buildSectionCheckQuestions(
    lessons: SectionCheckLesson[],
): SectionCheckQuestion[] {
    if (lessons.length === 0) return []

    const selected: SectionCheckQuestion[] = []
    const prompts = new Set<string>()
    const maxLessonQuestions = Math.max(...lessons.map((lesson) => lesson.questions.length))

    for (let questionIndex = 0; questionIndex < maxLessonQuestions && selected.length < SECTION_CHECK_QUESTION_COUNT; questionIndex += 1) {
        for (const lesson of lessons) {
            const question = lesson.questions[questionIndex]
            if (!question) continue
            const normalizedPrompt = question.question.trim().toLowerCase()
            if (prompts.has(normalizedPrompt)) continue

            prompts.add(normalizedPrompt)
            selected.push({
                ...question,
                lessonSlug: lesson.slug,
                section: lesson.title,
            })
            if (selected.length === SECTION_CHECK_QUESTION_COUNT) break
        }
    }

    if (selected.length < SECTION_CHECK_QUESTION_COUNT) {
        throw new Error(
            `Weekly section check for ${lessons.map((lesson) => lesson.slug).join(", ")} needs ${SECTION_CHECK_QUESTION_COUNT} unique questions, found ${selected.length}`,
        )
    }

    return selected
}
