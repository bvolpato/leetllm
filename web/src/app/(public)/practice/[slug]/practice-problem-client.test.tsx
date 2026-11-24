import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PracticeClientProblem } from "@/lib/practice"
import { PracticeProblemClient } from "./practice-problem-client"

type AnalyticsWindow = Window & { dataLayer?: IArguments[]; gtag?: (...args: unknown[]) => void }

vi.mock("next-themes", () => ({
    useTheme: () => ({ resolvedTheme: "light" }),
}))

vi.mock("@uiw/react-codemirror", () => ({
    default: ({
        value,
        onChange,
        "aria-label": ariaLabel,
    }: {
        value: string
        onChange: (value: string) => void
        "aria-label": string
    }) => (
        <textarea
            aria-label={ariaLabel}
            value={value}
            onChange={(event) => onChange(event.currentTarget.value)}
            onKeyDown={(event) => {
                if (event.key !== "Tab" && event.key !== "Enter") return

                event.preventDefault()
                const target = event.currentTarget
                const { selectionStart, selectionEnd } = target
                const before = value.slice(0, selectionStart)
                const after = value.slice(selectionEnd)
                if (event.key === "Tab") {
                    onChange(`${before}    ${after}`)
                    return
                }

                const currentLine = before.slice(before.lastIndexOf("\n") + 1)
                const currentIndent = currentLine.match(/^\s*/)?.[0] ?? ""
                const blockIndent = currentLine.trimEnd().endsWith(":") ? "    " : ""
                onChange(`${before}\n${currentIndent}${blockIndent}${after}`)
            }}
        />
    ),
}))

const problem: PracticeClientProblem = {
    id: "add-two",
    slug: "add-two",
    title: "Add Two",
    difficulty: "Easy",
    category: "Smoke",
    language: "python3",
    languages: ["python3", "java"],
    timeEstimateMinutes: 1,
    tags: [],
    source: "test",
    summary: "Add two numbers.",
    sampleTestCount: 1,
    hiddenTestCount: 1,
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    starterCode: "def add(a, b):\n    pass",
    sampleTestCases: [{
        name: "sample add",
        visibility: "sample",
        input: "a = 2, b = 3",
        expected: "5",
        setup: "from solution import add",
        checks: [{
            input: "add(2, 3)",
            expression: "add(2, 3)",
            operator: "==",
            expected: "5",
        }],
    }],
    languageDetails: {
        python3: {
            label: "Python 3",
            starterCode: "def add(a, b):\n    pass",
            sampleTestCases: [{
                name: "sample add",
                visibility: "sample",
                input: "a = 2, b = 3",
                expected: "5",
                setup: "from solution import add",
                checks: [{
                    input: "add(2, 3)",
                    expression: "add(2, 3)",
                    operator: "==",
                    expected: "5",
                }],
            }],
            solutionGuide: "Python guide",
        },
        java: {
            label: "Java",
            starterCode: "class Solution {\n    int add(int a, int b) {\n        return 0;\n    }\n}",
            sampleTestCases: [{
                name: "sample add",
                visibility: "sample",
                input: "a = 2, b = 3",
                expected: "5",
                checks: [{
                    input: "new Solution().add(2, 3)",
                    expression: "new Solution().add(2, 3)",
                    operator: "==",
                    expected: "5",
                }],
            }],
            solutionGuide: "Java guide",
        },
    },
    clarifyingQuestions: [],
    followUps: [],
    followUpGuide: "",
    complexityAnalysis: "- Direct addition. Time: O(1). Space: O(1).",
    solutionGuide: "",
    body: "Implement `add`.",
}

const previousProblem: PracticeClientProblem = {
    ...problem,
    id: "prev-one",
    slug: "prev-one",
    title: "Prev One",
    summary: "Previous problem.",
}

const nextProblem: PracticeClientProblem = {
    ...problem,
    id: "next-one",
    slug: "next-one",
    title: "Next One",
    summary: "Next problem.",
}

