import { afterEach, expect, test, vi } from "vitest"
import { copyMarkdownFromUrl, copyText } from "./copy-text"

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

test("copyText uses the clipboard API when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
    })

    await copyText("# hello")

    expect(writeText).toHaveBeenCalledWith("# hello")
})

test("copyMarkdownFromUrl fetches markdown then copies it", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
    })
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue("# exported"),
    }))

    await expect(copyMarkdownFromUrl("/api/md/ti-to")).resolves.toBe("# exported")
    expect(fetch).toHaveBeenCalledWith("/api/md/ti-to", {
        headers: { Accept: "text/markdown" },
    })
    expect(writeText).toHaveBeenCalledWith("# exported")
})
