import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { LearnSearchBox } from "./learn-search-box"

const push = vi.fn()

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push }),
}))

describe("LearnSearchBox", () => {
    beforeEach(() => {
        vi.useRealTimers()
        push.mockReset()
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                total: 1,
                results: [
                    {
                        id: "cuda-gpu-computing-for-ml",
                        title: "CUDA for ML Training",
                        slug: "cuda-gpu-computing-for-ml",
                        section: "Computing Foundations",
                        difficulty: "Easy",
                        timeEstimate: 8,
                        snippet: "CUDA turns matrix multiplies into GPU work instead of CPU loops.",
                        snippetSource: "content",
                    },
                ],
            }),
        }))
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.unstubAllGlobals()
    })

    test("renders highlighted result text", async () => {
        render(<LearnSearchBox />)

        const input = screen.getByRole("combobox", { name: "Search curriculum" })
        fireEvent.change(input, { target: { value: "cuda" } })

        await screen.findByText(/GPU work instead of CPU loops/i)
        expect(screen.getAllByText(/cuda/i, { selector: "mark" }).length).toBeGreaterThan(0)
        expect(screen.getByText(/GPU work instead of CPU loops/i)).toBeDefined()
    })

    test("pressing enter opens active result", async () => {
        render(<LearnSearchBox />)

        const input = screen.getByRole("combobox", { name: "Search curriculum" })
        fireEvent.change(input, { target: { value: "cuda" } })
        await screen.findByText(/GPU work instead of CPU loops/i)

        fireEvent.keyDown(input, { key: "Enter" })

        expect(push).toHaveBeenCalledWith("/learn/cuda-gpu-computing-for-ml")
    })

    test("does not activate results belonging to the previous query", async () => {
        render(<LearnSearchBox />)
        const input = screen.getByRole("combobox", { name: "Search curriculum" })
        fireEvent.change(input, { target: { value: "cuda" } })
        await screen.findByRole("option")

        fireEvent.change(input, { target: { value: "reward" } })
        fireEvent.keyDown(input, { key: "Enter" })

        expect(push).not.toHaveBeenCalled()
        expect(screen.queryByRole("option")).toBeNull()
        expect(input.getAttribute("aria-activedescendant")).toBeNull()
    })

    test("Escape dismisses results and Enter cannot activate a hidden result", async () => {
        render(<LearnSearchBox />)
        const input = screen.getByRole("combobox", { name: "Search curriculum" })
        fireEvent.change(input, { target: { value: "cuda" } })
        await screen.findByRole("option")

        fireEvent.keyDown(input, { key: "Escape" })
        fireEvent.keyDown(input, { key: "Enter" })

        expect(push).not.toHaveBeenCalled()
        expect(input.getAttribute("aria-expanded")).toBe("false")
        expect(input.getAttribute("aria-activedescendant")).toBeNull()
        expect(screen.queryByRole("listbox")).toBeNull()
    })

    test("a delayed response does not reopen dismissed results", async () => {
        const response = await vi.mocked(fetch)("/test-fixture")
        let resolveFetch!: (value: Response) => void
        vi.mocked(fetch).mockReturnValue(new Promise<Response>((resolve) => { resolveFetch = resolve }))
        vi.mocked(fetch).mockClear()
        render(<LearnSearchBox />)
        const input = screen.getByRole("combobox", { name: "Search curriculum" })
        fireEvent.change(input, { target: { value: "cuda" } })
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
        fireEvent.keyDown(input, { key: "Escape" })

        await act(async () => { resolveFetch(response) })

        expect(screen.getByRole("status").textContent).toBe("1 match")
        expect(input.getAttribute("aria-expanded")).toBe("false")
        expect(screen.queryByRole("listbox")).toBeNull()
    })

    test("discards an older response even when the transport ignores abort", async () => {
        const response = await vi.mocked(fetch)("/test-fixture")
        const newerResponse = { ok: true, json: async () => ({ total: 1, results: [{
            ...(await response.json()).results[0], id: "reward", slug: "reward", title: "Reward modeling",
        }] }) }
        let resolveOld!: (value: Response) => void
        vi.mocked(fetch).mockReset()
        vi.mocked(fetch).mockReturnValueOnce(new Promise<Response>((resolve) => { resolveOld = resolve }))
            .mockResolvedValueOnce(newerResponse as Response)
        render(<LearnSearchBox />)
        const input = screen.getByRole("combobox", { name: "Search curriculum" })
        fireEvent.change(input, { target: { value: "cuda" } })
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
        fireEvent.change(input, { target: { value: "reward" } })
        await screen.findByText(/modeling/i)

        await act(async () => { resolveOld(response) })
        fireEvent.keyDown(input, { key: "Enter" })

        expect(push).toHaveBeenCalledWith("/learn/reward")
    })

    test("reports HTTP failure separately from no matches", async () => {
        vi.mocked(fetch).mockResolvedValue({ ok: false } as Response)
        render(<LearnSearchBox />)
        fireEvent.change(screen.getByRole("combobox"), { target: { value: "cuda" } })

        await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Search is unavailable"))
        expect(screen.queryByRole("option")).toBeNull()
        expect(screen.queryByText(/No matches/)).toBeNull()
    })

    test("composing Enter edits input without opening a lesson", async () => {
        render(<LearnSearchBox />)
        const input = screen.getByRole("combobox")
        fireEvent.change(input, { target: { value: "cuda" } })
        await screen.findByRole("option")
        fireEvent.keyDown(input, { key: "Enter", isComposing: true })
        expect(push).not.toHaveBeenCalled()
    })

    test("arrow selection scrolls only the result list and names an existing active option", async () => {
        const response = await vi.mocked(fetch)("/test-fixture")
        const first = (await response.json()).results[0]
        vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ total: 2, results: [
            first, { ...first, id: "cuda-second", slug: "cuda-second", title: "CUDA memory" },
        ] }) } as Response)
        render(<LearnSearchBox />)
        const input = screen.getByRole("combobox")
        fireEvent.change(input, { target: { value: "cuda" } })
        await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(2))
        const [firstOption, second] = screen.getAllByRole("option")
        const listbox = screen.getByRole("listbox")
        firstOption.getBoundingClientRect = () => new DOMRect(0, 100, 300, 40)
        second.getBoundingClientRect = () => new DOMRect(0, 180, 300, 80)
        listbox.getBoundingClientRect = () => new DOMRect(0, 100, 300, 100)
        listbox.scrollTop = 10
        const scrollIntoView = vi.fn()
        second.scrollIntoView = scrollIntoView
        fireEvent.keyDown(input, { key: "ArrowDown" })

        expect(listbox.scrollTop).toBe(70)
        expect(scrollIntoView).not.toHaveBeenCalled()
        expect(input.getAttribute("aria-activedescendant")).toBe(second.id)
        expect(second.getAttribute("aria-selected")).toBe("true")
        fireEvent.keyDown(input, { key: "Enter" })
        expect(push).toHaveBeenCalledWith("/learn/cuda-second")
    })

    test("moving keyboard focus outside search dismisses its popup", async () => {
        render(<><LearnSearchBox /><button>Continue browsing</button></>)
        const input = screen.getByRole("combobox")
        fireEvent.change(input, { target: { value: "cuda" } })
        await screen.findByRole("option")
        fireEvent.blur(input, { relatedTarget: screen.getByRole("button", { name: "Continue browsing" }) })
        expect(screen.queryByRole("listbox")).toBeNull()
        expect(input.getAttribute("aria-expanded")).toBe("false")
    })
})
