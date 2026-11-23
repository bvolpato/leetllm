import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { PracticePageClient } from "./practice-page-client"
import { getPracticeProblems, toPracticeListItem } from "@/lib/practice"
import { getTheoryQuizzes } from "@/lib/theory-quizzes"

const navigationMock = vi.hoisted(() => ({
    replace: vi.fn(),
}))
const originalScroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView")

vi.mock("next/navigation", () => ({
    usePathname: () => "/practice",
    useRouter: () => ({ replace: navigationMock.replace }),
}))

describe("PracticePageClient", () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        if (originalScroll) Object.defineProperty(HTMLElement.prototype, "scrollIntoView", originalScroll)
        else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView")
    })
    beforeEach(() => {
        localStorage.clear()
        navigationMock.replace.mockClear()
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            json: () => Promise.resolve({ slugs: [] }),
        }))
    })

    it("renders practice problems as a filterable table", async () => {
        const problems = getPracticeProblems().map(toPracticeListItem)
        const theoryQuizzes = getTheoryQuizzes()
        const { rerender } = render(<PracticePageClient problems={problems} theoryQuizzes={theoryQuizzes} initialSearch="" />)

        await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/practice/progress?kind=quiz"))
        expect(screen.getByRole("heading", { name: "Practice" })).toBeTruthy()
        expect(screen.getByRole("heading", { name: "Theory quizzes" })).toBeTruthy()
        expect(screen.getByRole("button", { name: "Quizzes" }).getAttribute("aria-pressed")).toBe("true")
        expect(screen.getByRole("button", { name: "Coding" }).getAttribute("aria-pressed")).toBe("false")
        expect(screen.getByRole("heading", { name: "Beginner AI Systems Foundations" })).toBeTruthy()
        expect(screen.getByRole("button", { name: /Check Answers/i })).toBeTruthy()

        fireEvent.click(screen.getByRole("button", { name: /Coding/i }))
        expect(navigationMock.replace).toHaveBeenCalledWith("/practice?mode=coding", { scroll: false })
        expect(screen.getByRole("button", { name: "Coding" }).getAttribute("aria-pressed")).toBe("true")
        expect(screen.getByRole("button", { name: "Quizzes" }).getAttribute("aria-pressed")).toBe("false")

        expect(screen.getByText("Same-host Crawler")).toBeTruthy()
        expect(screen.getByText("TTL Key/Value Store")).toBeTruthy()
        expect(screen.getByRole("textbox", { name: /search/i })).toBeTruthy()
        expect(screen.getByText("Python 3 + Java")).toBeTruthy()
        expect(screen.queryByRole("combobox", { name: /sort/i })).toBeNull()

        navigationMock.replace.mockClear()
        rerender(<PracticePageClient problems={problems} theoryQuizzes={theoryQuizzes} initialSearch="mode=coding&sort=difficulty&dir=desc" />)
        expect(screen.getAllByRole("row")[1].textContent).toContain("Dependency Scheduler With Retries")

        fireEvent.click(screen.getByRole("button", { name: /Difficulty/i }))
        expect(navigationMock.replace).toHaveBeenCalledWith("/practice?sort=difficulty&mode=coding", { scroll: false })
    })

    it.each([false, true])("opens quiz cards and returns focus with reduced motion=%s", async (reducedMotion) => {
        vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: reducedMotion })))
        const scrollIntoView = vi.fn()
        Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: scrollIntoView })
        const problems = getPracticeProblems().map(toPracticeListItem)
        const theoryQuizzes = getTheoryQuizzes()
        render(<PracticePageClient problems={problems} theoryQuizzes={theoryQuizzes} initialSearch="" />)

        await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/practice/progress?kind=quiz"))
        expect(screen.queryByRole("button", { name: /Back to quizzes/i })).toBeNull()

        screen.getByRole("button", { name: /Intermediate LLM Product Systems/i }).focus()
        fireEvent.click(screen.getByRole("button", { name: /Intermediate LLM Product Systems/i }))
        expect(screen.getByRole("button", { name: /Back to quizzes/i })).toBeTruthy()
        expect(screen.getByRole("heading", { name: "Intermediate LLM Product Systems" })).toBeTruthy()
        await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Intermediate LLM Product Systems" })))
        expect(scrollIntoView).toHaveBeenLastCalledWith({ block: "start", behavior: reducedMotion ? "instant" : "smooth" })

        screen.getByRole("button", { name: /Back to quizzes/i }).focus()
        fireEvent.click(screen.getByRole("button", { name: /Back to quizzes/i }))
        expect(screen.queryByRole("button", { name: /Back to quizzes/i })).toBeNull()
        expect(screen.getByRole("button", { name: /Beginner AI Systems Foundations/i })).toBeTruthy()
        await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Theory quizzes" })))
        expect(scrollIntoView).toHaveBeenLastCalledWith({ block: "start", behavior: reducedMotion ? "instant" : "smooth" })
    })

    it("opens a quiz from its stable plan deep link", async () => {
        const problems = getPracticeProblems().map(toPracticeListItem)
        const theoryQuizzes = getTheoryQuizzes()
        render(
            <PracticePageClient
                problems={problems}
                theoryQuizzes={theoryQuizzes}
                initialSearch="quiz=advanced-training-inference-architecture"
            />
        )

        expect(await screen.findByRole("heading", { name: "Advanced Training and Inference Architecture" })).toBeTruthy()
        expect(screen.getByRole("button", { name: /Back to quizzes/i })).toBeTruthy()
        expect(document.querySelector("#theory-quiz")).toBeTruthy()
    })

    it("completes a theory quiz at exactly 75 percent", async () => {
        const problems = getPracticeProblems().map(toPracticeListItem)
        const quiz = {
            ...getTheoryQuizzes()[0],
            questions: Array.from({ length: 4 }, (_, index) => ({
                section: "Boundary test",
                question: `Question ${index + 1}?`,
                options: ["Correct", "Wrong A", "Wrong B"],
                answer: "Correct",
                explanation: "Boundary explanation.",
            })),
        }
        render(<PracticePageClient problems={problems} theoryQuizzes={[quiz]} initialSearch="" />)

        await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/practice/progress?kind=quiz"))
        quiz.questions.forEach((question, index) => {
            const radios = screen.getAllByRole("radio").slice(index * question.options.length, (index + 1) * question.options.length)
            fireEvent.click(radios.find((radio) => radio.getAttribute("value") === (index === 0 ? "Wrong A" : question.answer))!)
        })
        fireEvent.click(screen.getByRole("button", { name: /Check Answers/i }))

        expect(screen.getByText("3/4 correct · 75%")).toBeTruthy()
        expect(screen.getByText("Quiz complete.")).toBeTruthy()
        expect(JSON.parse(localStorage.getItem("leetllm_completed_theory_quizzes") ?? "[]")).toContain(quiz.slug)

        fireEvent.click(screen.getAllByRole("radio").find((radio) => radio.getAttribute("name") === `${quiz.slug}-0` && radio.getAttribute("value") === "Correct")!)
        expect(screen.queryByText("3/4 correct · 75%")).toBeNull()
        expect(screen.queryAllByText("Boundary explanation.")).toHaveLength(0)
        fireEvent.click(screen.getByRole("button", { name: /Check Answers/i }))
        expect(screen.getByText("4/4 correct · 100%")).toBeTruthy()
    })

    it("announces difficulty, status, and quiz level selections", async () => {
        render(<PracticePageClient problems={getPracticeProblems().map(toPracticeListItem)} theoryQuizzes={getTheoryQuizzes()} initialSearch="" />)

        const quizLevels = within(screen.getByRole("group", { name: "Quiz level" }))
        fireEvent.click(quizLevels.getByRole("button", { name: "Beginner" }))
        expect(quizLevels.getByRole("button", { name: "Beginner" }).getAttribute("aria-pressed")).toBe("true")
        expect(quizLevels.getByRole("button", { name: "All" }).getAttribute("aria-pressed")).toBe("false")

        fireEvent.click(screen.getByRole("button", { name: "Coding" }))
        const difficulty = within(screen.getByRole("group", { name: "Difficulty" }))
        fireEvent.click(difficulty.getByRole("button", { name: "Hard" }))
        expect(difficulty.getByRole("button", { name: "Hard" }).getAttribute("aria-pressed")).toBe("true")
        expect(difficulty.getByRole("button", { name: "Easy" }).getAttribute("aria-pressed")).toBe("false")
        const status = within(screen.getByRole("group", { name: "Status" }))
        fireEvent.click(status.getByRole("button", { name: "Open" }))
        expect(status.getByRole("button", { name: "Open" }).getAttribute("aria-pressed")).toBe("true")
        expect(status.getByRole("button", { name: "Learned" }).getAttribute("aria-pressed")).toBe("false")
    })
})
