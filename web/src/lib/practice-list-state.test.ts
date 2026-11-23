import { describe, expect, it } from "vitest"
import { defaultPracticeListState, parsePracticeListState, practiceListHref, type PracticeSortDirection } from "./practice-list-state"

describe("coding practice return navigation", () => {
    it.each<PracticeSortDirection>(["asc", "desc"])("preserves filters and %s test-count sorting", (direction) => {
        const state = {
            ...defaultPracticeListState,
            query: "cache",
            difficulty: "Hard" as const,
            category: "State Machines",
            status: "Open" as const,
            sort: "tests" as const,
            direction,
        }
        const params = new URL(practiceListHref(state), "https://leetllm.com").searchParams

        expect(params.get("mode")).toBe("coding")
        expect(parsePracticeListState(params, ["All", "State Machines"])).toEqual(state)
    })
})
