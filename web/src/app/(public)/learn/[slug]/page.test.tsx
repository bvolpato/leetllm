import { render, screen } from "@testing-library/react"
import { beforeEach, expect, test, vi } from "vitest"
import { getQuestionForUser } from "@/lib/questions"
import { getLessonVideo } from "@/lib/lesson-videos"
import { ReadingProgressProvider } from "@/lib/reading-progress"
import LearnArticlePage, { dynamicParams, generateMetadata, revalidate } from "./page"

vi.mock("@/lib/use-is-logged-in", () => ({
    useIsLoggedIn: () => ({ user: null, isLoggedIn: false, authLoaded: true }),
}))

vi.mock("@/components/server-markdown-renderer", () => ({
    ServerMarkdownRenderer: () => <div data-testid="markdown-body" />,
}))

vi.mock("@/components/mastery-quiz", () => ({
    MasteryQuiz: () => <div data-testid="mastery-quiz" />,
}))

vi.mock("@/components/article-comments", () => ({
    ArticleComments: () => <div data-testid="article-comments" />,
}))

vi.mock("@/components/article-tracker", () => ({
    ArticleTracker: () => null,
}))

vi.mock("@/lib/lesson-videos", () => ({
    getLessonVideo: vi.fn(),
}))

beforeEach(() => {
    vi.mocked(getLessonVideo).mockReset()
    vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
            json: vi.fn().mockResolvedValue({ slugs: [] }),
        })
    )
})

test("the canonical article toolbar shows its available recording without changing static rendering", async () => {
    vi.mocked(getLessonVideo).mockReturnValue({
        lessonId: "numpy-shapes",
        title: "Follow the tensor shape",
        url: "https://videos.leetllm.com/recordings/numpy/movie-sha.mp4",
        durationSeconds: 120,
        sha256: "b".repeat(64),
    })
    const page = await LearnArticlePage({ params: Promise.resolve({ slug: "numpy-and-tensor-shapes" }) })
    render(<ReadingProgressProvider>{page}</ReadingProgressProvider>)
    expect(getLessonVideo).toHaveBeenCalledWith("numpy-and-tensor-shapes")
    expect(screen.getByRole("button", { name: "Watch video: Follow the tensor shape" })).toBeTruthy()
    expect(document.querySelector("video")).toBeNull()
    expect(revalidate).toBe(false)
    expect(dynamicParams).toBe(false)
})

test("an article without a recording keeps the video action absent", async () => {
    const page = await LearnArticlePage({ params: Promise.resolve({ slug: "numpy-and-tensor-shapes" }) })
    render(<ReadingProgressProvider>{page}</ReadingProgressProvider>)
    expect(screen.queryByRole("button", { name: /^Watch video:/ })).toBeNull()
})

test("learn article route uses ISR and supports slugs missing from prerender manifest", () => {
    expect(revalidate).toBe(false)
    expect(dynamicParams).toBe(false)
})

test("learn article metadata rejects unknown slugs before streaming", async () => {
    await expect(generateMetadata({
        params: Promise.resolve({ slug: "definitely-not-real-slug" }),
    })).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404")
})

test("learn article metadata canonicalizes legacy slugs", async () => {
    const metadata = await generateMetadata({
        params: Promise.resolve({ slug: "decoder-only-lm-pretraining-lab" }),
    })

    expect(metadata.alternates?.canonical).toBe("/learn/build-gpt-from-scratch-lab")
})

test("learn article route permanently redirects legacy slugs", async () => {
    try {
        await LearnArticlePage({
            params: Promise.resolve({ slug: "decoder-only-lm-pretraining-lab" }),
        })
        throw new Error("Expected redirect")
    } catch (error) {
        expect((error as { digest?: string }).digest).toContain("NEXT_REDIRECT")
        expect((error as { digest?: string }).digest).toContain("/learn/build-gpt-from-scratch-lab")
        expect((error as { digest?: string }).digest).toContain("308")
    }
})

test("learn article places article-owned content before footer actions and references", async () => {
    const page = await LearnArticlePage({
        params: Promise.resolve({ slug: "numpy-and-tensor-shapes" }),
    })

    render(<ReadingProgressProvider>{page}</ReadingProgressProvider>)

    const question = getQuestionForUser("numpy-and-tensor-shapes", false)
    const nextCalloutMatch = question?.content.match(/^> \*\*Next:\*\* Continue to \[([^\]]+)\]\((\/learn\/[^)]+)\)/m)
    const nextTitle = nextCalloutMatch?.[1]
    const nextHref = nextCalloutMatch?.[2]

    const markdownBody = screen.getByTestId("markdown-body")
    const masteryQuiz = screen.getByTestId("mastery-quiz")
    const nextCallout = screen.getByRole("link", { name: /next step/i })
    const share = screen.getByText("Share this article")
    const references = screen.getByText("References")

    expect(screen.queryByText("Key Concepts Tested")).toBeNull()
    expect(screen.queryByText("Evaluation Rubric")).toBeNull()
    expect(screen.queryByText("Common Pitfalls")).toBeNull()
    expect(screen.queryByText("Follow-up Questions to Expect")).toBeNull()
    expect(screen.queryByText(/\d+ key concepts/)).toBeNull()
    expect(screen.queryByRole("button", { name: "Mark as Read" })).toBeNull()
    expect(
        markdownBody.compareDocumentPosition(masteryQuiz) &
            Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
        masteryQuiz.compareDocumentPosition(nextCallout) &
            Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(nextCallout.getAttribute("href")).toBe(nextHref)
    expect(screen.getByText(`Continue to ${nextTitle}`)).toBeTruthy()
    expect(
        nextCallout.compareDocumentPosition(share) &
            Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
        share.compareDocumentPosition(references) &
            Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
}, 15_000)

test("learn lesson exposes one semantic reader article", async () => {
    const page = await LearnArticlePage({
        params: Promise.resolve({ slug: "numpy-and-tensor-shapes" }),
    })

    const { container } = render(<ReadingProgressProvider>{page}</ReadingProgressProvider>)
    const article = container.querySelector('article[data-reader-article][itemtype="https://schema.org/Article"]')

    expect(article).toBeTruthy()
    expect(article?.querySelector('h1[itemprop="headline"]')).toBeTruthy()
    expect(article?.querySelector('[itemprop="articleBody"]')).toBeTruthy()
    expect(article?.querySelector("main")).toBeNull()
})
