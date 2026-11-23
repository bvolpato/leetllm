import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, describe, expect, test, vi } from "vitest"
import {
    GlossaryMarkdown,
    glossaryDiagramImageSrc,
    resolveGlossaryImageSrcForTest,
} from "./glossary-markdown"
import { installControlledIntersectionObserver } from "./intersection-observer-test-utils"

vi.mock("next-themes", () => ({
    useTheme: () => ({ resolvedTheme: "dark" }),
}))

vi.mock("@/lib/glossary-client", () => {
    const getEntry = (id: string) => {
        if (id === "logits") {
            return { title: "Logits", importance: 90, definition: "raw scores", example: "e", relevance: "r" }
        }
        if (id === "softmax") {
            return { title: "Softmax", importance: 95, definition: "normalized", example: "e", relevance: "r" }
        }
        if (id === "matrix") {
            return {
                title: "Matrix",
                importance: 88,
                definition: "A matrix stores rows and columns with shape $m \\times n$.\n\nSecond paragraph stays out of hover previews.",
                example: "e",
                relevance: "r",
            }
        }
        return undefined
    }
    return {
        getGlossarySummary: getEntry,
        useGlossaryEntry: (id: string) => ({ entry: getEntry(id) }),
    }
})

afterEach(() => vi.unstubAllGlobals())

