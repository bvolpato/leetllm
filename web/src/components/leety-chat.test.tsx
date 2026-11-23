import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, expect, test, vi } from "vitest"
import { getGlossaryEntry } from "@/lib/glossary-server"

const authState = { isLoggedIn: false, authLoaded: true, userId: "user-1" }
let pathname = "/learn/attention"

vi.mock("next/navigation", () => ({ usePathname: () => pathname }))
vi.mock("@/lib/use-is-logged-in", () => ({
    useIsLoggedIn: () => ({
        ...authState,
        user: authState.isLoggedIn ? { id: authState.userId } : null,
    }),
}))

import { LeetyGate } from "./leety-chat"

beforeEach(() => {
    authState.isLoggedIn = false
    authState.authLoaded = true
    authState.userId = "user-1"
    pathname = "/learn/attention"
    let id = 0
    vi.stubGlobal("crypto", { randomUUID: () => `message-${++id}` })
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
        configurable: true,
        value: vi.fn(),
    })
    vi.stubGlobal("fetch", vi.fn())
    localStorage.clear()
})

test("shows a login launcher on public lessons for unauthenticated users", async () => {
    render(<LeetyGate />)

    const login = await screen.findByRole("link", { name: "Sign in to ask Leety about this page" })
    expect(login.getAttribute("href")).toBe("/login?next=%2Flearn%2Fattention")
    expect(screen.queryByRole("button", { name: "Ask Leety about this page" })).toBeNull()
})

test("shows the login launcher on public blog posts", async () => {
    pathname = "/blog/mixture-of-experts"
    render(<LeetyGate />)

    expect((await screen.findByRole("link", { name: "Sign in to ask Leety about this page" })).getAttribute("href")).toBe(
        "/login?next=%2Fblog%2Fmixture-of-experts",
    )
})

test("keeps the anonymous login launcher in the persistent header slot", async () => {
    render(
        <>
            <div id="leety-launcher-host" />
            <LeetyGate />
        </>,
    )

    await screen.findByRole("link", { name: "Sign in to ask Leety about this page" })
    const login = await waitFor(() => {
        const current = document.querySelector<HTMLAnchorElement>("#leety-launcher-host [data-leety-login]")
        expect(current).toBeTruthy()
        return current!
    })
    expect(login.getAttribute("href")).toBe("/login?next=%2Flearn%2Fattention")
})

test("opens Leety without login when a private page grants link access", async () => {
    pathname = "/blog/private-study-note"
    render(
        <>
            <main data-leety-access="link" />
            <LeetyGate />
        </>,
    )

    const launcher = await screen.findByRole("button", { name: "Ask Leety about this page" })
    expect(screen.queryByRole("link", { name: "Sign in to ask Leety about this page" })).toBeNull()
    fireEvent.click(launcher)
    expect((await screen.findByRole("textbox", { name: "Ask Leety" }) as HTMLTextAreaElement).disabled).toBe(false)
})

test("does not show Leety away from lesson and blog pages", () => {
    authState.isLoggedIn = true
    pathname = "/dashboard"
    render(<LeetyGate />)

    expect(screen.queryByRole("button", { name: "Ask Leety about this page" })).toBeNull()
    expect(screen.queryByRole("link", { name: "Sign in to ask Leety about this page" })).toBeNull()
})

test("opens authenticated chat on blog posts", async () => {
    authState.isLoggedIn = true
    pathname = "/blog/mixture-of-experts"
    render(<LeetyGate />)

    expect(screen.queryByRole("textbox", { name: "Ask Leety" })).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Ask Leety about this page" }))

    expect((await screen.findByRole("textbox", { name: "Ask Leety" }) as HTMLTextAreaElement).disabled).toBe(false)
})

