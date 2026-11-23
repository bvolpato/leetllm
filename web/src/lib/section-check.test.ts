import { describe, expect, test } from "vitest"
import { buildSectionCheckQuestions, getSectionCheckHrefFromSlug, getSectionCheckSlug } from "./section-check"

function questions(prefix: string) {
    return Array.from({ length: 5 }, (_, index) => ({
        question: `${prefix} question ${index + 1}?`,
        options: ["A", "B", "C"],
        answer: "A",
        explanation: `${prefix} explanation ${index + 1}.`,
    }))
}

describe("weekly section checks", () => {
    test("samples questions across every lesson before taking another from the same lesson", () => {
        const selected = buildSectionCheckQuestions([
            { slug: "attention", title: "Attention", questions: questions("Attention") },
            { slug: "embeddings", title: "Embeddings", questions: questions("Embeddings") },
            { slug: "retrieval", title: "Retrieval", questions: questions("Retrieval") },
        ])

        expect(selected).toHaveLength(10)
        expect(selected.slice(0, 3).map((question) => question.lessonSlug)).toEqual([
            "attention",
            "embeddings",
            "retrieval",
        ])
        expect(new Set(selected.map((question) => question.lessonSlug))).toEqual(
            new Set(["attention", "embeddings", "retrieval"]),
        )
    })

    test("rejects a weekly check that cannot supply ten unique questions", () => {
        expect(() => buildSectionCheckQuestions([
            { slug: "attention", title: "Attention", questions: questions("Attention") },
        ])).toThrow("Weekly section check for attention needs 10 unique questions, found 5")
    })

    test("builds stable attempt slugs and restores their quiz route", () => {
        const slug = getSectionCheckSlug(
            { goal: "agents", level: "working", weeklyHours: 4 },
            3,
            ["function-calling-tool-use-llms", "agent-memory-persistence-patterns"],
        )

        expect(slug).toMatch(/^agents-working-4h-week-3-[0-9a-f]{8}$/)
        expect(getSectionCheckHrefFromSlug(slug)).toBe("/practice/section-check/agents/working/4/3")
    })
})
