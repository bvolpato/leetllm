import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, describe, expect, test, vi } from "vitest"
import { AnimatedIllustration } from "./animated-illustration"

let theme = "dark"
vi.mock("next-themes", () => ({
    useTheme: () => ({ resolvedTheme: theme }),
}))

const originalMatchMedia = window.matchMedia

function setReducedMotion(matches: boolean) {
    Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: vi.fn().mockReturnValue({
            matches,
            media: "(prefers-reduced-motion: reduce)",
            onchange: null,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
            dispatchEvent: vi.fn(),
        } as unknown as MediaQueryList),
    })
}

afterEach(() => {
    theme = "dark"
    vi.unstubAllGlobals()
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
    Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: originalMatchMedia,
    })
})

const timelineData = JSON.stringify({
    kind: "timeline",
    alt: "Animated transfer",
    width: 1080,
    height: 500,
    duration: 7200,
    fps: 10,
    darkGif: "/transfer_dark.gif",
    lightGif: "/transfer_light.gif",
    darkFallback: "/transfer_dark.png",
    lightFallback: "/transfer_light.png",
})

const sceneData = JSON.stringify({
    alt: "Training run",
    width: 1200,
    height: 675,
    darkScenes: ["/run-setup_dark.png", "/run-complete_dark.png"],
    lightScenes: ["/run-setup_light.png", "/run-complete_light.png"],
    scenes: [
        { index: 0, duration: 60000, transition: "fade", transitionDuration: 120, label: "Setup" },
        { index: 1, duration: 60000, transition: "fade", transitionDuration: 120, label: "Run complete" },
    ],
})

const filmData = JSON.stringify({
    kind: "film",
    alt: "Values move back from the goal",
    width: 1920,
    height: 1080,
    duration: 12000,
    darkVideo: "/backup_dark.mp4",
    lightVideo: "/backup_light.mp4",
    darkCaptions: "/backup_dark.vtt",
    lightCaptions: "/backup_light.vtt",
    darkFallback: "/backup_dark.png",
    lightFallback: "/backup_light.png",
})

describe("AnimatedIllustration film playback", () => {
    test("keeps a paused film paused at the same time after a theme switch", async () => {
        setReducedMotion(false)
        const { rerender } = render(<AnimatedIllustration data={filmData} />)
        await act(async () => {})
        fireEvent.click(screen.getByRole("button", { name: "Play animation: Values move back from the goal" }))
        const dark = screen.getByLabelText("Values move back from the goal") as HTMLVideoElement
        dark.currentTime = 4
        fireEvent.timeUpdate(dark)
        fireEvent.pause(dark)
        theme = "light"
        rerender(<AnimatedIllustration data={filmData} />)
        const light = screen.getByLabelText("Values move back from the goal") as HTMLVideoElement
        Object.defineProperty(light, "duration", { value: 12 })
        fireEvent.loadedMetadata(light)
        expect(light.src).toContain("backup_light.mp4")
        expect(light.autoplay).toBe(false)
        expect(light.currentTime).toBe(4)
    })

    test("waits for an explicit play action and preserves a printable static figure", async () => {
        setReducedMotion(true)
        const { container } = render(<AnimatedIllustration data={filmData} />)
        await act(async () => {})
        expect(container.querySelector("video")).toBeNull()
        expect(container.querySelector(".print\\:block")?.getAttribute("src")).toBe("/backup_light.png")

        fireEvent.click(screen.getByRole("button", { name: "Play animation: Values move back from the goal" }))
        const video = screen.getByLabelText("Values move back from the goal") as HTMLVideoElement
        expect(video.src).toContain("/backup_dark.mp4")
        expect(video.controls).toBe(true)
        expect(video.poster).toContain("/backup_dark.png")

        fireEvent.error(video)
        expect(container.querySelector("video")).toBeNull()
        expect(screen.getByRole("status").textContent).toContain("figure remains available")
        expect(screen.getByRole("button", { name: "Play animation: Values move back from the goal" })).toBeTruthy()
    })

    test("pauses a playing film when it leaves the viewport", async () => {
        setReducedMotion(false)
        let onVisibility: IntersectionObserverCallback = () => {}
        const disconnect = vi.fn()
        vi.stubGlobal("IntersectionObserver", class {
            constructor(callback: IntersectionObserverCallback) { onVisibility = callback }
            observe() {}
            disconnect = disconnect
        })
        const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {})
        const { unmount } = render(<AnimatedIllustration data={filmData} />)
        fireEvent.click(screen.getByRole("button", { name: "Play animation: Values move back from the goal" }))
        act(() => onVisibility([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver))
        expect(pause).toHaveBeenCalledOnce()
        unmount()
        expect(disconnect).toHaveBeenCalledOnce()
        vi.unstubAllGlobals()
    })
})

