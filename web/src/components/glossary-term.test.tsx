import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { beforeEach, expect, test, vi } from "vitest"
import { GlossaryTerm } from "./glossary-term"
import { getGlossaryEntry } from "@/lib/glossary-server"

beforeEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
            writeText: vi.fn().mockResolvedValue(undefined),
        },
    })
    vi.stubGlobal("fetch", vi.fn(async (url: string) => ({
        ok: true,
        json: async () => getGlossaryEntry(url.split("/").pop()!),
        text: async () => "# TI/TO\n",
    })))
})

test("loads only the hovered term and reuses its pending request when opening the dialog", async () => {
    let resolveEntry!: (value: Response) => void
    vi.mocked(fetch).mockImplementation(() => new Promise((resolve) => { resolveEntry = resolve }))
    const { container } = render(<GlossaryTerm id="softmax">softmax</GlossaryTerm>)
    expect(fetch).not.toHaveBeenCalled()

    fireEvent.mouseEnter(container.querySelector("[data-glossary-term]")!)
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce())
    expect(fetch).toHaveBeenCalledWith("/api/glossary/softmax", { headers: { Accept: "application/json" } })
    fireEvent.click(screen.getByRole("button", { name: "Open definition for Softmax" }))
    expect(within(screen.getByRole("dialog")).getByRole("status").textContent).toBe("Loading definition...")
    expect(fetch).toHaveBeenCalledOnce()

    await act(async () => resolveEntry({ ok: true, json: async () => getGlossaryEntry("softmax") } as Response))
    await waitFor(() => expect(within(screen.getByRole("dialog")).getByText("Definition")).toBeTruthy())
    expect(fetch).toHaveBeenCalledOnce()
})

test("includes a visible alias in the glossary trigger's accessible name", () => {
    render(<GlossaryTerm id="mixture-of-experts"><strong>MoE</strong></GlossaryTerm>)

    expect(screen.getByRole("button", {
        name: "Open definition for Mixture of experts: MoE",
    })).toBeTruthy()
})

test("retries a failed definition request and keeps the dialog available", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response)
    render(<GlossaryTerm id="abac">ABAC</GlossaryTerm>)
    fireEvent.click(screen.getByRole("button", { name: "Open definition for ABAC" }))
    await screen.findByRole("alert")
    fireEvent.click(screen.getByRole("button", { name: "Try again" }))
    await waitFor(() => expect(within(screen.getByRole("dialog")).getByText("Definition")).toBeTruthy())
    expect(fetch).toHaveBeenCalledTimes(2)
})

test("glossary dialog copies source markdown", async () => {
    render(
        <p>
            See <GlossaryTerm id="ti-to">TI/TO</GlossaryTerm>
        </p>,
    )

    fireEvent.click(screen.getByRole("button", { name: "Open definition for TI/TO" }))
    fireEvent.click(screen.getByRole("button", { name: "Copy as markdown" }))

    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith("/api/md/ti-to", {
            headers: { Accept: "text/markdown" },
        })
    })
    await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith("# TI/TO\n")
    })
})
