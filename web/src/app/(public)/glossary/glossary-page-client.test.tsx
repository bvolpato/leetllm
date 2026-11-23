import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { beforeEach, describe, expect, test, vi } from "vitest"
import type { GlossaryEntryWithId, GlossarySummary } from "@/lib/glossary"
import { GlossaryPageClient } from "./glossary-page-client"

const { mockGetGlossarySummaries } = vi.hoisted(() => ({
    mockGetGlossarySummaries: vi.fn(),
}))

vi.mock("@/lib/glossary-client", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/lib/glossary-client")>()
    return { ...actual, getGlossarySummaries: mockGetGlossarySummaries }
})

const entries = [
    {
        id: "ab-testing",
        title: "A/B testing",
        importance: 20,
        definition: "A/B testing definition for a general glossary concept.",
        intuition: "A/B testing intuition explains the concept in a concrete way.",
        example: "A/B testing example shows a learner how it appears in practice.",
        decisionRule: "Use A/B testing when testing alphabetical ordering.",
        pitfall: "Do not confuse alphabetical ordering with importance ordering.",
        relevance: "A/B testing proves the default glossary sidebar starts in alphabetical order.",
        details: [{ title: "Breakdown", content: "Variant, metric, sample, and guardrail decide whether the experiment is useful." }],
        seeAlso: "- [RAG](glossary://rag)",
        related: [{ id: "rag", title: "RAG" }],
    },
    {
        id: "rag",
        title: "RAG",
        aliases: ["grounded generation"],
        importance: 98,
        definition: "Retrieval-augmented generation retrieves evidence before generation.",
        intuition: "RAG connects a question to evidence before a model writes an answer.",
        example: "A support assistant retrieves policy text before answering.",
        decisionRule: "Use RAG when answers depend on current or private evidence.",
        pitfall: "Do not judge RAG from one clean demo query.",
        relevance: "RAG is a core pattern for grounded LLM applications and retrieval systems.",
        seeAlso: "- [Transformer](glossary://transformer)",
        related: [{ id: "transformer", title: "Transformer" }],
    },
    {
        id: "transformer",
        title: "Transformer",
        importance: 100,
        definition: "A transformer is a neural network architecture built around attention.",
        intuition: "Transformers update token representations by mixing context with attention.",
        example: "Modern language models use transformer layers to build contextual representations.",
        decisionRule: "Use Transformer when reasoning about attention and token context.",
        pitfall: "Do not treat architecture alone as a quality guarantee.",
        relevance: "Transformers are central to modern LLM training, inference, and context behavior.",
        seeAlso: "- [RAG](glossary://rag)",
        related: [{ id: "rag", title: "RAG" }],
    },
] satisfies GlossaryEntryWithId[]
const summaries: GlossarySummary[] = entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    importance: entry.importance,
    aliases: "aliases" in entry ? entry.aliases : undefined,
}))

const scrollIntoView = vi.fn()
const scrollTo = vi.fn()

beforeEach(() => {
    mockGetGlossarySummaries.mockReturnValue(summaries)
    vi.stubGlobal("fetch", vi.fn(async (input: string) => {
        const url = new URL(input, "https://leetllm.com")
        if (url.searchParams.has("q")) {
            const query = url.searchParams.get("q")!.toLowerCase()
            return { ok: true, json: async () => entries.filter((entry) => JSON.stringify(entry).toLowerCase().includes(query)).map((entry) => entry.id) }
        }
        return { ok: true, json: async () => entries.find((entry) => entry.id === url.pathname.split("/").pop()) }
    }))
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280 })
    window.history.replaceState(null, "", "/glossary")
    scrollIntoView.mockReset()
    scrollTo.mockReset()
    Object.defineProperty(Element.prototype, "scrollIntoView", {
        configurable: true,
        value: scrollIntoView,
    })
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
        configurable: true,
        value: scrollTo,
    })
})

function renderGlossary(path = "/glossary") {
    window.history.replaceState(null, "", path)

    return render(
        <GlossaryPageClient
            initialEntry={entries[0]}
        />,
    )
}

