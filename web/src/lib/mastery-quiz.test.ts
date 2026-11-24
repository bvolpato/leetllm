import { describe, expect, test } from "vitest"
import {
    extractMasteryQuiz,
    isPassingMasteryScore,
    masteryScorePercent,
    validateMasteryQuizQuestions,
} from "./mastery-quiz"

const questions = Array.from({ length: 5 }, (_, index) => ({
    question: `Question ${index + 1}?`,
    options: ["Correct", "Distractor A", "Distractor B", "Distractor C"],
    answer: "Correct",
    explanation: "Correct is supported by the lesson.",
}))

describe("extractMasteryQuiz", () => {
    test("extracts a valid quiz without leaving its authoring block in article content", () => {
        const markdown = `Before quiz.\n\n\`\`\`mastery-quiz\n${JSON.stringify(questions)}\n\`\`\`\n\nAfter quiz.`
        const result = extractMasteryQuiz(markdown)

        expect(result.questions).toEqual(questions)
        expect(result.content).toBe("Before quiz.\n\nAfter quiz.")
    })

    test("accepts concise three-question quizzes", () => {
        expect(validateMasteryQuizQuestions(questions.slice(0, 3))).toEqual(questions.slice(0, 3))
    })

    test("rejects quizzes with fewer than three questions", () => {
        expect(() => validateMasteryQuizQuestions(questions.slice(0, 2))).toThrow(
            "Mastery quiz needs at least 3 questions",
        )
    })

    test("rejects quizzes with more than ten questions", () => {
        expect(() => validateMasteryQuizQuestions([
            ...questions,
            ...questions.map((question, index) => ({
                ...question,
                question: `Additional question ${index + 1}?`,
            })),
            {
                ...questions[0],
                question: "Eleventh question?",
            },
        ])).toThrow("Mastery quiz allows at most 10 questions")
    })

    test("rejects answers that do not match an option", () => {
        expect(() => validateMasteryQuizQuestions([
            ...questions.slice(0, 4),
            { ...questions[4], answer: "Missing" },
        ])).toThrow("answer must exactly match one option")
    })

    test("rejects questions without exactly four options", () => {
        expect(() => validateMasteryQuizQuestions([
            ...questions.slice(0, 4),
            { ...questions[4], options: questions[4].options.slice(0, 3) },
        ])).toThrow("needs exactly 4 options")
    })
})

describe("mastery scoring", () => {
    test("passes a score of 75 percent or higher", () => {
        expect(isPassingMasteryScore(6, 8)).toBe(true)
        expect(isPassingMasteryScore(5, 8)).toBe(false)
        expect(isPassingMasteryScore(4, 5)).toBe(true)
        expect(masteryScorePercent(4, 5)).toBe(80)
    })
})
