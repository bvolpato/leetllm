import { getQuestionBySlug } from "./questions"
import { getTheoryQuiz } from "./theory-quizzes"
import {
    isPlanAnswers,
    learnerGoalOptions,
} from "./learning-plan"
import type { StudyStateAction } from "./study-state"
import { isPassingQuizScore } from "./mastery-quiz"

export type ValidatedStudyAction =
    | { action: "bookmark"; slug: string; bookmarked: boolean }
    | { action: "note"; slug: string; body: string }
    | { action: "plan"; goal: string; level: string; weeklyHours: number; trackSlug: string }
    | { action: "quiz_attempt"; id: string; kind: "mastery" | "theory"; slug: string; correct: number; total: number; score: number; passed: boolean }

function isLessonSlug(slug: unknown): slug is string {
    return typeof slug === "string" && Boolean(getQuestionBySlug(slug))
}

export function validateStudyAction(value: unknown): ValidatedStudyAction {
    if (!value || typeof value !== "object") throw new Error("Invalid study action")
    const input = value as Partial<StudyStateAction>

    if (input.action === "bookmark") {
        if (!isLessonSlug(input.slug) || typeof input.bookmarked !== "boolean") {
            throw new Error("Invalid bookmark")
        }
        return { action: "bookmark", slug: input.slug, bookmarked: input.bookmarked }
    }

    if (input.action === "note") {
        if (!isLessonSlug(input.slug) || typeof input.body !== "string" || input.body.length > 10000) {
            throw new Error("Invalid note")
        }
        return { action: "note", slug: input.slug, body: input.body.trim() }
    }

    if (input.action === "plan") {
        const answers = input.answers
        if (!isPlanAnswers(answers)) throw new Error("Invalid learning plan")
        const goal = learnerGoalOptions.find((option) => option.value === answers.goal)
        if (!goal) throw new Error("Invalid learning goal")
        return {
            action: "plan",
            goal: answers.goal,
            level: answers.level,
            weeklyHours: answers.weeklyHours,
            trackSlug: goal.trackSlug,
        }
    }

    if (input.action === "quiz_attempt") {
        const kind = input.kind
        const slug = input.slug
        const correct = input.correct
        const total = input.total
        const id = input.id
        const validKind = kind === "mastery" || kind === "theory"
        const validSlug = typeof slug === "string" && (
            kind === "mastery" ? isLessonSlug(slug) : kind === "theory" && Boolean(getTheoryQuiz(slug))
        )
        if (
            !validKind ||
            !validSlug ||
            !Number.isInteger(correct) ||
            !Number.isInteger(total) ||
            typeof correct !== "number" ||
            typeof total !== "number" ||
            correct < 0 ||
            total <= 0 ||
            correct > total
        ) {
            throw new Error("Invalid quiz attempt")
        }
        if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
            throw new Error("Invalid quiz attempt id")
        }
        const score = Math.round((correct / total) * 100)
        return { action: "quiz_attempt", id, kind, slug, correct, total, score, passed: isPassingQuizScore(score) }
    }

    throw new Error("Unknown study action")
}