describe("GlossaryPageClient", () => {
    test("keeps compact summaries in parity with the canonical server index", async () => {
        const { getGlossarySummaries } = await vi.importActual<typeof import("@/lib/glossary-client")>("@/lib/glossary-client")
        const { GLOSSARY_SUMMARIES } = await import("@/lib/glossary-server")
        const actualSummaries = getGlossarySummaries()

        expect(actualSummaries).toEqual(GLOSSARY_SUMMARIES)
    })

    test("renders the initial definition without fetching and ignores an earlier selection that loads late", async () => {
        const first: GlossaryEntryWithId = { id: "acl", title: "ACL", importance: 80, definition: "First definition.", example: "First example.", relevance: "First relevance." }
        const second: GlossaryEntryWithId = { id: "action-allowlist", title: "Action allowlist", importance: 80, definition: "Latest selected definition.", example: "Second example.", relevance: "Second relevance." }
        mockGetGlossarySummaries.mockReturnValue([
            summaries[0],
            { id: first.id, title: first.title, importance: first.importance },
            { id: second.id, title: second.title, importance: second.importance },
        ])
        const resolvers = new Map<string, (response: Response) => void>()
        vi.mocked(fetch).mockImplementation((url) => new Promise((resolve) => {
            resolvers.set(String(url), resolve)
        }))
        render(<GlossaryPageClient
            initialEntry={entries[0]}
        />)
        expect(screen.getByText(entries[0].definition)).toBeTruthy()
        expect(fetch).not.toHaveBeenCalled()
        const nav = screen.getByRole("navigation", { name: "Glossary terms" })
        fireEvent.click(within(nav).getByRole("link", { name: /^ACL/ }))
        await waitFor(() => expect(resolvers.has("/api/glossary/acl")).toBe(true))
        fireEvent.click(within(nav).getByRole("link", { name: /^Action allowlist/ }))
        await waitFor(() => expect(resolvers.has("/api/glossary/action-allowlist")).toBe(true))
        await act(async () => resolvers.get("/api/glossary/action-allowlist")!({ ok: true, json: async () => second } as Response))
        expect(screen.getByText(second.definition)).toBeTruthy()
        await act(async () => resolvers.get("/api/glossary/acl")!({ ok: true, json: async () => first } as Response))
        expect(screen.getByText(second.definition)).toBeTruthy()
        expect(screen.queryByText(first.definition)).toBeNull()
    })

    test("defaults to alphabetical terms and switches to relevance sorting", () => {
        renderGlossary()

        const termNav = screen.getByRole("navigation", { name: "Glossary terms" })
        expect(within(termNav).getAllByRole("link")[0].textContent).toContain("A/B testing")
        expect(within(termNav).getAllByRole("link")[0].textContent).toContain("Optional")
        expect(screen.getByRole("heading", { name: "A/B testing" })).toBeTruthy()
        expect(screen.getByRole("button", { name: "Copy as markdown" })).toBeTruthy()
        expect(screen.getByText("Breakdown")).toBeTruthy()
        expect(screen.getByText("Related terms")).toBeTruthy()
        expect(screen.queryByText(/\/100/)).toBeNull()
        expect(screen.getByRole("button", { name: "A-Z" }).getAttribute("aria-pressed")).toBe("true")
        expect(screen.getByRole("button", { name: "Relevance" }).getAttribute("aria-pressed")).toBe("false")

        fireEvent.click(screen.getByRole("button", { name: "Relevance" }))

        expect(within(termNav).getAllByRole("link")[0].textContent).toContain("Transformer")
        expect(within(termNav).getByText("Essential")).toBeTruthy()
        expect(within(termNav).getAllByRole("link")[0].textContent).not.toContain("Essential")
        expect(screen.getByRole("button", { name: "A-Z" }).getAttribute("aria-pressed")).toBe("false")
        expect(screen.getByRole("button", { name: "Relevance" }).getAttribute("aria-pressed")).toBe("true")
    })

    test("filters by full definition search and follows related glossary terms", async () => {
        renderGlossary()

        fireEvent.change(screen.getByLabelText("Search terms"), {
            target: { value: "retrieval" },
        })

        const termNav = screen.getByRole("navigation", { name: "Glossary terms" })
        await waitFor(() => expect(screen.getByRole("heading", { name: "RAG" })).toBeTruthy())
        expect(within(termNav).getByRole("link", { name: /RAG/ })).toBeTruthy()
        expect(within(termNav).queryByRole("link", { name: /A\/B testing/ })).toBeNull()
        expect(screen.getByRole("heading", { name: "RAG" })).toBeTruthy()
        expect(screen.getByText("Also known as grounded generation.")).toBeTruthy()
        expect(screen.getAllByRole("status")[0].textContent).toBe("Showing 1 of 3 terms.")

        window.history.pushState(null, "", "/glossary#rag")
        fireEvent.popState(window)
        expect((screen.getByLabelText("Search terms") as HTMLInputElement).value).toBe("retrieval")

        fireEvent.change(screen.getByLabelText("Search terms"), {
            target: { value: "grounded generation" },
        })
        expect(within(termNav).getByRole("link", { name: /RAG/ })).toBeTruthy()
        expect(within(termNav).queryByRole("link", { name: /Transformer/ })).toBeNull()

        fireEvent.change(screen.getByLabelText("Search terms"), {
            target: { value: "no matching glossary term" },
        })
        await screen.findByRole("heading", { name: "No matching terms" })

        fireEvent.change(screen.getByLabelText("Search terms"), {
            target: { value: "" },
        })
        fireEvent.click(within(termNav).getByRole("link", { name: /RAG/ }))

        expect(screen.getByRole("heading", { name: "RAG" })).toBeTruthy()
        expect(window.location.hash).toBe("#rag")
    })

    test.each([
        ["popstate", "rag", "retrieval", "RAG"],
        ["hashchange", "rag", "retrieval", "RAG"],
        ["popstate", "transformer", "", "Transformer"],
    ])("retains pending definition search through %s and checks linked %s after results arrive", async (event, linkedId, expectedQuery, title) => {
        const defaultFetch = vi.mocked(fetch).getMockImplementation()!
        let respond!: (ids: string[]) => void
        vi.mocked(fetch).mockImplementation((url, options) => String(url).startsWith("/api/glossary?q=")
            ? Promise.resolve({ ok: true, json: () => new Promise<string[]>((resolve) => { respond = resolve }) } as Response)
            : defaultFetch(url, options))
        renderGlossary()
        const search = screen.getByLabelText("Search terms") as HTMLInputElement
        fireEvent.change(search, { target: { value: "retrieval" } })
        await waitFor(() => expect(respond).toBeDefined())

        window.history.pushState(null, "", `/glossary#${linkedId}`)
        if (event === "popstate") fireEvent.popState(window)
        else fireEvent(window, new HashChangeEvent("hashchange"))
        expect(search.value).toBe("retrieval")

        await act(async () => respond(["rag"]))
        await waitFor(() => expect(screen.getByRole("heading", { name: title })).toBeTruthy())
        expect(search.value).toBe(expectedQuery)
    })

    test("moves mobile selection focus to the term and returns to the existing search", async () => {
        Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 })
        renderGlossary()
        const search = screen.getByLabelText("Search terms") as HTMLInputElement
        fireEvent.change(search, { target: { value: "grounded generation" } })
        const termNav = screen.getByRole("navigation", { name: "Glossary terms" })
        const term = within(termNav).getByRole("link", { name: /RAG/ })
        term.focus()
        fireEvent.click(term)

        await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("heading", { name: "RAG" })))
        expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" })
        scrollIntoView.mockReset()
        fireEvent.click(screen.getByRole("button", { name: "Back to terms" }))

        expect(document.activeElement).toBe(search)
        expect(search.value).toBe("grounded generation")
        expect(window.location.hash).toBe("#rag")
        expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" })
        expect(scrollIntoView.mock.instances[0]).toBe(termNav.closest("aside"))
    })

    test("focuses the new heading after related-term navigation and clears the filter", async () => {
        renderGlossary()
        fireEvent.change(screen.getByLabelText("Search terms"), { target: { value: "retrieval" } })
        await waitFor(() => expect(screen.getByRole("heading", { name: "RAG" })).toBeTruthy())
        await waitFor(() => expect(screen.getByText("Related terms")).toBeTruthy())
        const relatedSection = screen.getByText("Related terms").closest("section") as HTMLElement
        const related = within(relatedSection).getByRole("link", { name: "Transformer" })
        related.focus()
        fireEvent.click(related)

        await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Transformer" })))
        expect((screen.getByLabelText("Search terms") as HTMLInputElement).value).toBe("")
        expect(window.location.hash).toBe("#transformer")
    })

    test("keeps desktop list focus and page position when selecting a term", async () => {
        renderGlossary()
        const termNav = screen.getByRole("navigation", { name: "Glossary terms" })
        const term = within(termNav).getByRole("link", { name: /RAG/ })
        termNav.scrollTop = 25
        term.focus()
        fireEvent.click(term)

        await waitFor(() => expect(screen.getByRole("heading", { name: "RAG" })).toBeTruthy())
        expect(document.activeElement).toBe(term)
        expect(termNav.scrollTop).toBe(25)
        expect(scrollIntoView).not.toHaveBeenCalled()
    })

    test("leaves modified term clicks to native link handling", () => {
        renderGlossary()
        const termNav = screen.getByRole("navigation", { name: "Glossary terms" })
        const term = within(termNav).getByRole("link", { name: /RAG/ })
        const nativeHandler = vi.fn((event: MouseEvent) => {
            expect(event.defaultPrevented).toBe(false)
            // Prevent jsdom's unsupported document navigation after checking the client.
            event.preventDefault()
        })
        document.addEventListener("click", nativeHandler, { once: true })
        fireEvent.click(term, { ctrlKey: true })

        expect(nativeHandler).toHaveBeenCalledOnce()
        expect(window.location.hash).toBe("")
        expect(screen.getByRole("heading", { name: "A/B testing" })).toBeTruthy()
    })

    test("selects terms from deep links and browser navigation", async () => {
        renderGlossary("/glossary#rag")

        await waitFor(() => expect(screen.getByRole("heading", { name: "RAG" })).toBeTruthy())

        const termNav = screen.getByRole("navigation", { name: "Glossary terms" })
        expect(within(termNav).getByRole("link", { name: /RAG/ }).getAttribute("aria-current")).toBe("true")

        const relatedSection = screen.getByText("Related terms").closest("section")
        expect(relatedSection).toBeTruthy()
        fireEvent.click(within(relatedSection as HTMLElement).getByRole("link", { name: "Transformer" }))

        expect(window.location.hash).toBe("#transformer")
        expect(screen.getByRole("heading", { name: "Transformer" })).toBeTruthy()

        window.history.pushState(null, "", "/glossary#rag")
        fireEvent.popState(window)

        await waitFor(() => expect(screen.getByRole("heading", { name: "RAG" })).toBeTruthy())
        expect(within(termNav).getByRole("link", { name: /RAG/ }).getAttribute("aria-current")).toBe("true")

        window.history.pushState(null, "", "/glossary")
        fireEvent.popState(window)

        await waitFor(() => expect(screen.getByRole("heading", { name: "A/B testing" })).toBeTruthy())
        expect(within(termNav).getByRole("link", { name: /A\/B testing/ }).getAttribute("aria-current")).toBe("true")
    })

    test("scrolls the sidebar to the selected term", async () => {
        const clientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight")
        const offsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight")
        const getBoundingClientRect = HTMLElement.prototype.getBoundingClientRect

        Object.defineProperty(HTMLElement.prototype, "clientHeight", {
            configurable: true,
            get() {
                return this.getAttribute("aria-label") === "Glossary terms" ? 80 : 0
            },
        })
        Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
            configurable: true,
            get() {
                return this.textContent?.includes("Transformer") ? 20 : 0
            },
        })
        HTMLElement.prototype.getBoundingClientRect = function () {
            if (this.getAttribute("aria-label") === "Glossary terms") {
                return { top: 0, bottom: 80, left: 0, right: 320, width: 320, height: 80, x: 0, y: 0, toJSON: () => ({}) }
            }

            if (this.textContent?.includes("Transformer")) {
                return { top: 120, bottom: 140, left: 0, right: 320, width: 320, height: 20, x: 0, y: 120, toJSON: () => ({}) }
            }

            return getBoundingClientRect.call(this)
        }

        try {
            renderGlossary("/glossary#transformer")

            await waitFor(() => expect(screen.getByRole("heading", { name: "Transformer" })).toBeTruthy())

            await waitFor(() => {
                expect(scrollTo).toHaveBeenCalledWith({
                    top: 68,
                    behavior: "auto",
                })
            })
        } finally {
            if (clientHeight) Object.defineProperty(HTMLElement.prototype, "clientHeight", clientHeight)
            else delete (HTMLElement.prototype as { clientHeight?: number }).clientHeight

            if (offsetHeight) Object.defineProperty(HTMLElement.prototype, "offsetHeight", offsetHeight)
            else delete (HTMLElement.prototype as { offsetHeight?: number }).offsetHeight

            HTMLElement.prototype.getBoundingClientRect = getBoundingClientRect
        }
    })
})