describe("PracticeProblemClient", () => {
    beforeEach(() => {
        localStorage.clear()
        delete (window as AnalyticsWindow).dataLayer
        delete (window as AnalyticsWindow).gtag
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            json: () => Promise.resolve({ slugs: [] }),
        }))
    })

    it("restores and persists the local solution for a problem", async () => {
        localStorage.setItem("leetllm_practice_solution_add-two", "def add(a, b):\n    return a + b")
        render(<PracticeProblemClient problem={problem} problems={[problem]} initialSearch="" />)

        const editor = await screen.findByRole("textbox", { name: "Add Two Python 3 solution editor" }) as HTMLTextAreaElement
        await waitFor(() => expect(editor.value).toBe("def add(a, b):\n    return a + b"))

        fireEvent.change(editor, { target: { value: "def add(a, b):\n    return a - b" } })
        await waitFor(() => expect(localStorage.getItem("leetllm_practice_solution_add-two_python3")).toBe("def add(a, b):\n    return a - b"))
    })

    it("inserts spaces when Tab is pressed in editor", async () => {
        render(<PracticeProblemClient problem={problem} problems={[problem]} initialSearch="" />)

        const editor = await screen.findByRole("textbox", { name: "Add Two Python 3 solution editor" }) as HTMLTextAreaElement
        editor.setSelectionRange(0, 0)
        fireEvent.keyDown(editor, { key: "Tab" })

        await waitFor(() => expect(editor.value.startsWith("    def add")).toBe(true))
    })

    it("keeps Python indentation when Enter is pressed in the editor", async () => {
        render(<PracticeProblemClient problem={problem} problems={[problem]} initialSearch="" />)

        const editor = await screen.findByRole("textbox", { name: "Add Two Python 3 solution editor" }) as HTMLTextAreaElement
        fireEvent.change(editor, { target: { value: "def add(a, b):" } })
        editor.setSelectionRange(editor.value.length, editor.value.length)
        fireEvent.keyDown(editor, { key: "Enter" })

        await waitFor(() => expect(editor.value).toBe("def add(a, b):\n    "))
    })

    it("renders structured sample tests as input and expected pairs", async () => {
        render(<PracticeProblemClient problem={problem} problems={[problem]} initialSearch="" />)

        fireEvent.click(screen.getByRole("button", { name: "Sample Tests" }))

        expect(await screen.findByText("Setup")).toBeTruthy()
        expect(document.body.textContent).toContain("from solution import add")
        expect(screen.getAllByText("Input").length).toBeGreaterThan(0)
        expect(screen.getAllByText("a = 2, b = 3").length).toBeGreaterThan(0)
        expect(screen.getAllByText("Expected").length).toBeGreaterThan(0)
        expect(screen.getAllByText("5").length).toBeGreaterThan(0)
    })

    it("shows submit summary before detailed cases", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                ok: false,
                mode: "submit",
                passed: 1,
                total: 2,
                runtimeMs: 12,
                memoryKb: 2048,
                results: [
                    {
                        name: "sample add",
                        visibility: "sample",
                        passed: true,
                        durationMs: 1,
                        stdout: "",
                        stderr: "",
                    },
                    {
                        name: "hidden add",
                        visibility: "hidden",
                        passed: false,
                        durationMs: 1,
                        stdout: "debug value: 4\n",
                        stderr: "",
                        error: "AssertionError",
                        input: "add(-2, 1)",
                        expected: "-1",
                        feedback: "Handle negative inputs without special casing.",
                        assertion: {
                            actual: "0",
                            expected: "-1",
                            operator: "==",
                        },
                    },
                ],
            }),
        })
        vi.stubGlobal("fetch", fetchMock)

        render(<PracticeProblemClient problem={problem} problems={[problem]} initialSearch="" />)
        fireEvent.click(screen.getByRole("button", { name: "Submit" }))

        await waitFor(() => expect(screen.getByText("Tests failing")).toBeTruthy())
        expect(screen.getAllByText("1/2 passed").length).toBeGreaterThan(0)
        expect(screen.getByText("Stdout")).toBeTruthy()
        expect(screen.getByText("debug value: 4")).toBeTruthy()
        expect(screen.getByText("Traceback")).toBeTruthy()
        expect(screen.getByText("AssertionError")).toBeTruthy()
        expect(screen.getByText("Returned")).toBeTruthy()
        expect(screen.getByText("0")).toBeTruthy()
        expect(screen.getByText("Feedback")).toBeTruthy()
        expect(screen.getByText("Handle negative inputs without special casing.")).toBeTruthy()
        expect(screen.getByText("Input")).toBeTruthy()
        expect(screen.getByText("add(-2, 1)")).toBeTruthy()
        expect(screen.getAllByText("Expected").length).toBeGreaterThanOrEqual(2)
        expect(screen.getAllByText("-1").length).toBeGreaterThanOrEqual(2)
        expect(screen.getByRole("button", { name: "Resize problem panel" })).toBeTruthy()
        expect(screen.getByRole("button", { name: "Resize results panel" })).toBeTruthy()
        expect(fetchMock).toHaveBeenCalledWith("/api/practice/run", expect.objectContaining({
            body: expect.stringContaining("\"mode\":\"submit\""),
        }))
    })

    it("runs custom tests from the editor panel", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                ok: true,
                mode: "run",
                passed: 1,
                total: 1,
                runtimeMs: 4,
                memoryKb: 1024,
                results: [{
                    name: "Custom test",
                    visibility: "custom",
                    passed: true,
                    durationMs: 1,
                    stdout: "",
                    stderr: "",
                }],
            }),
        })
        vi.stubGlobal("fetch", fetchMock)

        render(<PracticeProblemClient problem={problem} problems={[problem]} initialSearch="" />)

        fireEvent.click(screen.getByRole("button", { name: "Custom Test" }))
        const customEditor = await screen.findByRole("textbox", { name: "Add Two Python 3 custom test editor" })
        fireEvent.change(customEditor, { target: { value: "from solution import add\nassert add(10, 20) == 30" } })
        fireEvent.click(screen.getByRole("button", { name: "Run Custom" }))

        await waitFor(() => expect(screen.getByText("All tests passed")).toBeTruthy())
        const runCall = fetchMock.mock.calls.find((call) => call[0] === "/api/practice/run")
        expect(runCall).toBeTruthy()
        const requestBody = JSON.parse(String(runCall?.[1]?.body))
        expect(requestBody.customTests).toEqual([{
            name: "Custom test",
            code: "from solution import add\nassert add(10, 20) == 30",
        }])
        const analyticsEvents = (window as AnalyticsWindow).dataLayer?.map((event) => Array.from(event))
        expect(analyticsEvents).toContainEqual([
            "event",
            "practice_problem_view",
            { slug: "add-two", difficulty: "Easy", category: "Smoke" },
        ])
        expect(analyticsEvents?.filter((event) => event[1] === "practice_problem_view")).toHaveLength(1)
        expect(analyticsEvents).toContainEqual([
            "event",
            "practice_started",
            { slug: "add-two", mode: "run", language: "python3", custom_test: true },
        ])
        expect(analyticsEvents).toContainEqual([
            "event",
            "practice_passed",
            { slug: "add-two", mode: "run", language: "python3" },
        ])
    })

    it("lets iPad users hide optional practice panes", async () => {
        render(<PracticeProblemClient problem={problem} problems={[problem]} initialSearch="" />)

        expect(screen.getByRole("button", { name: "Hide Prompt" })).toBeTruthy()
        fireEvent.click(screen.getByRole("button", { name: "Hide Prompt" }))
        expect(await screen.findByRole("button", { name: "Show Prompt" })).toBeTruthy()

        expect(screen.queryByRole("textbox", { name: "Add Two Python 3 custom test editor" })).toBeNull()
        fireEvent.click(screen.getByRole("button", { name: "Custom Test" }))
        expect(await screen.findByRole("textbox", { name: "Add Two Python 3 custom test editor" })).toBeTruthy()
        fireEvent.click(screen.getByRole("button", { name: "Hide custom test panel" }))
        expect(screen.queryByRole("textbox", { name: "Add Two Python 3 custom test editor" })).toBeNull()

        expect(screen.queryByText("Run sample tests or submit all tests.")).toBeNull()
        fireEvent.click(screen.getByRole("button", { name: "Results" }))
        expect(screen.getByText("Run sample tests or submit all tests.")).toBeTruthy()
        fireEvent.click(screen.getByRole("button", { name: "Hide results panel" }))
        expect(screen.queryByText("Run sample tests or submit all tests.")).toBeNull()
    })

    it("shows language solution guides as tabs", async () => {
        render(<PracticeProblemClient problem={problem} problems={[problem]} initialSearch="" />)

        fireEvent.click(screen.getByRole("button", { name: "Complexity Analysis" }))
        expect(await screen.findByText(/Direct addition/)).toBeTruthy()

        fireEvent.click(screen.getByRole("button", { name: "Solution Guide" }))

        await waitFor(() => expect(screen.getByRole("tab", { name: "Python 3" }).getAttribute("aria-selected")).toBe("true"))
        expect(await screen.findByText("Python guide")).toBeTruthy()
        expect(screen.queryByText("Java guide")).toBeNull()

        fireEvent.click(screen.getByRole("tab", { name: "Java" }))

        await waitFor(() => expect(screen.getByRole("tab", { name: "Java" }).getAttribute("aria-selected")).toBe("true"))
        expect(await screen.findByText("Java guide")).toBeTruthy()
        expect(screen.queryByText("Python guide")).toBeNull()
    })

    it("links previous and next problems using the list context", async () => {
        render(<PracticeProblemClient problem={problem} problems={[previousProblem, problem, nextProblem]} initialSearch="category=Smoke" />)

        expect(screen.getByRole("button", { name: "Previous problem: Prev One" }).closest("a")?.getAttribute("href")).toBe("/practice/prev-one?category=Smoke")
        expect(screen.getByRole("button", { name: "Next problem: Next One" }).closest("a")?.getAttribute("href")).toBe("/practice/next-one?category=Smoke")
        const returnHref = screen.getByRole("link", { name: /Practice/ }).getAttribute("href")!
        const returnParams = new URL(returnHref, "https://leetllm.com").searchParams
        expect(returnParams.get("category")).toBe("Smoke")
        expect(returnParams.get("mode")).toBe("coding")
    })
})
