import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, expect, test, vi } from "vitest"
import { KnowledgeCheck, MasteryQuiz } from "./mastery-quiz"
import { ReadingProgressProvider } from "@/lib/reading-progress"

vi.mock("@/lib/use-is-logged-in", () => ({
    useIsLoggedIn: () => ({
        user: { id: "test-user" },
        isLoggedIn: true,
        authLoaded: true,
    }),
}))

type AnalyticsWindow = Window & { dataLayer?: IArguments[]; gtag?: (...args: unknown[]) => void }

const questions = Array.from({ length: 5 }, (_, index) => ({
    question: `Question ${index + 1}?`,
    options: [`Correct ${index + 1}`, `Wrong A ${index + 1}`, `Wrong B ${index + 1}`],
    answer: `Correct ${index + 1}`,
    explanation: `Explanation ${index + 1}.`,
}))

function renderQuiz() {
    return render(
        <ReadingProgressProvider>
            <MasteryQuiz slug="tensor-shapes" questions={questions} />
        </ReadingProgressProvider>
    )
}

beforeEach(() => {
    localStorage.clear()
    delete (window as AnalyticsWindow).dataLayer
    delete (window as AnalyticsWindow).gtag
    vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
            json: vi.fn().mockResolvedValue({ slugs: [] }),
        }),
    )
})

test("scores a mastery quiz and marks the lesson complete above 75 percent", async () => {
    renderQuiz()

    const radios = screen.getAllByRole("radio")
    const answerPositions = questions.map((question, index) => (
        radios
            .slice(index * question.options.length, (index + 1) * question.options.length)
            .findIndex((radio) => radio.getAttribute("value") === question.answer)
    ))
    expect(new Set(answerPositions).size).toBeGreaterThan(1)

    questions.forEach((question, index) => {
        fireEvent.click(screen.getByLabelText(index === 0 ? question.options[1] : question.answer))
    })
    fireEvent.click(screen.getByRole("button", { name: "Check answers" }))

    expect(screen.getByText("Mastery check passed")).toBeTruthy()
    expect(screen.getByText(/Score: 4\/5 \(80%\)/)).toBeTruthy()
    await waitFor(() => {
        expect(JSON.parse(localStorage.getItem("leetllm_read_articles") ?? "[]")).toContain("tensor-shapes")
    })
    expect(fetch).toHaveBeenCalledWith("/api/progress", expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ slug: "tensor-shapes" }),
    }))
    expect(screen.queryByRole("button", { name: "Check answers" })).toBeNull()
    expect(screen.getByRole("button", { name: "Retake" })).toBeTruthy()
    const analyticsEvents = (window as AnalyticsWindow).dataLayer?.map((event) => Array.from(event))
    expect(analyticsEvents).toContainEqual([
        "event",
        "quiz_submitted",
        expect.objectContaining({ quiz_type: "mastery", slug: "tensor-shapes", score: 80, passed: true }),
    ])
    expect(analyticsEvents).toContainEqual([
        "event",
        "lesson_completed",
        { slug: "tensor-shapes", completion_method: "mastery_quiz" },
    ])
})

test("shows a score and explanations without completing a failed lesson", () => {
    renderQuiz()

    questions.forEach((question, index) => {
        fireEvent.click(screen.getByLabelText(index < 3 ? question.answer : question.options[1]))
    })
    fireEvent.click(screen.getByRole("button", { name: "Check answers" }))

    expect(screen.getByText("Keep practicing")).toBeTruthy()
    expect(screen.getByText(/Score: 3\/5 \(60%\)/)).toBeTruthy()
    expect(screen.getAllByText("Explanation 5.").length).toBeGreaterThan(0)
    expect(JSON.parse(localStorage.getItem("leetllm_read_articles") ?? "[]")).not.toContain("tensor-shapes")
})