test("the loaded chat trigger opens its sheet from the persistent header slot", async () => {
    authState.isLoggedIn = true
    render(
        <>
            <div id="leety-launcher-host" />
            <LeetyGate />
        </>,
    )

    fireEvent.click(await screen.findByRole("button", { name: "Ask Leety about this page" }))
    expect(await screen.findByRole("textbox", { name: "Ask Leety" })).toBeTruthy()
    fireEvent.keyDown(document, { key: "Escape" })
    await waitFor(() => expect(screen.queryByRole("textbox", { name: "Ask Leety" })).toBeNull())

    await screen.findByRole("button", { name: "Ask Leety about this page" })
    const trigger = await waitFor(() => {
        const current = document.querySelector<HTMLButtonElement>("#leety-launcher-host button[aria-label='Ask Leety about this page']")
        expect(current).toBeTruthy()
        return current!
    })
    fireEvent.click(trigger)
    expect(await screen.findByRole("textbox", { name: "Ask Leety" })).toBeTruthy()
})

test("closes Leety when Escape is pressed", async () => {
    authState.isLoggedIn = true
    render(<LeetyGate />)

    fireEvent.click(screen.getByRole("button", { name: "Ask Leety about this page" }))
    expect(await screen.findByRole("textbox", { name: "Ask Leety" })).toBeTruthy()

    fireEvent.keyDown(document, { key: "Escape" })

    await waitFor(() => expect(screen.queryByRole("textbox", { name: "Ask Leety" })).toBeNull())
})

test("closes Leety when the reader clicks the page backdrop", async () => {
    authState.isLoggedIn = true
    render(<LeetyGate />)

    fireEvent.click(screen.getByRole("button", { name: "Ask Leety about this page" }))
    await screen.findByRole("textbox", { name: "Ask Leety" })
    const backdrop = document.querySelector('[data-slot="sheet-overlay"]')
    expect(backdrop).not.toBeNull()

    fireEvent.click(backdrop as Element)

    await waitFor(() => expect(screen.queryByRole("textbox", { name: "Ask Leety" })).toBeNull())
})

