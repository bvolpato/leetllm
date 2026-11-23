import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, expect, test, vi } from "vitest"
import { ShareButtons } from "./share-buttons"

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
        text: vi.fn().mockResolvedValue("# Demo\n\n![alt](https://leetllm.com/cdn/content-image/demo.png)"),
    }))
})

test("shows copy as markdown for learn pages and copies exported markdown", async () => {
    render(
        <ShareButtons
            url="/learn/mechanistic-interpretability-sparse-autoencoders"
            title="Mechanistic Interpretability"
            description="Sparse autoencoders"
        />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Copy as markdown" }))

    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith("/api/md/mechanistic-interpretability-sparse-autoencoders", {
            headers: { Accept: "text/markdown" },
        })
    })
    await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith("# Demo\n\n![alt](https://leetllm.com/cdn/content-image/demo.png)")
    })
    expect(screen.getByText("Markdown copied!")).toBeTruthy()
})

test("does not show copy as markdown for non-article links", () => {
    render(
        <ShareButtons
            url="/privacy"
            title="Privacy"
        />,
    )

    expect(screen.queryByRole("button", { name: "Copy as markdown" })).toBeNull()
})
