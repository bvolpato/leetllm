import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, test, vi } from "vitest"
import { LearnPageClient } from "./learn-page-client"

const progress = vi.hoisted(() => ({ completed: new Set<string>() }))

vi.mock("@/lib/use-is-logged-in", () => ({
    useIsLoggedIn: () => ({ isLoggedIn: false, authLoaded: true }),
}))

vi.mock("@/components/reading-progress", () => ({
    LoginToTrackPrompt: () => <div data-testid="login-to-track-prompt" />,
    OverallProgress: ({ totalArticles }: { totalArticles: number }) => (
        <div data-testid="overall-progress">{totalArticles}</div>
    ),
}))

vi.mock("@/lib/reading-progress", () => ({
    useReadingProgress: () => ({ isRead: (slug: string) => progress.completed.has(slug) }),
}))

vi.mock("./learn-search-box", () => ({
    LearnSearchBox: () => <div data-testid="learn-search-box" />,
}))

const sectionsData = [
    {
        name: "Computing Foundations",
        config: {
            icon: "🛠️",
            description: "Foundation step",
            color: "text-cyan-400",
        },
        questions: [
            {
                id: "git-shell-linux-reproducible-ai",
                title: "Git, Shell, Linux for AI",
                slug: "git-shell-linux-reproducible-ai",
                shortDescription: "Repo basics.",
                difficulty: "Easy",
                category: "MLOps & Deployment",
                timeEstimate: 7,
                diffConfig: {
                    color: "text-emerald-700",
                    bg: "bg-emerald-500/15",
                    border: "border-emerald-600/30",
                },
                catConfig: {
                    icon: "⚙️",
                    color: "text-slate-400",
                },
            },
        ],
    },
]

describe("LearnPageClient", () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        progress.completed.clear()
        window.localStorage.clear()
    })

    test("can hide and show desktop sidebar", () => {
        render(
            <LearnPageClient
                sectionsData={sectionsData}
                totalCount={1}
                isLoggedIn={false}
            />
        )

        expect(screen.getByTestId("learn-sidebar")).toBeDefined()

        const hide = screen.getByRole("button", { name: "Hide sidebar" })
        hide.focus()
        fireEvent.click(hide)

        expect(screen.queryByTestId("learn-sidebar")).toBeNull()
        expect(window.localStorage.getItem("leetllm_learn_sidebar_visible")).toBe("0")
        expect(screen.getByRole("button", { name: "Show sidebar" })).toBeDefined()
        expect(document.activeElement).toBe(screen.getByRole("button", { name: "Show sidebar" }))

        fireEvent.click(screen.getByRole("button", { name: "Show sidebar" }))

        expect(screen.getByTestId("learn-sidebar")).toBeDefined()
        expect(window.localStorage.getItem("leetllm_learn_sidebar_visible")).toBe("1")
        expect(document.activeElement).toBe(screen.getByRole("button", { name: "Hide sidebar" }))
    })

    test("restores hidden sidebar preference from localStorage", async () => {
        window.localStorage.setItem("leetllm_learn_sidebar_visible", "0")

        render(
            <LearnPageClient
                sectionsData={sectionsData}
                totalCount={1}
                isLoggedIn={false}
            />
        )

        await waitFor(() => expect(screen.queryByTestId("learn-sidebar")).toBeNull())
        expect(screen.getByRole("button", { name: "Show sidebar" })).toBeDefined()
    })

    test("starts at the first lesson without requiring a plan or account", () => {
        render(<LearnPageClient sectionsData={sectionsData} totalCount={1} />)
        expect(screen.getByRole("link", { name: "Start learning" }).getAttribute("href"))
            .toBe("/learn/git-shell-linux-reproducible-ai")
    })

    test("available recordings open beside the article link and missing recordings have no video action", async () => {
        vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {})
        vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {})
        const recording = {
            lessonId: "git-shell",
            title: "Read the changed files",
            url: "https://videos.leetllm.com/lessons/git/movie-sha.mp4",
            durationSeconds: 90,
            sha256: "c".repeat(64),
        }
        const data = [{ ...sectionsData[0], questions: [
            { ...sectionsData[0].questions[0], video: recording },
            { ...sectionsData[0].questions[0], id: "docker", slug: "docker", title: "Docker" },
        ] }]
        render(<LearnPageClient sectionsData={data} totalCount={2} />)
        const action = screen.getByRole("button", { name: "Watch video: Read the changed files" })
        expect(action.closest("a")).toBeNull()
        expect(screen.getByRole("link", { name: "Git, Shell, Linux for AI (7 minutes)" }).getAttribute("href"))
            .toBe("/learn/git-shell-linux-reproducible-ai")
        expect(screen.getAllByRole("button", { name: /^Watch video:/ })).toHaveLength(1)
        expect(document.querySelector("video")).toBeNull()
        fireEvent.click(action)
        await screen.findByRole("dialog", { name: recording.title })
        expect(document.querySelector("video")?.getAttribute("src")).toBe(recording.url)
        fireEvent.click(screen.getByRole("button", { name: "Close lesson video" }))
        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
        expect(document.activeElement).toBe(action)
    })

    test("continues at the first unfinished lesson in curriculum order", () => {
        progress.completed.add("git-shell-linux-reproducible-ai")
        const nextLesson = { ...sectionsData[0].questions[0], id: "docker", slug: "docker", title: "Docker" }
        const data = [{ ...sectionsData[0], questions: [...sectionsData[0].questions, nextLesson] }]
        render(<LearnPageClient sectionsData={data} totalCount={2} />)
        expect(screen.getByRole("link", { name: "Continue learning" }).getAttribute("href")).toBe("/learn/docker")
        expect(screen.getByText(/1 of 2 lessons completed/)).toBeDefined()
    })

    test("offers review after completing every lesson", () => {
        progress.completed.add("git-shell-linux-reproducible-ai")
        render(<LearnPageClient sectionsData={sectionsData} totalCount={1} />)
        expect(screen.getByRole("link", { name: "Revisit the first lesson" }).getAttribute("href"))
            .toBe("/learn/git-shell-linux-reproducible-ai")
    })

    test("keeps navigation and toggles usable when storage is unavailable", () => {
        vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Storage disabled") })
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Storage disabled") })
        render(<LearnPageClient sectionsData={sectionsData} totalCount={1} />)
        fireEvent.click(screen.getByRole("button", { name: "Hide sidebar" }))
        expect(screen.getByRole("button", { name: "Show sidebar" })).toBeDefined()
        expect(screen.getByRole("link", { name: "Start learning" }).getAttribute("href"))
            .toBe("/learn/git-shell-linux-reproducible-ai")
    })
})
