import { expect, test, vi } from "vitest"

vi.mock("@/generated/lesson-videos.json", () => ({
    default: {
        schemaVersion: 1,
        videos: {
            lesson: { lessonId: "lesson", title: "Lesson", url: "https://example.com/old.mp4", durationSeconds: 60, sha256: "old" },
            replacement: { lessonId: "replacement", title: "Replacement", url: "https://example.com/new.mp4", durationSeconds: 70, sha256: "new" },
            unchanged: { lessonId: "unchanged", title: "Unchanged", url: "https://example.com/valid.mp4", durationSeconds: 80, sha256: "valid" },
        },
    },
}))

vi.mock("./withheld-lesson-videos.json", () => ({
    default: {
        lesson: { sha256: "old", reason: "The recording teaches the removed example." },
        replacement: { sha256: "old", reason: "The prior recording taught the removed example." },
    },
}))

import { getLessonVideo } from "./lesson-videos"

test("withholds the reviewed recording while allowing its replacement and other lessons", () => {
    expect(getLessonVideo("lesson")).toBeUndefined()
    expect(getLessonVideo("replacement")?.url).toBe("https://example.com/new.mp4")
    expect(getLessonVideo("unchanged")?.url).toBe("https://example.com/valid.mp4")
    expect(getLessonVideo("missing")).toBeUndefined()
    expect(getLessonVideo("toString")).toBeUndefined()
})