test("opens glossary definitions from quiz copy", async () => {
    const { container } = render(
        <ReadingProgressProvider>
            <MasteryQuiz
                slug="distributed-training"
                questions={[{
                    question: 'What does <span data-glossary="fsdp">FSDP</span> shard?',
                    options: ["Model state", "HTTP routes", "Dataset rows"],
                    answer: "Model state",
                    explanation: "FSDP shards parameters, gradients, and optimizer state.",
                }]}
            />
        </ReadingProgressProvider>,
    )

    expect(container.querySelector("[data-glossary-term='fsdp']")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Open definition for FSDP" }))

    await waitFor(() => expect(screen.getByRole("dialog", { name: "FSDP" })).toBeTruthy())
})

test("keeps graded feedback visible when one answer changes", async () => {
    renderQuiz()

    questions.forEach((question, index) => {
        fireEvent.click(screen.getByLabelText(index < 3 ? question.answer : question.options[1]))
    })
    fireEvent.click(screen.getByRole("button", { name: "Check answers" }))

    fireEvent.click(screen.getByLabelText(questions[4].answer))

    expect(screen.getByText("Answers changed since last check")).toBeTruthy()
    expect(screen.getByText(/Score: 3\/5 \(60%\).*1 answer has changed/)).toBeTruthy()
    expect(screen.getAllByText("Explanation 4.").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Explanation 5.").length).toBeGreaterThan(0)
    expect(screen.getByRole("button", { name: "Recheck answers" })).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Recheck answers" }))

    expect(screen.getByText("Mastery check passed")).toBeTruthy()
    expect(screen.getByText(/Score: 4\/5 \(80%\)/)).toBeTruthy()
    await waitFor(() => {
        expect(JSON.parse(localStorage.getItem("leetllm_read_articles") ?? "[]")).toContain("tensor-shapes")
    })
})

test("includes a complete answer key for print", () => {
    const { container } = renderQuiz()
    const printAnswers = container.querySelectorAll("[data-print-only]")

    expect(printAnswers).toHaveLength(questions.length)
    questions.forEach((question, index) => {
        expect(printAnswers[index].textContent).toContain(question.answer)
        expect(printAnswers[index].textContent).toContain(question.explanation)
    })
})

test("records a weekly section check without treating it as another lesson completion", async () => {
    render(
        <ReadingProgressProvider>
            <KnowledgeCheck
                slug="rag-working-4h-week-2-1234abcd"
                questions={questions.map((question, index) => ({ ...question, section: `Lesson ${index + 1}` }))}
                kind="section"
                eyebrow="Complete week 2"
                title="Section Check"
                description="Connect this week's lessons."
                completionLabel="Week check complete"
            />
        </ReadingProgressProvider>
    )

    questions.forEach((question) => fireEvent.click(screen.getByLabelText(question.answer)))
    fireEvent.click(screen.getByRole("button", { name: "Check answers" }))

    expect(screen.getByText("Section Check passed")).toBeTruthy()
    expect(screen.getByText("Week check complete")).toBeTruthy()
    expect(JSON.parse(localStorage.getItem("leetllm_read_articles") ?? "[]")).not.toContain("rag-working-4h-week-2-1234abcd")
    expect(JSON.parse(localStorage.getItem("leetllm_quiz_attempt_history") ?? "[]")).toEqual([
        expect.objectContaining({ kind: "section", slug: "rag-working-4h-week-2-1234abcd", passed: true }),
    ])
    expect(fetch).not.toHaveBeenCalledWith("/api/study-state", expect.objectContaining({ method: "POST" }))
})

test("supports instant per-question feedback and completes once every question is checked", async () => {
    renderQuiz()

    fireEvent.click(screen.getByLabelText(questions[0].answer))
    fireEvent.click(screen.getByRole("button", { name: "Check question 1" }))

    expect(screen.getByText("Correct")).toBeTruthy()
    expect(screen.getAllByText("Explanation 1.").length).toBeGreaterThan(1)
    expect(screen.queryByText("Mastery check passed")).toBeNull()

    for (let index = 1; index < questions.length; index++) {
        fireEvent.click(screen.getByLabelText(questions[index].answer))
        fireEvent.click(screen.getByRole("button", { name: `Check question ${index + 1}` }))
    }

    expect(screen.getByText("Mastery check passed")).toBeTruthy()
    expect(screen.getByText(/Score: 5\/5 \(100%\)/)).toBeTruthy()
    await waitFor(() => {
        expect(JSON.parse(localStorage.getItem("leetllm_read_articles") ?? "[]")).toContain("tensor-shapes")
    })
})
