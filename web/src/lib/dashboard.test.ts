import { describe, expect, test } from "vitest"
import { findContinueLesson, recentQuizAttempts, weakQuizAttempts, type DashboardLesson } from "./dashboard"
import type { QuizAttempt } from "./study-state"

const lessons: DashboardLesson[] = [
    { slug: "one", title: "One", shortDescription: "", section: "Foundations", timeEstimate: 10 },
    { slug: "two", title: "Two", shortDescription: "", section: "Foundations", timeEstimate: 10 },
    { slug: "three", title: "Three", shortDescription: "", section: "Systems", timeEstimate: 10 },
]

const attempt = (slug: string, score: number, attemptedAt: string): QuizAttempt => ({
    id: `${slug}:${attemptedAt}`,
    slug,
    kind: "mastery",
    correct: score,
    total: 100,
    score,
    passed: score >= 75,
    attemptedAt,
})

describe("dashboard learning state", () => {
    test("continues inside the selected track before the full roadmap", () => {
        expect(findContinueLesson(lessons, [{ slug: "one", completedAt: "2026-01-01" }], ["one", "three"])?.slug).toBe("three")
    })

    test("continues after the most recently completed roadmap lesson", () => {
        expect(findContinueLesson(lessons, [{ slug: "two", completedAt: "2026-01-02" }])?.slug).toBe("three")
    })

    test("removes a weak quiz after a later passing score", () => {
        const history = [
            attempt("attention", 60, "2026-01-01T00:00:00Z"),
            attempt("attention", 80, "2026-01-02T00:00:00Z"),
            attempt("retrieval", 50, "2026-01-03T00:00:00Z"),
        ]
        expect(weakQuizAttempts(history).map((item) => item.slug)).toEqual(["retrieval"])
        expect(recentQuizAttempts(history, 2).map((item) => item.slug)).toEqual(["retrieval", "attention"])
    })
})
