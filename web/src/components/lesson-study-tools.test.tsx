import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, test, vi } from "vitest"
import { LessonStudyTools } from "./lesson-study-tools"

vi.mock("@/lib/use-is-logged-in", () => ({
    useIsLoggedIn: () => ({ isLoggedIn: false, authLoaded: true }),
}))

describe("LessonStudyTools", () => {
    beforeEach(() => localStorage.clear())

    test("bookmarks a lesson without adding persistent article UI", async () => {
        render(<LessonStudyTools slug="attention" title="Attention" />)

        fireEvent.click(screen.getByRole("button", { name: "Bookmark Attention" }))

        await waitFor(() => expect(screen.getByRole("button", { name: "Remove bookmark for Attention" })).toBeTruthy())
        expect(JSON.parse(localStorage.getItem("leetllm_bookmarked_lessons")!)).toEqual([
            expect.objectContaining({ slug: "attention", bookmarked: true }),
        ])

        fireEvent.click(screen.getByRole("button", { name: "Remove bookmark for Attention" }))
        expect(JSON.parse(localStorage.getItem("leetllm_bookmarked_lessons")!)).toEqual([
            expect.objectContaining({ slug: "attention", bookmarked: false }),
        ])
    })

    test("saves and restores a lesson note from the notes sheet", async () => {
        render(<LessonStudyTools slug="attention" title="Attention" />)

        fireEvent.click(screen.getByRole("button", { name: "Notes for Attention" }))
        fireEvent.change(await screen.findByRole("textbox", { name: "Note" }), {
            target: { value: "Review causal masking." },
        })
        fireEvent.click(screen.getByRole("button", { name: "Save note" }))

        expect(JSON.parse(localStorage.getItem("leetllm_lesson_notes")!)).toEqual([
            expect.objectContaining({ slug: "attention", body: "Review causal masking.", deleted: false }),
        ])
        expect(screen.getByText("Saved")).toBeTruthy()
    })
})
