import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { StrictMode } from "react"
import { LessonVideoButton } from "./lesson-video-button"

const video = {
    lessonId: "tokenization",
    title: "Five Letters, How Many Positions?",
    url: "https://videos.leetllm.com/recordings/tokenization/movie-sha.mp4",
    durationSeconds: 673.3,
    poster: "https://videos.leetllm.com/recordings/tokenization/poster-sha.png",
    captions: "https://videos.leetllm.com/recordings/tokenization/captions-sha.vtt",
    sha256: "a".repeat(64),
}

beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {})
    vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {})
})

afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
})

test("development Strict Mode preserves the mounted recording source after its cleanup probe", async () => {
    render(<StrictMode><LessonVideoButton video={video} /></StrictMode>)
    fireEvent.click(screen.getByRole("button", { name: `Watch video: ${video.title}` }))
    const dialog = await screen.findByRole("dialog")
    expect(dialog.querySelector("video")?.getAttribute("src")).toBe(video.url)
})

test("loads media only inside the open dialog and keeps English captions optional and off", async () => {
    const { container } = render(<LessonVideoButton video={video} />)
    expect(container.querySelector("video")).toBeNull()
    expect(container.querySelector("track")).toBeNull()

    fireEvent.click(screen.getByRole("button", { name: `Watch video: ${video.title}` }))
    const dialog = await screen.findByRole("dialog", { name: video.title })
    const player = dialog.querySelector("video") as HTMLVideoElement
    expect(player.getAttribute("src")).toBe(video.url)
    expect(player.getAttribute("poster")).toBe(video.poster)
    expect(player.controls).toBe(true)
    expect(player.playsInline).toBe(true)
    expect(player.preload).toBe("metadata")
    expect(player.crossOrigin).toBe("anonymous")
    const captions = player.querySelector("track") as HTMLTrackElement
    expect(captions.getAttribute("src")).toBe(video.captions)
    expect(captions.srclang).toBe("en")
    expect(captions.default).toBe(false)

    fireEvent.click(within(dialog).getByRole("button", { name: "Close lesson video" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(document.querySelector("video")).toBeNull()
    expect(player.pause).toHaveBeenCalled()
    expect(player.hasAttribute("src")).toBe(false)
    expect(player.load).toHaveBeenCalled()
})

test("Escape closes playback and restores focus to the video action", async () => {
    render(<LessonVideoButton video={{ ...video, captions: undefined, poster: undefined }} />)
    const trigger = screen.getByRole("button", { name: `Watch video: ${video.title}` })
    trigger.focus()
    fireEvent.click(trigger)
    const dialog = await screen.findByRole("dialog")
    const player = dialog.querySelector("video") as HTMLVideoElement
    expect(player.querySelector("track")).toBeNull()
    expect(player.hasAttribute("crossorigin")).toBe(false)
    expect(player.hasAttribute("poster")).toBe(false)

    fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" })
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(document.activeElement).toBe(trigger)
    expect(player.pause).toHaveBeenCalled()
})

test("a media error offers the exact recording URL and a fresh open resets the failure", async () => {
    render(<LessonVideoButton video={video} />)
    const trigger = screen.getByRole("button", { name: `Watch video: ${video.title}` })
    fireEvent.click(trigger)
    const dialog = await screen.findByRole("dialog")
    fireEvent.error(dialog.querySelector("video") as HTMLVideoElement)
    const fallback = within(screen.getByRole("alert")).getByRole("link", { name: "Open the recording directly" })
    expect(fallback.getAttribute("href")).toBe(video.url)
    expect(fallback.getAttribute("rel")).toBe("noopener noreferrer")
    fireEvent.click(within(dialog).getByRole("button", { name: "Close lesson video" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    fireEvent.click(trigger)
    await screen.findByRole("dialog")
    expect(screen.queryByRole("alert")).toBeNull()
})