describe("GlossaryMarkdown media rendering", () => {
    test("renders KaTeX math for inline and display formulas", () => {
        const { container } = render(
            <GlossaryMarkdown content={"Inline $a+b$ and display:\n\n$$\n\\mathrm{softmax}(z_i)=\\frac{e^{z_i}}{\\sum_j e^{z_j}}\n$$"} />,
        )

        // rehype-katex injects .katex nodes for math
        expect(container.querySelectorAll(".katex").length).toBeGreaterThan(0)
        expect(container.querySelectorAll(".katex-display")).toHaveLength(1)
        expect(container.textContent).toMatch(/softmax|e\^|z/)
    })

    test("renders fenced code plainly first, then highlights the block when it nears view", async () => {
        const intersection = installControlledIntersectionObserver()
        const { container } = render(
            <GlossaryMarkdown
                content={[
                    "Worked numeric softmax:",
                    "",
                    "```python",
                    "import math",
                    "logits = [2.0, 1.0, 0.1]",
                    "m = max(logits)",
                    "exps = [math.exp(z - m) for z in logits]",
                    "probs = [e / sum(exps) for e in exps]",
                    "print(probs)",
                    "```",
                ].join("\n")}
            />,
        )

        // Glossary starts in a deterministic server theme, then applies the resolved client theme.
        await act(async () => await Promise.resolve())
        await waitFor(() => expect(intersection.observers.length).toBeGreaterThan(0))

        const frame = container.querySelector("[data-glossary-code-block='python']")
        expect(frame).toBeTruthy()
        const region = screen.getByRole("region", { name: "python code block" })
        expect(region.querySelector("pre")?.textContent).toContain("import math")
        expect(intersection.observers.length).toBeGreaterThan(0)
        expect(intersection.observers.at(-1)?.rootMargin).toBe("200px")
        expect(frame?.textContent).toContain("import math")
        expect(frame?.textContent).toContain("probs")
        expect(frame?.querySelector(".rounded-full") || frame?.textContent?.includes("python")).toBeTruthy()

        const observer = intersection.observers.at(-1)!
        await act(async () => observer.enter())
        expect(observer.disconnect).toHaveBeenCalled()
        await waitFor(() => expect(frame?.querySelector(".token")).toBeTruthy(), { timeout: 5000 })
        expect(region.querySelector("pre")).toBeNull()
    })

    test("renders interactive related-term control for glossary:// links", () => {
        const onGlossaryLink = vi.fn()
        render(
            <GlossaryMarkdown
                content={"See [Logits](glossary://logits) before [Softmax](glossary://softmax)."}
                onGlossaryLink={onGlossaryLink}
            />,
        )

        const logits = screen.getByRole("button", { name: /Open related glossary term Logits/i })
        const softmax = screen.getByRole("button", { name: /Open related glossary term Softmax/i })
        expect(logits).toBeTruthy()
        expect(softmax).toBeTruthy()
        logits.click()
        expect(onGlossaryLink).toHaveBeenCalledWith("logits")
    })

    test("shows a hover preview for glossary:// links", async () => {
        const onNavigateTerm = vi.fn((event) => event.preventDefault())
        render(
            <GlossaryMarkdown
                content={"See [Matrix](glossary://matrix) before multiplying."}
                onNavigateTerm={onNavigateTerm}
            />,
        )

        const matrix = document.querySelector("[data-glossary-related-link='matrix']") as HTMLAnchorElement | null
        expect(matrix).toBeTruthy()
        fireEvent.mouseEnter(matrix!)

        const tooltip = await screen.findByRole("tooltip")
        expect(within(tooltip).queryByText("Glossary")).toBeNull()
        expect(within(tooltip).getByText("Matrix")).toBeTruthy()
        expect(tooltip.textContent).toContain("A matrix stores rows and columns")
        expect(tooltip.textContent).not.toContain("Second paragraph")
        expect(tooltip.querySelector(".katex")).toBeTruthy()

        fireEvent.mouseLeave(matrix!)
        await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull())
    })

    test("renders an image element for illustration references", () => {
        const { container } = render(
            <GlossaryMarkdown
                entryId="softmax"
                content={"![Softmax competition](illustrations/_generated/softmax_curve_dark.png)"}
            />,
        )

        const img = container.querySelector("img[data-glossary-image='softmax']") as HTMLImageElement | null
        expect(img).toBeTruthy()
        expect(img?.getAttribute("src")).toBe(
            "/cdn/content-image/glossary/softmax/illustrations/_generated/softmax_curve_dark.png",
        )
        expect(img?.getAttribute("srcset")).toBeNull()
        expect(img?.getAttribute("sizes")).toBeNull()
        expect(img?.getAttribute("alt")).toBe("Softmax competition")
    })

    test("uses natural theme dimensions for responsive glossary illustration variants", () => {
        const { container } = render(
            <GlossaryMarkdown
                entryId="softmax"
                content={'<img src="/cdn/content-image/glossary/softmax/illustrations/_generated/curve_dark.png?v=1" alt="Softmax curve" data-themed-image="true" data-dark-src="/cdn/content-image/glossary/softmax/illustrations/_generated/curve_dark.png?v=1" data-light-src="/cdn/content-image/glossary/softmax/illustrations/_generated/curve_light.png?v=1" data-natural-width="1800" data-dark-natural-width="1800" data-light-natural-width="640" width="900" height="450" />'}
            />,
        )

        const picture = container.querySelector("picture[data-themed-picture='true']")
        const image = picture?.querySelector("img")
        const source = picture?.querySelector("source")

        expect(image?.getAttribute("srcset")).toBe(
            "/cdn/content-image/glossary/softmax/illustrations/_generated/curve_dark.png?w=320&v=1&cv=2 320w, /cdn/content-image/glossary/softmax/illustrations/_generated/curve_dark.png?w=640&v=1&cv=2 640w, /cdn/content-image/glossary/softmax/illustrations/_generated/curve_dark.png?w=960&v=1&cv=2 960w, /cdn/content-image/glossary/softmax/illustrations/_generated/curve_dark.png?w=1280&v=1&cv=2 1280w, /cdn/content-image/glossary/softmax/illustrations/_generated/curve_dark.png?w=1600&v=1&cv=2 1600w, /cdn/content-image/glossary/softmax/illustrations/_generated/curve_dark.png?v=1 1800w",
        )
        expect(source?.getAttribute("srcset")).toBe(image?.getAttribute("srcset"))
        expect(image?.getAttribute("sizes")).toBe("(max-width: 768px) calc(100vw - 64px), 768px")
    })

    test("keeps unsupported glossary code as plain text", () => {
        const source = "mov.u32 %r1, %tid.x;"
        const { container } = render(
            <GlossaryMarkdown content={`\`\`\`ptx\n${source}\n\`\`\``} />,
        )

        const frame = container.querySelector("[data-glossary-code-block='ptx']")
        const region = screen.getByRole("region", { name: "ptx code block" })
        expect(region.tagName).toBe("DIV")
        expect(region.tabIndex).toBe(0)
        expect(region.querySelector("pre")?.textContent).toContain(source)
        region.focus()
        expect(document.activeElement).toBe(region)
        expect(frame?.querySelector(".token")).toBeNull()
    })

    test("resolveGlossaryImageSrcForTest keeps absolute and CDN paths", () => {
        expect(resolveGlossaryImageSrcForTest("/cdn/content-image/glossary/kv-cache/illustrations/_generated/a.png")).toBe(
            "/cdn/content-image/glossary/kv-cache/illustrations/_generated/a.png",
        )
        expect(resolveGlossaryImageSrcForTest("https://example.com/a.png")).toBe("https://example.com/a.png")
        expect(resolveGlossaryImageSrcForTest("illustrations/_generated/a.png", "kv-cache")).toBe(
            "/cdn/content-image/glossary/kv-cache/illustrations/_generated/a.png",
        )
    })

    test("renders mermaid fences as diagram images, not a syntax-highlighted mermaid code frame", () => {
        const content = [
            "Softmax flow:",
            "",
            "```mermaid",
            "flowchart LR",
            "  A[Logits] --> B[Softmax]",
            "```",
            "",
            "Second flow:",
            "",
            "```mermaid",
            "flowchart LR",
            "  B[Softmax] --> C[Probabilities]",
            "```",
        ].join("\n")
        const { container, rerender } = render(
            <GlossaryMarkdown
                entryId="softmax"
                content={content}
            />,
        )

        // Must not use the generic code highlighter chrome for mermaid.
        expect(container.querySelector("[data-glossary-code-block='mermaid']")).toBeNull()

        const figures = container.querySelectorAll("figure[data-glossary-diagram='softmax']")
        expect(figures).toHaveLength(2)
        expect(figures[0].getAttribute("data-glossary-diagram-index")).toBe("0")
        expect(figures[1].getAttribute("data-glossary-diagram-index")).toBe("1")

        const imgs = container.querySelectorAll("img[data-glossary-image='softmax']")
        expect(imgs.length).toBe(2)
        const srcs = Array.from(imgs).map((img) => img.getAttribute("src") ?? "")
        expect(srcs).toContain(glossaryDiagramImageSrc("softmax", 0, "dark"))
        expect(srcs).toContain(glossaryDiagramImageSrc("softmax", 1, "dark"))
        expect(imgs[0].getAttribute("data-light-src")).toBe(glossaryDiagramImageSrc("softmax", 0, "light"))
        expect(figures[0].querySelectorAll("picture")).toHaveLength(1)
        expect(figures[0].querySelector("source")?.getAttribute("srcset")).toBe(glossaryDiagramImageSrc("softmax", 0, "dark"))
        expect(figures[0].querySelector("img")?.getAttribute("srcset")).toBeNull()

        rerender(<GlossaryMarkdown entryId="softmax" content={content} />)
        const rerenderedSrcs = Array.from(container.querySelectorAll("img[data-glossary-image='softmax']"))
            .map((img) => img.getAttribute("src") ?? "")
        expect(rerenderedSrcs).toContain(glossaryDiagramImageSrc("softmax", 0, "dark"))
        expect(rerenderedSrcs).toContain(glossaryDiagramImageSrc("softmax", 1, "dark"))
        expect(rerenderedSrcs).not.toContain(glossaryDiagramImageSrc("softmax", 2, "dark"))
    })

    test("keeps glossary links while filtering unsafe URL protocols", async () => {
        const { container } = render(
            <GlossaryMarkdown content={"[Term](glossary://logits) [Unsafe](javascript:alert(1))"} />,
        )

        await waitFor(() => expect(container.querySelector("[data-glossary-related-link='logits']")).toBeTruthy())

        expect(container.querySelector("[data-glossary-related-link='logits']")?.getAttribute("href")).toBe(
            "/glossary#logits",
        )
        expect(screen.getByText("Unsafe").closest("a")?.getAttribute("href")).toBe("")
    })

    test("renders resolved figure/img illustration HTML from the content pipeline", () => {
        const { container } = render(
            <GlossaryMarkdown
                entryId="kv-cache"
                content={`<figure data-diagram-alt="KV flow">
<img src="/cdn/content-image/glossary/kv-cache/diagrams/_generated/kv-cache_diagram_0_dark.png" alt="KV flow" data-themed-image="true" data-dark-src="/cdn/content-image/glossary/kv-cache/diagrams/_generated/kv-cache_diagram_0_dark.png" data-light-src="/cdn/content-image/glossary/kv-cache/diagrams/_generated/kv-cache_diagram_0_light.png" />
</figure>`}
            />,
        )

        const figure = container.querySelector("figure[data-glossary-figure='kv-cache']")
        expect(figure).toBeTruthy()
        const imgs = container.querySelectorAll("img[data-glossary-image='kv-cache']")
        expect(imgs).toHaveLength(1)
        expect(Array.from(imgs).some((img) => img.getAttribute("src")?.includes("kv-cache_diagram_0_dark.png"))).toBe(
            true,
        )
    })

    test("keeps unusually wide glossary diagrams readable inside a horizontal scroller", () => {
        const { container } = render(
            <GlossaryMarkdown
                entryId="monte-carlo-tree-search"
                content={`<figure data-diagram-alt="Search stages">
<img src="/cdn/content-image/glossary/monte-carlo-tree-search/diagrams/_generated/monte-carlo-tree-search_diagram_0_dark.png" alt="Search stages" width="1552" height="173" />
</figure>`}
            />,
        )

        const figure = container.querySelector("figure[data-glossary-figure='monte-carlo-tree-search']")
        const diagram = container.querySelector("img[data-glossary-wide-diagram='true']")

        expect(figure?.className).toContain("overflow-x-auto")
        expect(diagram?.className).toContain("min-w-[48rem]")
        expect(diagram?.className).toContain("max-w-none")
    })
})
