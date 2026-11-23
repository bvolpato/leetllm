import { render } from "@testing-library/react"
import { describe, expect, test } from "vitest"
import { getPracticeProblems } from "@/lib/practice"
import { getQuestions } from "@/lib/questions"
import { getTheoryQuizzes } from "@/lib/theory-quizzes"
import {
    HOME_LESSON_COUNT,
    HOME_PRACTICE_PROBLEM_COUNT,
    HOME_THEORY_QUIZ_COUNT,
    HOME_UPDATED_LABEL,
} from "@/lib/home-stats"
import LandingPage, { metadata } from "./page"

describe("landing page", () => {
    test("homepage stats match current published corpus", () => {
        expect(HOME_LESSON_COUNT).toBe(getQuestions().length)
        expect(HOME_PRACTICE_PROBLEM_COUNT).toBe(getPracticeProblems().length)
        expect(HOME_THEORY_QUIZ_COUNT).toBe(getTheoryQuizzes().length)
    }, 15_000)

    test("renders current homepage truth instead of stale counts", () => {
        const { container } = render(<LandingPage />)
        const text = container.textContent ?? ""

        expect(text).toContain(`${HOME_LESSON_COUNT} Lessons`)
        expect(text).toContain(`${HOME_THEORY_QUIZ_COUNT} Quizzes`)
        expect(text).toContain(`${HOME_PRACTICE_PROBLEM_COUNT} Coding Drills`)
        expect(text).toContain(HOME_UPDATED_LABEL)
        expect(text).toContain(`${HOME_LESSON_COUNT} expert deep-dive lessons`)
        expect(text).toContain(`${HOME_THEORY_QUIZ_COUNT} global theory quizzes`)
        expect(text).toContain(`${HOME_PRACTICE_PROBLEM_COUNT} coding drills`)
        expect(text).not.toContain("100+")
        expect(text).not.toContain("Updated May 2026")
    })

    test("homepage metadata uses current counts", () => {
        expect(metadata.description).toContain(`${HOME_LESSON_COUNT} free lessons`)
        expect(metadata.description).toContain(`${HOME_THEORY_QUIZ_COUNT} global quizzes`)
        expect(metadata.description).toContain(`${HOME_PRACTICE_PROBLEM_COUNT} coding drills`)
    })
})
