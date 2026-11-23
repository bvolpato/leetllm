import { describe, expect, it } from "vitest"
import {
    getPracticeCategories,
    getPracticeProblem,
    getPracticeProblems,
    toPracticeClientProblem,
} from "./practice"

describe("practice content", () => {
    it("loads markdown-backed Python practice problems", () => {
        const problems = getPracticeProblems()
        expect(problems.length).toBeGreaterThan(0)
        expect(problems.map((problem) => problem.slug)).toContain("same-host-crawler")
        expect(problems.map((problem) => problem.slug)).toContain("stack-trace-reconstructor")
        expect(problems.map((problem) => problem.slug)).toContain("workflow-state-machine")
        expect(problems.map((problem) => problem.slug)).toContain("longest-match-tokenizer")
        expect(problems.map((problem) => problem.slug)).toContain("lfu-ttl-cache")
        expect(problems.map((problem) => problem.slug)).toContain("context-window-packer")
        expect(problems.map((problem) => problem.slug)).toContain("rag-chunk-selector")
        expect(problems.map((problem) => problem.slug)).toContain("sse-event-parser")
        expect(getPracticeCategories(problems)).toContain("Stateful Design")

        for (const problem of problems) {
            expect(problem.language).toBe("python3")
            expect(problem.body.trim(), problem.slug).not.toBe("")
            const firstBodyLine = problem.body.split(/\r?\n/).find((line) => line.trim())
            expect(firstBodyLine).not.toBe(`# ${problem.title}`)
            expect(problem.starterCode).toContain("pass")
            expect(problem.testCases.some((testCase) => testCase.visibility === "sample")).toBe(true)
            expect(problem.testCases.some((testCase) => testCase.visibility === "hidden")).toBe(true)
        }
    })

    it("keeps every language covered by runnable sample and hidden cases", () => {
        const problems = getPracticeProblems()

        for (const problem of problems) {
            for (const [language, bundle] of Object.entries(problem.languages)) {
                const label = `${problem.slug}:${language}`
                expect(bundle.testCases.some((testCase) => testCase.visibility === "sample"), label).toBe(true)
                expect(bundle.testCases.some((testCase) => testCase.visibility === "hidden"), label).toBe(true)
                expect(new Set(bundle.testCases.map((testCase) => testCase.name)).size, label).toBe(bundle.testCases.length)
                for (const testCase of bundle.testCases) {
                    const caseLabel = `${label}:${testCase.name}`
                    expect(["sample", "hidden"], caseLabel).toContain(testCase.visibility)
                    expect(Boolean(testCase.code?.trim()) || Boolean(testCase.checks?.length), caseLabel).toBe(true)
                    for (const check of testCase.checks ?? []) {
                        expect(check.input.trim(), caseLabel).not.toBe("")
                        expect(check.expression.trim(), caseLabel).not.toBe("")
                        expect(check.expected.trim(), caseLabel).not.toBe("")
                        if (language === "java") expect(check.operator, caseLabel).toBe("==")
                    }
                }
                if (language === "java") {
                    for (const testCase of bundle.testCases.filter((testCase) => !testCase.code)) {
                        expect(testCase.setup ?? "", `${label}:${testCase.name}:setup`).not.toMatch(/\b(?:check|eq)\s*\(/)
                        for (const check of testCase.checks ?? []) {
                            expect(check.before ?? "", `${label}:${testCase.name}:before`).not.toMatch(/\b(?:check|eq)\s*\(/)
                        }
                    }
                }
            }
        }
    })

    it("expands Java scenarios into assertion-level checks without hiding setup assertions", () => {
        const rateLimiter = getPracticeProblem("token-bucket-rate-limiter")!.languages.java!
        const refillCase = rateLimiter.testCases.find((testCase) => testCase.name === "blocks when empty and returns retry after")!
        expect(refillCase.code).toBeUndefined()
        expect(refillCase.checks).toHaveLength(5)
        expect(refillCase.input).toBeUndefined()
        expect(refillCase.expected).toBeUndefined()
        expect(refillCase.checks![2].before).toContain("Decision blocked")

        const workerQueue = getPracticeProblem("bounded-worker-queue")!.languages.java!
        const loopCase = workerQueue.testCases.find((testCase) => testCase.name === "retries failed work at back and snapshots state")!
        expect(loopCase.code).toContain("for (String item")
        expect(loopCase.checks).toBeUndefined()
    })

    it("normalizes solution guide spacing", () => {
        const problems = getPracticeProblems()

        for (const problem of problems) {
            expect(problem.complexityAnalysis, problem.slug).toBe(problem.complexityAnalysis.trim())
            expect(problem.complexityAnalysis, problem.slug).not.toMatch(/\n(?:[ \t]*\n){2,}/)

            for (const [language, bundle] of Object.entries(problem.languages)) {
                const label = `${problem.slug}:${language}`
                expect(bundle.solutionGuide, label).toBe(bundle.solutionGuide.trim())
                expect(bundle.solutionGuide, label).not.toMatch(/\n(?:[ \t]*\n){2,}/)
                expect(bundle.solutionGuide, label).not.toMatch(/```[^\n]*\n[ \t]*\n/)
                expect(bundle.solutionGuide, label).not.toMatch(/\n[ \t]*\n```/)
            }
        }

        const evalProblem = getPracticeProblem("eval-failure-aggregator")
        expect(evalProblem).not.toBeNull()
        expect(evalProblem!.solutionGuide).toContain("from collections import Counter\ndef summarize_runs")
        expect(evalProblem!.solutionGuide).not.toContain("from collections import Counter\n\ndef summarize_runs")
    })

    it("redacts hidden test code from client problem payloads", () => {
        const problem = getPracticeProblem("ttl-key-value-store")
        expect(problem).not.toBeNull()

        const clientProblem = toPracticeClientProblem(problem!)
        expect(clientProblem.sampleTestCases.every((testCase) => testCase.visibility === "sample")).toBe(true)
        expect(clientProblem.hiddenTestCount).toBeGreaterThan(0)
        expect(clientProblem.starterCode).not.toContain("from collections import Counter")
        expect(clientProblem.starterCode).not.toContain("import heapq")
        expect(clientProblem.starterCode).toContain("class Store")
        expect(JSON.stringify(clientProblem)).not.toContain("scan omits expired")
    })
})
