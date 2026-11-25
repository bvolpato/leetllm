import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { getTrackLessons, getTracks } from "@/lib/tracks"
import { getPracticeProblems, toPracticeListItem } from "@/lib/practice"
import { getTheoryQuizListItems } from "@/lib/theory-quizzes"
import { buildLearningPlan, type PlanTrack } from "@/lib/learning-plan"
import { LearningPlanBuilder } from "./learning-plan-builder"

const trackEvent = vi.fn()
const auth = vi.hoisted(() => ({ isLoggedIn: false, authLoaded: true }))
const originalScroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView")
const scrollIntoView = vi.fn()

vi.mock("@/lib/reading-progress", () => ({
    useReadingProgress: () => ({ readSlugs: [] }),
}))

vi.mock("@/components/practice/practice-progress", () => ({
    usePracticeProgress: () => ({ learnedSlugs: [] }),
}))

vi.mock("@/lib/use-is-logged-in", () => ({
    useIsLoggedIn: () => ({ user: null, ...auth }),
}))

vi.mock("@/lib/analytics", () => ({
    trackEvent: (...args: unknown[]) => trackEvent(...args),
}))

const tracks: PlanTrack[] = getTracks().map((track) => ({
    slug: track.slug,
    title: track.title,
    description: track.description,
    outcome: track.outcome,
    lessons: getTrackLessons(track),
}))
const catalog = {
    practiceProblems: getPracticeProblems().map(toPracticeListItem).map((problem) => ({
        slug: problem.slug,
        title: problem.title,
        summary: problem.summary,
        difficulty: problem.difficulty,
        timeEstimateMinutes: problem.timeEstimateMinutes,
    })),
    theoryQuizzes: getTheoryQuizListItems().map((quiz) => ({
        slug: quiz.slug,
        title: quiz.title,
        description: quiz.description,
        level: quiz.level,
        estimatedMinutes: quiz.estimatedMinutes,
    })),
}

