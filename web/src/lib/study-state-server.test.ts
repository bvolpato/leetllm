import { describe, expect, test } from "vitest"
import { validateStudyAction } from "./study-state-server"

describe("validateStudyAction", () => {
    test("validates lesson bookmarks and trims notes", () => {
        expect(validateStudyAction({
            action: "bookmark",
            slug: "numpy-and-tensor-shapes",
            bookmarked: true,
        })).toEqual({ action: "bookmark", slug: "numpy-and-tensor-shapes", bookmarked: true })

        expect(validateStudyAction({
            action: "note",
            slug: "numpy-and-tensor-shapes",
            body: "  Check broadcasting again.  ",
        })).toEqual({ action: "note", slug: "numpy-and-tensor-shapes", body: "Check broadcasting again." })
    })

    test("derives canonical plan and quiz fields server-side", () => {
        expect(validateStudyAction({
            action: "plan",
            answers: { goal: "rag", level: "working", weeklyHours: 4 },
        })).toMatchObject({ trackSlug: "rag-and-search-systems" })

        expect(validateStudyAction({
            action: "quiz_attempt",
            id: "00000000-0000-4000-8000-000000000001",
            kind: "mastery",
            slug: "numpy-and-tensor-shapes",
            correct: 4,
            total: 5,
            score: 0,
        })).toMatchObject({ score: 80, passed: true })

        expect(validateStudyAction({
            action: "quiz_attempt",
            id: "00000000-0000-4000-8000-000000000002",
            kind: "mastery",
            slug: "numpy-and-tensor-shapes",
            correct: 6,
            total: 8,
        })).toMatchObject({ score: 75, passed: true })
    })

    test("rejects unknown content and impossible quiz scores", () => {
        expect(() => validateStudyAction({ action: "bookmark", slug: "missing", bookmarked: true })).toThrow("Invalid bookmark")
        expect(() => validateStudyAction({
            action: "quiz_attempt",
            id: "00000000-0000-4000-8000-000000000001",
            kind: "mastery",
            slug: "numpy-and-tensor-shapes",
            correct: 6,
            total: 5,
        })).toThrow("Invalid quiz attempt")
    })
})