test("sends only pathname and conversation, then renders grounded answer and source", async () => {
    authState.isLoggedIn = true
    vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
            status: "answer",
            answer: "Queries **select** relevant keys.",
            pageTitle: "Attention",
            sources: [{ title: "Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }],
        }),
    } as unknown as Response)
    render(<LeetyGate />)

    fireEvent.click(screen.getByRole("button", { name: "Ask Leety about this page" }))
    fireEvent.change(await screen.findByRole("textbox", { name: "Ask Leety" }), {
        target: { value: "How do queries work?" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Send question" }))

    await waitFor(() => expect(screen.getByText("select")).toBeTruthy())
    expect((screen.getByRole("link", { name: "Attention Is All You Need" }) as HTMLAnchorElement).href).toBe(
        "https://arxiv.org/abs/1706.03762",
    )
    expect(fetch).toHaveBeenCalledTimes(1)
    const [, init] = vi.mocked(fetch).mock.calls[0]
    expect(JSON.parse(String(init?.body))).toEqual({
        pathname: "/learn/attention",
        messages: [{ role: "user", content: "How do queries work?" }],
        requestId: "message-2",
    })
    expect(init?.keepalive).toBe(true)
})

test("renders language-tagged code, LaTeX, and inline references", async () => {
    authState.isLoggedIn = true
    vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
            status: "answer",
            answer: [
                "The projection is $q = xW_q$.",
                "",
                "$$",
                "\\operatorname{score}(q, k) = \\frac{q k^T}{\\sqrt{d_k}}",
                "$$",
                "",
                "```python",
                "scores = q @ k.T",
                "```",
                "",
                "```ptx",
                "mov.u32 %r1, %tid.x;",
                "```",
                "",
                "See [Attention Is All You Need](https://arxiv.org/abs/1706.03762).",
            ].join("\n"),
            pageTitle: "Attention",
            sources: [],
        }),
    } as unknown as Response)
    render(<LeetyGate />)

    fireEvent.click(screen.getByRole("button", { name: "Ask Leety about this page" }))
    fireEvent.change(await screen.findByRole("textbox", { name: "Ask Leety" }), {
        target: { value: "Show the formula and code" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Send question" }))

    await waitFor(() => expect(document.querySelector('[data-leety-code-language="python"]')).not.toBeNull())
    const plainCode = await screen.findByRole("region", { name: "ptx code block" })
    expect(plainCode.tagName).toBe("DIV")
    expect(plainCode.tabIndex).toBe(0)
    expect(plainCode.querySelector("pre")?.textContent).toContain("mov.u32 %r1, %tid.x;")
    plainCode.focus()
    expect(document.activeElement).toBe(plainCode)
    expect(document.querySelector(".katex-display")).not.toBeNull()
    expect(screen.getByRole("link", { name: "Attention Is All You Need" }).getAttribute("href")).toBe(
        "https://arxiv.org/abs/1706.03762",
    )
})

test("opens glossary previews and details from Leety answers", async () => {
    authState.isLoggedIn = true
    vi.mocked(fetch).mockImplementation(async (url) => ({
        ok: true,
        json: async () => String(url).startsWith("/api/glossary/") ? getGlossaryEntry(String(url).split("/").pop()!) : {
            status: "answer",
            answer: "Use [GPU partitioning](/glossary#gpu-partitioning) to divide [GPU](/glossary#gpu) capacity.",
            pageTitle: "Attention",
            sources: [],
        },
    } as Response))
    render(<LeetyGate />)

    fireEvent.click(screen.getByRole("button", { name: "Ask Leety about this page" }))
    fireEvent.change(await screen.findByRole("textbox", { name: "Ask Leety" }), {
        target: { value: "How can multiple workloads share a GPU?" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Send question" }))

    const term = await screen.findByRole("button", { name: "Open definition for GPU partitioning" })
    fireEvent.mouseEnter(term)
    await waitFor(() => expect(screen.getByRole("tooltip").textContent).toContain("divides one physical"))
    expect(fetch).toHaveBeenCalledWith("/api/glossary/gpu-partitioning", { headers: { Accept: "application/json" } })

    fireEvent.click(screen.getByRole("button", { name: "Open definition for GPU" }))
    expect((await screen.findByRole("dialog", { name: "GPU" })).textContent).toContain(
        "Also known as graphics processing unit, graphics processor unit, graphics processor.",
    )
    await waitFor(() => expect(screen.getByRole("dialog", { name: "GPU" }).textContent).toContain("Definition"))
    expect(fetch).toHaveBeenCalledWith("/api/glossary/gpu", { headers: { Accept: "application/json" } })
})

test("resumes an interrupted Safari request without saving Load failed", async () => {
    authState.isLoggedIn = true
    vi.mocked(fetch)
        .mockRejectedValueOnce(new TypeError("Load failed"))
        .mockResolvedValueOnce({
            ok: true,
            json: vi.fn().mockResolvedValue({
                status: "answer",
                answer: "The saved answer is back.",
                pageTitle: "Attention",
                sources: [],
            }),
        } as unknown as Response)

    const firstView = render(<LeetyGate />)
    fireEvent.click(screen.getByRole("button", { name: "Ask Leety about this page" }))
    fireEvent.change(await screen.findByRole("textbox", { name: "Ask Leety" }), {
        target: { value: "Keep answering if I leave" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Send question" }))

    await waitFor(() => expect(screen.getByText("Connection paused. Your question is saved.")).toBeTruthy())
    expect(screen.queryByText("Load failed")).toBeNull()
    const firstRequest = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body)) as { requestId: string }
    firstView.unmount()

    render(<LeetyGate />)
    fireEvent.click(screen.getByRole("button", { name: "Ask Leety about this page" }))

    await waitFor(() => expect(screen.getByText("The saved answer is back.")).toBeTruthy())
    const resumedRequest = JSON.parse(String(vi.mocked(fetch).mock.calls[1][1]?.body)) as { requestId: string }
    expect(resumedRequest.requestId).toBe(firstRequest.requestId)
    expect(screen.queryByText("Load failed")).toBeNull()
})

test("automatically resumes a recent saved question after a page reload", async () => {
    authState.isLoggedIn = true
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" })
    localStorage.setItem("leetllm:leety:conversation:user-1:/learn/attention", JSON.stringify({
        messages: [{ id: "saved-question", role: "user", content: "Resume this question" }],
        pageTitle: "Attention",
        pending: {
            id: "saved-request",
            messages: [{ role: "user", content: "Resume this question" }],
            createdAt: Date.now(),
        },
    }))
    vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
            status: "answer",
            answer: "The saved answer resumed in the background.",
            pageTitle: "Attention",
            sources: [],
        }),
    } as unknown as Response)

    render(<LeetyGate />)

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))).toMatchObject({ requestId: "saved-request" })
    fireEvent.click(await screen.findByRole("button", { name: "Ask Leety about this page" }))
    expect(await screen.findByText("The saved answer resumed in the background.")).toBeTruthy()
})

