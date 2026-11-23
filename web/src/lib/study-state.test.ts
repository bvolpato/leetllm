import { beforeEach, describe, expect, test } from "vitest"
import {
    readLocalBookmarks,
    readLocalNotes,
    readLocalQuizHistory,
    readLocalReadProgress,
    mergeReadProgress,
    migrateLegacyQuizResults,
    recordLocalQuizAttempt,
    removeLocalQuizAttempt,
    shouldSyncReadProgress,
} from "./study-state"

describe("local study state", () => {
    beforeEach(() => localStorage.clear())

    test("migrates legacy bookmarks and notes", () => {
        localStorage.setItem("leetllm_bookmarked_lessons", JSON.stringify([
            { slug: "attention", createdAt: "2026-01-01T00:00:00Z" },
        ]))
        localStorage.setItem("leetllm_lesson_notes", JSON.stringify([
            { slug: "attention", body: "Review masking", updatedAt: "2026-01-01T00:00:00Z" },
        ]))

        expect(readLocalBookmarks()).toEqual([{
            slug: "attention",
            bookmarked: true,
            updatedAt: "2026-01-01T00:00:00Z",
        }])
        expect(readLocalNotes()).toEqual([{
            slug: "attention",
            body: "Review masking",
            deleted: false,
            updatedAt: "2026-01-01T00:00:00Z",
        }])
    })

    test("keeps failed quiz uploads for retry and removes acknowledged attempts", () => {
        const attempt = recordLocalQuizAttempt({ kind: "mastery", slug: "attention", correct: 3, total: 5 })

        expect(attempt.id).toMatch(/^[0-9a-f-]{36}$/)
        expect(readLocalQuizHistory()).toHaveLength(1)

        removeLocalQuizAttempt(attempt.id)
        expect(readLocalQuizHistory()).toEqual([])
    })

    test("records weekly section checks separately from lesson mastery", () => {
        const boundaryAttempt = recordLocalQuizAttempt({
            kind: "section",
            slug: "rag-working-4h-week-2-1234abcd",
            correct: 6,
            total: 8,
        })
        const passingAttempt = recordLocalQuizAttempt({
            kind: "section",
            slug: "rag-working-4h-week-3-1234abcd",
            correct: 7,
            total: 8,
        })

        expect(boundaryAttempt).toMatchObject({ kind: "section", score: 75, passed: true })
        expect(passingAttempt).toMatchObject({ kind: "section", score: 88, passed: true })
        expect(readLocalQuizHistory()).toHaveLength(2)
    })

    test("upgrades saved 75 percent attempts to passing", () => {
        localStorage.setItem("leetllm_quiz_attempt_history", JSON.stringify([{
            id: "boundary-attempt",
            kind: "section",
            slug: "rag-working-4h-week-2-1234abcd",
            correct: 6,
            total: 8,
            score: 75,
            passed: false,
            attemptedAt: "2026-08-02T00:00:00.000Z",
        }]))

        expect(readLocalQuizHistory()[0]).toMatchObject({ score: 75, passed: true })
    })

    test("keeps newest read state so another device cannot restore an unread lesson", () => {
        localStorage.setItem("leetllm_read_articles", JSON.stringify(["attention"]))
        const local = readLocalReadProgress()
        const merged = mergeReadProgress([
            { slug: "attention", completed: false, updatedAt: "2026-02-01T00:00:00Z" },
        ], local)

        expect(merged).toEqual([
            { slug: "attention", completed: false, updatedAt: "2026-02-01T00:00:00Z" },
        ])
        expect(shouldSyncReadProgress(local[0])).toBe(false)
        expect(shouldSyncReadProgress({
            slug: "attention",
            completed: true,
            updatedAt: "2026-02-02T00:00:00Z",
        })).toBe(true)
    })

    test("migrates saved mastery and theory scores once", () => {
        localStorage.setItem("leetllm_mastery_quiz_scores", JSON.stringify({
            attention: { correct: 3, total: 5, score: 60, passed: false, attempts: 2 },
        }))
        localStorage.setItem("leetllm_theory_quiz_scores", JSON.stringify({
            transformers: { correct: 4, total: 5, score: 80, passed: true, attempts: 1 },
        }))

        migrateLegacyQuizResults()
        migrateLegacyQuizResults()

        expect(readLocalQuizHistory()).toEqual(expect.arrayContaining([
            expect.objectContaining({ kind: "mastery", slug: "attention", score: 60, passed: false }),
            expect.objectContaining({ kind: "theory", slug: "transformers", score: 80, passed: true }),
        ]))
        expect(readLocalQuizHistory()).toHaveLength(2)
    })

    test("keeps a full curriculum of legacy quiz results in the upload queue", () => {
        localStorage.setItem("leetllm_mastery_quiz_scores", JSON.stringify(Object.fromEntries(
            Array.from({ length: 162 }, (_, index) => [
                `lesson-${index}`,
                { correct: 4, total: 5, score: 80, passed: true, attempts: 1 },
            ])
        )))

        migrateLegacyQuizResults()

        expect(readLocalQuizHistory()).toHaveLength(162)
    })
})