describe("AnimatedIllustration timeline playback", () => {
    test("honors reduced motion until user explicitly plays", async () => {
        setReducedMotion(true)
        render(<AnimatedIllustration data={timelineData} />)

        await waitFor(() => expect(screen.getByAltText("Animated transfer").getAttribute("src")).toBe("/transfer_dark.png"))
        expect(screen.getByText("Final frame")).toBeTruthy()

        fireEvent.click(screen.getByRole("button", { name: "Play animation" }))
        expect(screen.getByAltText("Animated transfer").getAttribute("src")).toBe("/transfer_dark.gif")

        fireEvent.click(screen.getByRole("button", { name: "Pause animation and show final frame" }))
        expect(screen.getByAltText("Animated transfer").getAttribute("src")).toBe("/transfer_dark.png")
        fireEvent.click(screen.getByRole("button", { name: "View larger: Animated transfer" }))
        const dialog = await screen.findByRole("dialog")
        expect(within(dialog).getByAltText("Animated transfer").getAttribute("src")).toBe("/transfer_dark.png")
    })

    test("autoplays when motion is allowed", async () => {
        setReducedMotion(false)
        render(<AnimatedIllustration data={timelineData} />)

        await waitFor(() => expect(screen.getByAltText("Animated transfer").getAttribute("src")).toBe("/transfer_dark.gif"))
        expect(screen.getByText("7.2s loop")).toBeTruthy()

        const inlineImage = screen.getByAltText("Animated transfer") as HTMLImageElement
        Object.defineProperty(inlineImage, "naturalWidth", { configurable: true, value: 1080 })
        Object.defineProperty(inlineImage, "naturalHeight", { configurable: true, value: 500 })
        const drawImage = vi.fn()
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D)
        vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,current-frame")

        fireEvent.click(screen.getByRole("button", { name: "View larger: Animated transfer" }))
        const dialog = await screen.findByRole("dialog")
        expect(within(dialog).getByAltText("Animated transfer").getAttribute("src")).toBe("data:image/png;base64,current-frame")
        expect(within(dialog).getByAltText("Animated transfer").getAttribute("width")).toBe("1080")
        expect(drawImage).toHaveBeenCalledWith(inlineImage, 0, 0)
        fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" })
        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    })

    test("opens the selected scene at full size and pauses the stepper", async () => {
        render(<AnimatedIllustration data={sceneData} />)
        fireEvent.click(screen.getByRole("button", { name: "Step 2: Run complete" }))

        const selectedScene = await screen.findByAltText("Training run, step 2: Run complete")
        await waitFor(() => expect(selectedScene.getAttribute("src")).toBe("/run-complete_dark.png"))
        fireEvent.click(screen.getByRole("button", { name: "View larger: Training run, step 2: Run complete" }))

        const dialog = await screen.findByRole("dialog")
        expect(within(dialog).getByAltText("Training run, step 2: Run complete").getAttribute("src")).toBe("/run-complete_dark.png")
        expect(within(dialog).getByText("Run complete")).toBeTruthy()
        expect(within(dialog).getByRole("button", { name: "View figure at 100 percent" })).toBeTruthy()
        fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" })
        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
        expect(screen.getByRole("button", { name: "Play" })).toBeTruthy()
    })

    test("finishes a pending scene change before opening the viewer", async () => {
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
        render(<AnimatedIllustration data={sceneData} />)

        fireEvent.click(screen.getByRole("button", { name: "Step 2: Run complete" }))
        fireEvent.click(screen.getByRole("button", { name: "View larger: Training run, step 1: Setup" }))

        const dialog = screen.getByRole("dialog")
        expect(within(dialog).getByAltText("Training run, step 2: Run complete").getAttribute("src")).toBe("/run-complete_dark.png")

        await act(async () => {
            vi.advanceTimersByTime(50)
        })
        expect(within(dialog).getByAltText("Training run, step 2: Run complete").getAttribute("src")).toBe("/run-complete_dark.png")
    })
})
