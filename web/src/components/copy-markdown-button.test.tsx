import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, expect, test, vi } from "vitest"
import { CopyMarkdownButton } from "./copy-markdown-button"

beforeEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
            writeText: vi.fn().mockResolvedValue(undefined),
        },
    })
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue("# TI/TO\n\nToken IDs stay the same."),
    }))
})

test("copies exported markdown for a slug", async () => {
    render(<CopyMarkdownButton slug="ti-to" />)

    fireEvent.click(screen.getByRole("button", { name: "Copy as markdown" }))

    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith("/api/md/ti-to", {
            headers: { Accept: "text/markdown" },
        })
    })
    await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith("# TI/TO\n\nToken IDs stay the same.")
    })
    expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy()
})
