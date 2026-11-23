import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, test, vi } from "vitest"
import { DashboardClient } from "./dashboard-client"
import type { DashboardLesson } from "@/lib/dashboard"
import type { PlanTrack } from "@/lib/learning-plan"
import { getTrackLessons, getTracks } from "@/lib/tracks"

const lessons: DashboardLesson[] = [
    { slug: "one", title: "Lesson One", shortDescription: "First lesson", section: "Computing Foundations", timeEstimate: 10 },
    { slug: "two", title: "Lesson Two", shortDescription: "Second lesson", section: "Computing Foundations", timeEstimate: 15 },
]

const tracks: PlanTrack[] = getTracks()
    .filter((track) => track.slug === "ai-engineer-foundations")
    .map((track) => ({ ...track, lessons: getTrackLessons(track) }))
const catalog = { practiceProblems: [], theoryQuizzes: [] }

describe("DashboardClient", () => {
    beforeEach(() => {
        localStorage.clear()
        localStorage.setItem("leetllm_learning_plan_v1", JSON.stringify({
            goal: "foundations",
            level: "new",
            weeklyHours: 2,
        }))
        vi.stubGlobal("fetch", vi.fn((input: RequestInfo | URL) => {
            const url = String(input)
            if (url === "/api/progress") {
                return Promise.resolve(new Response(JSON.stringify({ slugs: ["one"], completed: [{ slug: "one", completedAt: "2026-01-01" }] })))
            }
            if (url === "/api/study-state") {
                return Promise.resolve(new Response(JSON.stringify({
                    bookmarks: [],
                    notes: [],
                    quizAttempts: [{ slug: "one", kind: "mastery", correct: 2, total: 5, score: 40, passed: false, attemptedAt: "2026-01-02" }],
                    plan: null,
                })))
            }
            return Promise.resolve(new Response(JSON.stringify({ slugs: [] })))
        }))
    })

    test("prioritizes continuation, current plan, and weak-topic review", async () => {
        render(<DashboardClient lessons={lessons} tracks={tracks} quizzes={[]} catalog={catalog} />)

        expect(await screen.findByRole("heading", { name: "Pick up where you left off" })).toBeTruthy()
        expect(screen.getAllByRole("link", { name: /section check/i }).some((link) => link.getAttribute("href") === "/practice/section-check/foundations/new/2/1")).toBe(true)
        expect(screen.getByText("AI Engineer Foundations · 2+ hours/week")).toBeTruthy()
        expect(screen.getByRole("heading", { name: "Review next" })).toBeTruthy()
        expect(screen.getByText("Best score 40%")).toBeTruthy()
    })
})
