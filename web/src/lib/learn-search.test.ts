import { describe, expect, test, vi } from "vitest"
import { searchCurriculum } from "./learn-search"

vi.mock("./questions", async (importOriginal) => {
    const actual = await importOriginal<typeof import("./questions")>()
    return {
        ...actual,
        getQuestions: () => {
            const questions = actual.getQuestions()
            return [...questions, {
                ...questions[0],
                id: "currency-fixture",
                slug: "currency-fixture",
                title: "Serving price",
                shortDescription: "Capacity and pricing",
                keyConceptsTested: [],
                content: "A worked fixture costs \\$3.00/hour before usage discounts.",
            }]
        },
    }
})

describe("searchCurriculum", () => {
    test("ranks title matches ahead of content-only matches", () => {
        const { results } = searchCurriculum("reward model")

        expect(results[0]?.slug).toBe("reward-modeling-from-preference-data")
        expect(results.some((result) => result.slug === "rlhf-dpo-aligning-language-models")).toBe(true)
        expect(results[0]?.snippet.toLowerCase()).toContain("reward")
    })

    test("returns content fragment when match only appears in article body", () => {
        const { results } = searchCurriculum("FlatParameter wrapper")

        expect(results[0]?.slug).toBe("distributed-training-fsdp-deepspeed-zero")
        expect(results[0]?.snippetSource).toBe("content")
        expect(results[0]?.snippet).toContain("FlatParameter")
    })

    test("renders escaped currency as plain text in content snippets", () => {
        const { results } = searchCurriculum("worked fixture")
        const result = results.find((candidate) => candidate.slug === "currency-fixture")

        expect(result?.snippetSource).toBe("content")
        expect(result?.snippet).toContain("$3.00/hour")
        expect(result?.snippet).not.toContain("\\$")
    })
})