test("repairs a previously saved Safari Load failed conversation", async () => {
    authState.isLoggedIn = true
    localStorage.setItem("leetllm:leety:conversation:user-1:/learn/attention", JSON.stringify({
        messages: [
            { id: "old-user", role: "user", content: "What did I miss?" },
            { id: "old-error", role: "assistant", content: "Load failed", refusal: true },
        ],
        pageTitle: "Attention",
    }))
    vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
            status: "answer",
            answer: "Recovered from the saved question.",
            pageTitle: "Attention",
            sources: [],
        }),
    } as unknown as Response)

    render(<LeetyGate />)
    fireEvent.click(screen.getByRole("button", { name: "Ask Leety about this page" }))

    await waitFor(() => expect(screen.getByText("Recovered from the saved question.")).toBeTruthy())
    expect(screen.getByText("What did I miss?")).toBeTruthy()
    expect(screen.queryByText("Load failed")).toBeNull()
})

test("restores page conversation until reader starts over", async () => {
    authState.isLoggedIn = true
    vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
            status: "answer",
            answer: "A tensor carries values and shape.",
            pageTitle: "Attention",
            sources: [],
        }),
    } as unknown as Response)
    const firstView = render(<LeetyGate />)

    fireEvent.click(screen.getByRole("button", { name: "Ask Leety about this page" }))
    fireEvent.change(await screen.findByRole("textbox", { name: "Ask Leety" }), {
        target: { value: "What is a tensor?" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Send question" }))
    await waitFor(() => expect(screen.getByText("A tensor carries values and shape.")).toBeTruthy())
    fireEvent.click(screen.getByRole("button", { name: "Close Leety" }))
    firstView.unmount()

    render(<LeetyGate />)
    fireEvent.click(screen.getByRole("button", { name: "Ask Leety about this page" }))
    await waitFor(() => expect(screen.getByText("What is a tensor?")).toBeTruthy())
    expect(screen.getByText("A tensor carries values and shape.")).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: "Start a new Leety conversation" }))
    expect(screen.queryByText("What is a tensor?")).toBeNull()
    expect(screen.getByText("Turn the hard part into your advantage")).toBeTruthy()
})

test("isolates saved conversation by account", async () => {
    authState.isLoggedIn = true
    vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
            status: "answer",
            answer: "A private answer.",
            pageTitle: "Attention",
            sources: [],
        }),
    } as unknown as Response)
    const firstView = render(<LeetyGate />)

    fireEvent.click(screen.getByRole("button", { name: "Ask Leety about this page" }))
    fireEvent.change(await screen.findByRole("textbox", { name: "Ask Leety" }), {
        target: { value: "Remember this" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Send question" }))
    await waitFor(() => expect(screen.getByText("A private answer.")).toBeTruthy())
    firstView.unmount()

    authState.userId = "user-2"
    render(<LeetyGate />)
    fireEvent.click(screen.getByRole("button", { name: "Ask Leety about this page" }))

    expect(screen.queryByText("Remember this")).toBeNull()
    expect(screen.queryByText("A private answer.")).toBeNull()
})