describe("LearningPlanBuilder", () => {
    beforeEach(() => {
        localStorage.clear()
        trackEvent.mockReset()
        auth.isLoggedIn = false
        window.history.replaceState({}, "", "/start")
        scrollIntoView.mockReset()
        Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: scrollIntoView })
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        if (originalScroll) Object.defineProperty(HTMLElement.prototype, "scrollIntoView", originalScroll)
        else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView")
    })

    function buildRagPlan() {
        fireEvent.click(screen.getByRole("button", { name: /RAG and search engineer/i }))
        fireEvent.click(screen.getByRole("button", { name: /Building with AI/i }))
        fireEvent.click(screen.getByRole("button", { name: /4 hours/i }))
        fireEvent.click(screen.getByRole("button", { name: /Build my plan/i }))
    }

    test.each([false, true])("moves focus on create/reset with reduced motion=%s", async (reducedMotion) => {
        vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: reducedMotion })))
        render(<LearningPlanBuilder tracks={tracks} catalog={catalog} />)
        await screen.findByRole("heading", { name: "Start with a path you can finish" })
        buildRagPlan()
        const planHeading = await screen.findByRole("heading", { name: "RAG and Search Systems" })
        await waitFor(() => expect(document.activeElement).toBe(planHeading))
        expect(scrollIntoView).toHaveBeenLastCalledWith({ block: "start", behavior: reducedMotion ? "instant" : "smooth" })
        fireEvent.click(screen.getByRole("button", { name: /Build another plan/i }))
        const builderHeading = screen.getByRole("heading", { name: "Start with a path you can finish" })
        await waitFor(() => expect(document.activeElement).toBe(builderHeading))
        expect(scrollIntoView).toHaveBeenLastCalledWith({ block: "start", behavior: reducedMotion ? "instant" : "smooth" })
    })

    test.each(["create", "reset"])("loads cloud quiz history while protecting the plan after local %s", async (action) => {
        auth.isLoggedIn = true
        let resolveGet!: (response: unknown) => void
        const pendingGet = new Promise((resolve) => { resolveGet = resolve })
        function buildFoundationsPlan() {
            fireEvent.click(screen.getByRole("button", { name: /^AI engineer/i }))
            fireEvent.click(screen.getByRole("button", { name: /New to AI\/ML/i }))
            fireEvent.click(screen.getByRole("button", { name: /4 hours/i }))
            fireEvent.click(screen.getByRole("button", { name: /Build my plan/i }))
        }
        const exam = buildLearningPlan(tracks, { goal: "foundations", level: "new", weeklyHours: 4 }, catalog)
            .weeks.flatMap((week) => week.activities).find((activity) => activity.kind === "exam")!
        vi.stubGlobal("fetch", vi.fn((_url, options) => options?.method === "POST"
            ? Promise.resolve({ ok: true })
            : pendingGet))
        if (action === "reset") localStorage.setItem("leetllm_learning_plan_v1", JSON.stringify({ goal: "rag", level: "working", weeklyHours: 4 }))
        render(<LearningPlanBuilder tracks={tracks} catalog={catalog} />)
        if (action === "create") {
            await screen.findByRole("heading", { name: "Start with a path you can finish" })
            buildFoundationsPlan()
        } else {
            await screen.findByRole("heading", { name: "RAG and Search Systems" })
            fireEvent.click(screen.getByRole("button", { name: /Build another plan/i }))
        }
        await act(async () => resolveGet({ json: async () => ({
            plan: { goal: "rag", level: "working", weeklyHours: 2, updatedAt: "2099-01-01T00:00:00.000Z" },
            quizAttempts: [{ id: "remote-exam", slug: exam.quizSlug, kind: "theory", correct: 4, total: 4, score: 100, passed: true, attemptedAt: "2026-09-23T00:00:00.000Z" }],
        }) }))
        expect(screen.getByRole("heading", { name: action === "create" ? "AI Engineer Foundations" : "Start with a path you can finish" })).toBeTruthy()
        if (action === "reset") expect(localStorage.getItem("leetllm_learning_plan_v1")).toBeNull()
        else expect(JSON.parse(localStorage.getItem("leetllm_learning_plan_v1")!).goal).toBe("foundations")
        if (action === "reset") buildFoundationsPlan()
        expect(Number(screen.getByRole("progressbar", { name: "Learning plan progress" }).getAttribute("aria-valuenow"))).toBeGreaterThan(0)
    })

    test.each([false, true])("restores a section-check return plan and week with saved plan=%s", async (hasSavedPlan) => {
        if (hasSavedPlan) localStorage.setItem("leetllm_learning_plan_v1", JSON.stringify({ goal: "foundations", level: "new", weeklyHours: 2 }))
        window.history.replaceState({ preserved: true }, "", "/start?goal=rag&level=working&weeklyHours=4&source=check#week-2")
        render(<LearningPlanBuilder tracks={tracks} catalog={catalog} />)
        await screen.findByRole("heading", { name: "RAG and Search Systems" })
        await waitFor(() => expect(document.activeElement).toBe(document.getElementById("week-2-title")))
        expect(JSON.parse(localStorage.getItem("leetllm_learning_plan_v1")!).goal).toBe("rag")
        fireEvent.click(screen.getByRole("button", { name: /Build another plan/i }))
        expect(window.location.search).toBe("?source=check")
        expect(window.location.hash).toBe("")
        expect(window.history.state).toEqual({ preserved: true })
    })

    test("keeps an explicit return plan when the cloud contains another plan", async () => {
        auth.isLoggedIn = true
        window.history.replaceState({}, "", "/start?goal=rag&level=working&weeklyHours=4#week-2")
        vi.stubGlobal("fetch", vi.fn((_url, options) => Promise.resolve(options?.method === "POST" ? { ok: true } : {
            json: async () => ({ plan: { goal: "foundations", level: "new", weeklyHours: 2, updatedAt: "2099-01-01T00:00:00.000Z" }, quizAttempts: [] }),
        })))
        render(<LearningPlanBuilder tracks={tracks} catalog={catalog} />)
        await screen.findByRole("heading", { name: "RAG and Search Systems" })
        await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/study-state", expect.objectContaining({ method: "POST" })))
        expect(JSON.parse(localStorage.getItem("leetllm_learning_plan_v1")!).goal).toBe("rag")
        expect(screen.getByRole("heading", { name: "RAG and Search Systems" })).toBeTruthy()
    })

    test("falls back to the saved plan when return URL answers are invalid", async () => {
        localStorage.setItem("leetllm_learning_plan_v1", JSON.stringify({ goal: "rag", level: "working", weeklyHours: 4 }))
        window.history.replaceState({}, "", "/start?goal=unknown&level=working&weeklyHours=4")
        render(<LearningPlanBuilder tracks={tracks} catalog={catalog} />)
        expect(await screen.findByRole("heading", { name: "RAG and Search Systems" })).toBeTruthy()
    })

    test("builds, saves, and instruments a plan from three answers", async () => {
        render(<LearningPlanBuilder tracks={tracks} catalog={catalog} />)

        await screen.findByRole("heading", { name: "Start with a path you can finish" })
        fireEvent.click(screen.getByRole("button", { name: /RAG and search engineer/i }))
        fireEvent.click(screen.getByRole("button", { name: /Building with AI/i }))
        fireEvent.click(screen.getByRole("button", { name: /4 hours/i }))
        fireEvent.click(screen.getByRole("button", { name: /Build my plan/i }))

        expect(await screen.findByRole("heading", { name: "RAG and Search Systems" })).toBeTruthy()
        expect(screen.getByRole("link", { name: /Start plan/i }).getAttribute("href")).toBe(
            "/learn/sentence-embeddings-contrastive-learning"
        )
        expect(JSON.parse(localStorage.getItem("leetllm_learning_plan_v1")!)).toEqual(expect.objectContaining({
            goal: "rag",
            level: "working",
            weeklyHours: 4,
        }))
        await waitFor(() => expect(trackEvent).toHaveBeenCalledWith("track_selected", expect.objectContaining({
            track: "rag-and-search-systems",
            goal: "rag",
            level: "working",
            weekly_hours: 4,
        })))
        expect(screen.getByRole("heading", { name: "Weekly learning loops" })).toBeTruthy()
        expect(screen.getAllByText("Section check").length).toBeGreaterThan(0)
        expect(screen.getAllByText("Coding lab").length).toBeGreaterThan(0)
        expect(screen.getAllByText("Milestone").length).toBeGreaterThan(0)
    })

    test("offers and builds the AI Research Scientist path", async () => {
        render(<LearningPlanBuilder tracks={tracks} catalog={catalog} />)

        fireEvent.click(await screen.findByRole("button", { name: /AI research scientist/i }))
        fireEvent.click(screen.getByRole("button", { name: /Experienced practitioner/i }))
        fireEvent.click(screen.getByRole("button", { name: /6 hours/i }))
        fireEvent.click(screen.getByRole("button", { name: /Build my plan/i }))

        expect(await screen.findByRole("heading", { name: "AI Research Scientist" })).toBeTruthy()
        expect(screen.getByText("28 lessons")).toBeTruthy()
        expect(screen.getByText("Design a controlled experiment and power plan")).toBeTruthy()
        expect(screen.getByText(/reconstruct every planned comparison and rejection threshold/i)).toBeTruthy()
        expect(screen.getByRole("link", { name: /Start plan/i }).getAttribute("href")).toBe(
            "/learn/linear-algebra-machine-learning-deeper"
        )
    })

    test("offers and builds the Production ML Systems path", async () => {
        render(<LearningPlanBuilder tracks={tracks} catalog={catalog} />)

        fireEvent.click(await screen.findByRole("button", { name: /Production ML engineer/i }))
        fireEvent.click(screen.getByRole("button", { name: /Building with AI/i }))
        fireEvent.click(screen.getByRole("button", { name: /4 hours/i }))
        fireEvent.click(screen.getByRole("button", { name: /Build my plan/i }))

        expect(await screen.findByRole("heading", { name: "Production ML Systems" })).toBeTruthy()
        expect(screen.getByText("13 lessons")).toBeTruthy()
        expect(screen.getByRole("link", { name: /Start plan/i }).getAttribute("href")).toBe(
            "/learn/numpy-and-tensor-shapes"
        )
    })
})
