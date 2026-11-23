import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, describe, expect, test } from "vitest"
import { IllustrationViewer } from "./illustration-viewer"

const originalWidth = window.innerWidth
const originalHeight = window.innerHeight

afterEach(() => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth })
    Object.defineProperty(window, "innerHeight", { configurable: true, value: originalHeight })
})

describe("IllustrationViewer", () => {
    test("Fit accounts for the viewport padding at desktop sizes", async () => {
        render(
            <IllustrationViewer
                src="/diagram.png"
                alt="Padded diagram"
                displayWidth={1080}
                displayHeight={630}
            />,
        )
        fireEvent.click(screen.getByRole("button", { name: "View larger: Padded diagram" }))
        const dialog = await screen.findByRole("dialog")
        const viewport = within(dialog).getByRole("region")
        viewport.style.padding = "20px"
        viewport.getBoundingClientRect = () => ({ width: 720, height: 500 }) as DOMRect
        fireEvent(window, new Event("resize"))
        fireEvent.click(within(dialog).getByRole("button", { name: "Fit figure to viewer" }))

        const image = within(dialog).getByAltText("Padded diagram")
        await waitFor(() => expect(image.style.width).toBe("680px"))
        expect(Number.parseInt(image.style.height, 10)).toBeLessThanOrEqual(460)
        expect(viewport.className).toContain("items-center justify-center")
    })

    test("opens at native display size, fits on request, zooms, and restores focus after Escape", async () => {
        Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 })
        Object.defineProperty(window, "innerHeight", { configurable: true, value: 844 })
        render(
            <IllustrationViewer
                src="/cdn/content-image/learn/attention/illustrations/_generated/attention.png"
                alt="Attention map"
                displayWidth={1080}
                displayHeight={630}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/responsive-attention.png" alt="Attention map" srcSet="/responsive-attention.png 1x" />
            </IllustrationViewer>,
        )

        const trigger = screen.getByRole("button", { name: "View larger: Attention map" })
        trigger.focus()
        fireEvent.click(trigger)

        const dialog = await screen.findByRole("dialog")
        const image = within(dialog).getByAltText("Attention map") as HTMLImageElement
        expect(image.getAttribute("src")).toContain("_generated/attention.png")
        expect(image.hasAttribute("srcset")).toBe(false)
        expect(image.style.width).toBe("1080px")

        fireEvent.click(within(dialog).getByRole("button", { name: "Fit figure to viewer" }))
        await waitFor(() => expect(Number.parseInt(image.style.width, 10)).toBeLessThan(1080))

        fireEvent.click(within(dialog).getByRole("button", { name: "View figure at 100 percent" }))
        expect(image.style.width).toBe("1080px")
        fireEvent.click(within(dialog).getByRole("button", { name: "Zoom in" }))
        expect(image.style.width).toBe("1350px")

        fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" })
        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
        expect(document.activeElement).toBe(trigger)
    })
})
