import { describe, expect, it } from "vitest"
import { getTheoryQuiz, getTheoryQuizListItems, getTheoryQuizzes } from "./theory-quizzes"

describe("theory quizzes", () => {
    it("loads global quiz decks by level", () => {
        const quizzes = getTheoryQuizzes()

        expect(quizzes.map((quiz) => quiz.level)).toEqual(["Beginner", "Intermediate", "Advanced", "Expert"])
        expect(quizzes.every((quiz) => quiz.questions.length >= 10)).toBe(true)
        expect(getTheoryQuiz("advanced-training-inference-architecture")?.title).toBe("Advanced Training and Inference Architecture")
        expect(getTheoryQuiz("missing")).toBeNull()
    })

    it("keeps questions rigorous and mobile-friendly", () => {
        for (const quiz of getTheoryQuizzes()) {
            expect(quiz.sections.length, quiz.slug).toBeGreaterThanOrEqual(4)
            for (const question of quiz.questions) {
                expect(question.options).toHaveLength(4)
                expect(question.options).toContain(question.answer)
                expect(new Set(question.options).size).toBe(question.options.length)
                expect(question.explanation.length).toBeGreaterThan(40)
            }
        }
    })

    it("exposes compact list items for practice navigation", () => {
        const items = getTheoryQuizListItems()

        expect(items).toHaveLength(4)
        expect(items[0]).toMatchObject({
            slug: "beginner-ai-systems-foundations",
            level: "Beginner",
            questionCount: 12,
        })
    })
})
