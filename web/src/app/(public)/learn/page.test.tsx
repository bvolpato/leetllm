import { expect, test, vi } from "vitest"
import { getLessonVideo } from "@/lib/lesson-videos"
import LearnPage, { revalidate } from "./page"

vi.mock("@/lib/lesson-videos", () => ({ getLessonVideo: vi.fn() }))

test("the static lesson list attaches recordings by canonical article slug", async () => {
    const video = {
        lessonId: "numpy-shapes",
        title: "Follow the tensor shape",
        url: "https://videos.leetllm.com/lessons/numpy/movie-sha.mp4",
        durationSeconds: 120,
        sha256: "b".repeat(64),
    }
    vi.mocked(getLessonVideo).mockImplementation(slug => slug === "numpy-and-tensor-shapes" ? video : undefined)
    const page = await LearnPage()
    const sections = page.props.sectionsData as Array<{ questions: Array<{ slug: string; video?: typeof video }> }>
    const rows = sections.flatMap(section => section.questions)
    expect(rows.find(row => row.slug === "numpy-and-tensor-shapes")?.video).toEqual(video)
    expect(rows.filter(row => row.video)).toHaveLength(1)
    expect(getLessonVideo).toHaveBeenCalledWith("numpy-and-tensor-shapes")
    expect(revalidate).toBe(false)
})
