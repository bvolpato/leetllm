import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import * as glossary from "@/lib/glossary-server"
import { MarkdownRenderer, resolveCodeFenceLanguage, slugifyHeading, uniqueHeadingId } from "./markdown-renderer"
import { installControlledIntersectionObserver } from "./intersection-observer-test-utils"

beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => ({
        ok: true,
        json: async () => glossary.getGlossaryEntry(url.split("/").pop()!),
    })))
})

afterEach(() => vi.unstubAllGlobals())

describe("lesson table of contents", () => {
    test("links to the rendered h2/h3 IDs, including duplicate and explicit headings", async () => {
        const { container } = render(<MarkdownRenderer showTableOfContents content={'# Title\n\n## Repeat\n\n### **Nested** `code`\n\n## Repeat\n\n<h2 id="custom:section">Explicit section</h2>\n\n#### Small heading'} />)
        const summary = await screen.findByText("On this page", { selector: "summary" })
        const disclosure = summary.closest("details")!
        expect(disclosure.open).toBe(false)
        fireEvent.click(summary)
        expect(disclosure.open).toBe(true)
        const outline = screen.getByRole("navigation", { name: "On this page" })
        const links = within(outline).getAllByRole("link")
        expect(links.map((link) => link.textContent)).toEqual(["Repeat", "Nested code", "Repeat", "Explicit section"])
        expect(links.map((link) => link.getAttribute("href"))).toEqual(["#repeat", "#nested-code", "#repeat-1", "#custom%3Asection"])
        for (const link of links) {
            const id = decodeURIComponent(link.getAttribute("href")!.slice(1))
            const heading = Array.from(container.querySelectorAll("h2, h3")).find((node) => node.id === id)
            expect(heading?.textContent).toBe(link.textContent)
        }
    })

    test("updates displayed headings on content changes and removes an empty outline", async () => {
        const { rerender } = render(<MarkdownRenderer showTableOfContents content="## Original section" />)
        await screen.findByText("On this page", { selector: "summary" })
        const disclosure = screen.getByText("On this page", { selector: "summary" }).closest("details")!
        fireEvent.click(disclosure.querySelector("summary")!)
        expect(within(screen.getByRole("navigation")).getByRole("link").getAttribute("href")).toBe("#original-section")
        rerender(<MarkdownRenderer showTableOfContents personalizationSlug="attention" content={"## Personalized section\n\n### New example"} />)
        await waitFor(() => expect(within(screen.getByRole("navigation")).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(["#personalized-section", "#new-example"]))
        expect(within(screen.getByRole("navigation")).queryByText("Original section")).toBeNull()
        rerender(<MarkdownRenderer showTableOfContents content="Only a paragraph." />)
        await waitFor(() => expect(screen.queryByText("On this page", { selector: "summary" })).toBeNull())
    })

    test("excludes collapsed details and checkpoint answers, tracks details visibility", async () => {
        const { container } = render(<MarkdownRenderer showTableOfContents content={'## Main section\n\n<details><summary>Extra explanation</summary><h3>Folded section</h3></details>\n\n```checkpoint\nQuestion?\n---\n<h2 id="answer-heading">Nested answer</h2>\n```'} />)
        const summary = await screen.findByText("On this page", { selector: "summary" })
        summary.closest("details")!.open = true
        const outline = screen.getByRole("navigation", { name: "On this page" })
        expect(within(outline).getAllByRole("link").map((link) => link.textContent)).toEqual(["Main section"])
        fireEvent.click(screen.getByRole("button", { name: "Question?" }))
        await waitFor(() => expect(container.querySelector("[data-lesson-toc-exclude] [data-state='open']")).toBeTruthy())
        expect(within(outline).queryByText("Nested answer")).toBeNull()
        const extra = screen.getByText("Extra explanation").closest("details")!
        fireEvent.click(extra.querySelector("summary")!)
        await waitFor(() => expect(within(outline).getAllByRole("link").map((link) => link.textContent)).toEqual(["Main section", "Folded section"]))
        fireEvent.click(extra.querySelector("summary")!)
        await waitFor(() => expect(within(outline).queryByText("Folded section")).toBeNull())
    })

    test("is optional and scopes the outline to its own body", async () => {
        render(<><MarkdownRenderer content="## Other lesson" /><MarkdownRenderer showTableOfContents content="## This lesson" /></>)
        const summary = await screen.findByText("On this page", { selector: "summary" })
        summary.closest("details")!.open = true
        expect(within(screen.getByRole("navigation")).getAllByRole("link").map((link) => link.textContent)).toEqual(["This lesson"])
    })
})

test("code and table scroll regions have keyboard focus and accessible names", async () => {
    render(<MarkdownRenderer content={'```python title="train.py"\nprint("hello")\n```\n\n```\nplain\nblock\n```\n\n| Name | Value |\n| --- | --- |\n| A | 1 |'} />)
    for (const name of ["train.py code block", "Code block", "Lesson table"]) {
        const region = await screen.findByRole("region", { name })
        expect(region.tabIndex).toBe(0)
        region.focus()
        expect(document.activeElement).toBe(region)
    }
})

vi.mock("./personalized-mermaid-diagram", () => ({
    PersonalizedMermaidDiagram: ({ chart }: { chart: string }) => (
        <div data-testid="personalized-mermaid">{chart}</div>
    ),
}))

vi.mock("./personalized-vizmatic-diagram", () => ({
    PersonalizedVizmaticDiagram: ({ source }: { source: string }) => (
        <div data-testid="personalized-vizmatic">{source}</div>
    ),
}))

function withMatchMedia(matches: boolean) {
    const original = window.matchMedia
    const mediaQueryList = {
        matches,
        media: "(pointer: coarse)",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList

    Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: vi.fn().mockReturnValue(mediaQueryList),
    })

    return () => {
        Object.defineProperty(window, "matchMedia", {
            configurable: true,
            value: original,
        })
    }
}

describe("resolveCodeFenceLanguage", () => {
    test("highlights jsonl fences as json while preserving label", () => {
        expect(resolveCodeFenceLanguage("jsonl")).toEqual({
            label: "jsonl",
            highlighterLanguage: "json",
        })
        expect(resolveCodeFenceLanguage(".jsonl")).toEqual({
            label: "jsonl",
            highlighterLanguage: "json",
        })
    })

    test("highlights ndjson fences as json while preserving label", () => {
        expect(resolveCodeFenceLanguage("ndjson")).toEqual({
            label: "ndjson",
            highlighterLanguage: "json",
        })
        expect(resolveCodeFenceLanguage(".ndjson")).toEqual({
            label: "ndjson",
            highlighterLanguage: "json",
        })
    })

    test("preserves highlighting for course code fence aliases", () => {
        for (const [label, canonical] of [
            ["py", "python"],
            ["ts", "typescript"],
            ["js", "javascript"],
            ["sh", "bash"],
            ["shell", "bash"],
            ["dockerfile", "docker"],
            ["gitignore", "ignore"],
            ["html", "markup"],
            ["jsonc", "json"],
        ]) {
            expect(resolveCodeFenceLanguage(label)).toEqual({ label, highlighterLanguage: canonical })
        }
    })

    test("leaves regular languages unchanged", () => {
        expect(resolveCodeFenceLanguage("python")).toEqual({
            label: "python",
            highlighterLanguage: "python",
        })
    })
})

test("keeps unsupported code fences readable without attempting Prism parsing", async () => {
    const source = "mov.u32 %r1, %tid.x;"
    const { container } = render(<MarkdownRenderer content={`\`\`\`ptx\n${source}\n\`\`\``} />)
    await act(async () => {
        await Promise.resolve()
    })

    const region = screen.getByRole("region", { name: "ptx code block" })
    expect(region.tagName).toBe("DIV")
    expect(region.querySelector("pre")?.textContent).toContain(source)
    expect(region.querySelector(".token")).toBeNull()
    expect(region.querySelector(".linenumber")).toBeNull()
    expect(container.querySelector("[data-print-code] .font-semibold")?.textContent).toBe("ptx")
})

test("uses readable comment colors in screen themes and print", async () => {
    const intersection = installControlledIntersectionObserver()
    const { container } = render(<MarkdownRenderer content={"```python\n# Keep this note legible\nprint('ok')\n```"} />)
    await act(async () => {
        intersection.enterAll()
        await import("./content-syntax-highlighter")
    })
    await waitFor(() => expect(container.querySelector(".token")).toBeTruthy())

    const comment = Array.from(container.querySelectorAll("[data-print-code] code span"))
        .find((span) => span.textContent === "# Keep this note legible")
    expect(comment?.getAttribute("style")).toContain("rgb(75, 85, 99)")
    expect(comment?.getAttribute("style")).toContain("rgb(203, 213, 225)")
})

test("routes Mermaid and Vizmatic fences to personalized visual renderers", async () => {
    render(
        <MarkdownRenderer content={'```mermaid\nflowchart LR\nA --> B\n```\n\n```vizmatic\n{"width":800}\n```'} />,
    )
    await act(async () => {
        await Promise.resolve()
    })

    expect(screen.getByTestId("personalized-mermaid").textContent).toContain("flowchart LR")
    expect(screen.getByTestId("personalized-vizmatic").textContent).toContain('"width":800')
    expect(screen.queryByText("mermaid")).toBeNull()
    expect(screen.queryByText("vizmatic")).toBeNull()
})

test("renders one themed picture instead of duplicate dark and light images", async () => {
    const { container } = render(
        <MarkdownRenderer
            content={'<figure><img src="/diagram_dark.png" alt="Architecture" data-themed-image="true" data-dark-src="/diagram_dark.png" data-light-src="/diagram_light.png" width="1200" height="600" /></figure>'}
        />,
    )
    await act(async () => {
        await Promise.resolve()
    })

    const picture = container.querySelector("picture[data-themed-picture='true']")
    const images = picture?.querySelectorAll("img")

    expect(picture).toBeTruthy()
    expect(images).toHaveLength(1)
    expect(images?.[0].getAttribute("src")).toBe("/diagram_dark.png")
    expect(picture?.querySelector("source")?.getAttribute("srcset")).toBe("/diagram_dark.png")
})

test("opens Markdown images at full resolution without adding block elements inside paragraphs", async () => {
    const { container } = render(<MarkdownRenderer content="![Attention map](/attention.png)" />)
    await act(async () => {
        await Promise.resolve()
    })

    const paragraph = container.querySelector("p")
    expect(paragraph?.querySelector("div")).toBeNull()
    const trigger = screen.getByRole("button", { name: "View larger: Attention map" })
    expect(paragraph?.contains(trigger)).toBe(true)

    fireEvent.click(trigger)
    const dialog = await screen.findByRole("dialog")
    const expandedImage = within(dialog).getByAltText("Attention map") as HTMLImageElement
    expect(expandedImage.getAttribute("src")).toBe("/attention.png")
    expect(expandedImage.hasAttribute("srcset")).toBe(false)
})

test("uses responsive variants for themed generated illustrations without dropping intrinsic size", async () => {
    const { container } = render(
        <MarkdownRenderer
            content={'<figure><img src="/cdn/content-image/learn/attention/illustrations/_generated/attention_dark.png?v=1" alt="Attention" data-themed-image="true" data-dark-src="/cdn/content-image/learn/attention/illustrations/_generated/attention_dark.png?v=1" data-light-src="/cdn/content-image/learn/attention/illustrations/_generated/attention_light.png?v=1" data-natural-width="2240" data-dark-natural-width="2240" data-light-natural-width="2240" width="1120" height="630" /></figure>'}
        />,
    )
    await act(async () => {
        await Promise.resolve()
    })

    const picture = container.querySelector("picture[data-themed-picture='true']")
    const image = picture?.querySelector("img")
    const source = picture?.querySelector("source")
    expect(image?.getAttribute("src")).toContain("attention_dark.png?v=1")
    expect(image?.getAttribute("srcset")).toContain("attention_dark.png?w=320&v=1&cv=2 320w")
    expect(source?.getAttribute("srcset")).toBe(image?.getAttribute("srcset"))
    expect(source?.getAttribute("sizes")).toBe("(max-width: 768px) 100vw, 768px")
    expect(image?.getAttribute("width")).toBe("1120")
    expect(image?.getAttribute("height")).toBe("630")

    fireEvent.click(screen.getByRole("button", { name: "View larger: Attention" }))
    const dialog = await screen.findByRole("dialog")
    const expandedImage = within(dialog).getByAltText("Attention") as HTMLImageElement
    expect(expandedImage.getAttribute("src")).toContain("attention_dark.png?v=1")
    expect(expandedImage.hasAttribute("srcset")).toBe(false)
    expect(expandedImage.style.width).toBe("1120px")
})

test("renders dotted jsonl fences as labeled highlighted blocks", async () => {
    const { container } = render(
        <MarkdownRenderer content={'```.jsonl\n{"event":"checkout"}\n```'} />,
    )
    await act(async () => {
        await Promise.resolve()
    })

    expect(screen.getByText("jsonl")).toBeTruthy()
    expect(container.textContent).toContain("checkout")
})

test("renders highlighted code without text shadow in JetBrains Mono", async () => {
    const intersection = installControlledIntersectionObserver()
    const { container } = render(
        <MarkdownRenderer content={'```yaml\nversion: 1\n```'} />,
    )
    const region = screen.getByRole("region", { name: "yaml code block" })
    expect(region.querySelector("pre")?.textContent).toContain("version: 1")
    await act(async () => {
        intersection.enterAll()
        await import("./content-syntax-highlighter")
    })
    await waitFor(() => expect(region.querySelector(".token")).toBeTruthy())

    expect(container.querySelector("[data-print-code] [role='region']")).toBe(region)
    expect(region.style.textShadow).toBe("none")
    expect(region.style.fontFamily).toContain("--font-jetbrains-mono")
    expect(region.className).toContain("md:text-[0.95rem]")
})

test("renders checkpoint fences as Q/A accordions", async () => {
    const { container } = render(
        <MarkdownRenderer content={"```checkpoint\nWhat equals cosine for unit vectors?\n---\nDot product.\n```"} />,
    )
    await act(async () => {
        await Promise.resolve()
    })

    fireEvent.click(screen.getByRole("button", { name: /What equals cosine/ }))

    expect(screen.getAllByText("What equals cosine for unit vectors?")).toHaveLength(2)
    expect(screen.getAllByText("Answer")).toHaveLength(2)
    expect(container.textContent).toContain("Dot product.")
    expect(container.querySelector("[data-print-only]")?.textContent).toContain("Dot product.")
    expect(container.textContent).not.toContain("checkpoint")
    expect(container.querySelector("pre button")).toBeNull()
    expect(screen.queryByRole("button", { name: "Copy code" })).toBeNull()
    expect(screen.getByRole("button", { name: "What equals cosine for unit vectors?" }).closest("h1, h2, h3, h4, h5, h6")).toBeNull()
})

test("renders folded output with parsed fenced text", async () => {
    const { container } = render(
        <MarkdownRenderer
            content={"<details>\n<summary>Output</summary>\n\n```text output compact bare\nloss: 0.12\n```\n\n</details>"}
        />,
    )
    await act(async () => {
        await Promise.resolve()
    })

    expect(container.querySelector("details")).toBeTruthy()
    expect(screen.getByText("Output")).toBeTruthy()
    expect(container.querySelector("[data-code-output='true']")).toBeTruthy()
    expect(container.textContent).toContain("loss: 0.12")
    expect(container.textContent).not.toContain("```")
})

test("renders code fence titles from metadata", async () => {
    const { container } = render(
        <MarkdownRenderer content={"```python title=\"train.py\"\nprint('ok')\n```"} />,
    )
    await act(async () => {
        await Promise.resolve()
    })

    expect(screen.getByText("train.py")).toBeTruthy()
    expect(container.querySelector("[data-print-code]")).toBeTruthy()
    expect(container.textContent).not.toContain("python")
})

test("preserves spaces in shell command fences", async () => {
    const command = "uv run --with pytest -m pytest tests/test_scorer.py -q --tb=line"
    const { container } = render(
        <MarkdownRenderer content={`\`\`\`bash title="terminal"\n${command}\n\`\`\``} />,
    )
    await act(async () => {
        await Promise.resolve()
    })

    expect(container.textContent).toContain(command)
})

test("shows diagram alt blocks and caps image height", async () => {
    render(
        <MarkdownRenderer
            content={`<figure data-diagram-alt="Diagram showing tensor alignment across batch, token, and feature axes."><img src="/diagram.png" alt="Diagram showing tensor alignment across batch, token, and feature axes." width="1200" height="900" /></figure>`}
        />,
    )
    await act(async () => {
        await Promise.resolve()
    })

    expect(screen.queryByText("Alt")).toBeNull()
    expect(screen.getByText("tensor alignment across batch, token, and feature axes.")).toBeTruthy()
    const image = screen.getByAltText("Diagram showing tensor alignment across batch, token, and feature axes.") as HTMLImageElement
    expect(image.style.maxHeight).toBe("800px")
})

test("marks content asset links as downloads", async () => {
    render(
        <MarkdownRenderer
            content={"[Download corpus](/api/content-asset/training/build-gpt-from-scratch-lab/assets/shakespeare.txt)"}
        />,
    )
    await act(async () => {
        await Promise.resolve()
    })

    const link = screen.getByRole("link", { name: "Download corpus" })
    expect(link.getAttribute("href")).toBe("/api/content-asset/training/build-gpt-from-scratch-lab/assets/shakespeare.txt")
    expect(link.getAttribute("download")).toBe("")
})

test("renders inline reference citations as external links with hover metadata", async () => {
    render(
        <MarkdownRenderer
            content={'A claim<sup><a href="https://arxiv.org/abs/1706.03762" target="_blank" rel="noopener noreferrer" aria-label="Open reference 1: Attention Is All You Need" data-reference-link="true" data-reference-number="1" data-reference-title="Attention Is All You Need" data-reference-url="https://arxiv.org/abs/1706.03762">[1]</a></sup>.'}
        />,
    )
    await act(async () => {
        await Promise.resolve()
    })

    const link = screen.getByRole("link", { name: "Open reference 1: Attention Is All You Need" })
    expect(link.getAttribute("href")).toBe("https://arxiv.org/abs/1706.03762")
    expect(link.getAttribute("target")).toBe("_blank")
    expect(link.getAttribute("rel")).toBe("noopener noreferrer")
    expect(screen.getByText("Reference 1")).toBeTruthy()
    expect(screen.getByText("Attention Is All You Need")).toBeTruthy()
    expect(screen.getByText("https://arxiv.org/abs/1706.03762")).toBeTruthy()
})

test("renders shared callout primitives from raw markdown HTML", async () => {
    const { container } = render(
        <MarkdownRenderer
            content={`<div data-callout="warning" data-callout-title="Platform path"><p>Mac users should follow the MPS lesson.</p></div>`}
        />,
    )
    await act(async () => {
        await Promise.resolve()
    })

    expect(screen.getByText("Platform path")).toBeTruthy()
    expect(screen.getByText("Mac users should follow the MPS lesson.")).toBeTruthy()
    expect(container.querySelector("[data-callout-variant='warning']")).toBeTruthy()
})

test("auto-styles semantic callout blockquotes and suppresses auto-generated mermaid captions", async () => {
    const { container } = render(
        <MarkdownRenderer
            content={[
                "> **Key insight:** Scaling by $\\sqrt{d_k}$ keeps softmax gradients healthy.",
                "",
                "> **Common mistake:** Forgetting the causal mask leaks future tokens.",
                "",
                `<figure data-diagram-alt="Diagram showing Input and Output." data-diagram-auto="true"><img src="/diagram.png" alt="Diagram showing Input and Output." width="800" height="400" /></figure>`,
            ].join("\n")}
        />,
    )
    await act(async () => {
        await Promise.resolve()
    })

    expect(container.querySelector("[data-callout-variant='insight']")).toBeTruthy()
    expect(container.querySelector("[data-callout-variant='warning']")).toBeTruthy()
    expect(screen.getByText("Key insight")).toBeTruthy()
    expect(screen.getByText("Common mistake")).toBeTruthy()
    expect(container.querySelector("figcaption")).toBeNull()
})

test("collapses long code blocks with an expand toggle and strips window chrome from short snippets", async () => {
    const longCode = Array.from({ length: 50 }, (_, index) => `x_${index} = ${index}`).join("\n")
    const { container } = render(
        <MarkdownRenderer
            content={[
                "```python\nprint('short')\n```",
                "",
                `\`\`\`python title="long_example.py"\n${longCode}\n\`\`\``,
            ].join("\n")}
        />,
    )
    await act(async () => {
        await Promise.resolve()
    })

    expect(container.querySelector("[data-compact-code='true']")).toBeTruthy()
    const expandButton = screen.getByRole("button", { name: "Show all 50 lines" })
    expect(expandButton).toBeTruthy()
    fireEvent.click(expandButton)
    expect(screen.getByRole("button", { name: "Collapse code" })).toBeTruthy()
})

test("renders glossary spans as clickable definitions", async () => {
    const { container } = render(
        <MarkdownRenderer
            content={'A <span data-glossary="cosine-similarity">cosine similarity</span> score keeps embedding retrieval ordered.'}
        />,
    )
    await act(async () => {
        await Promise.resolve()
    })

    const trigger = screen.getByRole("button", { name: "Open definition for Cosine similarity" })
    expect(trigger).toBeTruthy()
    expect(screen.getByText("cosine similarity")).toBeTruthy()
    const glossaryTerm = container.querySelector("[data-glossary-term='cosine-similarity']")
    expect(glossaryTerm).toBeTruthy()
    expect(glossaryTerm?.querySelectorAll("[role='button']")).toHaveLength(1)

    fireEvent.mouseEnter(trigger)
    const tooltip = await waitFor(() => screen.getByRole("tooltip"))
    await waitFor(() => expect(tooltip.textContent).toMatch(/cosine of the angle between them/i))
    expect(tooltip.textContent?.match(/Cosine similarity/gi)).toHaveLength(1)
    expect(within(tooltip).queryByText("Glossary")).toBeNull()
    expect(screen.getByText("Click for deeper explanation, examples, code, and where it appears.")).toBeTruthy()

    fireEvent.click(trigger)

    const dialog = screen.getByRole("dialog", { name: "Cosine similarity" })
    expect(dialog).toBeTruthy()
    expect(within(dialog).queryByText("Glossary")).toBeNull()
    expect(screen.getByText("Definition")).toBeTruthy()
    expect(screen.getByText(/cosine of the angle between them/i)).toBeTruthy()
    expect(screen.getByText("Formula")).toBeTruthy()
    expect(screen.getByText("Example")).toBeTruthy()
    expect(screen.getByText("Related terms")).toBeTruthy()
    // Flexible glossary structure: optional teaching sections (not forced Decision rule / Common mistake)
    expect(within(dialog).queryByText("Decision rule")).toBeNull()
    expect(within(dialog).queryByText("Common mistake")).toBeNull()
    expect(within(dialog).getByText("Essential")).toBeTruthy()
    expect(dialog.textContent).not.toContain("/100")
    expect(dialog.textContent).toMatch(/For real vectors|For vectors/)
    expect(dialog.textContent).toMatch(/normalized|L2-normalized|inner product/i)

    fireEvent.click(within(dialog).getByRole("button", { name: "Open related glossary term Dense retrieval" }))

    expect(screen.getByRole("dialog", { name: "Dense retrieval" })).toBeTruthy()
    expect(within(screen.getByRole("dialog", { name: "Dense retrieval" })).getByText("Essential")).toBeTruthy()
})

test("opens glossary definitions from the underlined term on coarse pointers", async () => {
    const restoreMatchMedia = withMatchMedia(true)
    try {
        render(
            <MarkdownRenderer
                content={'A <span data-glossary="cosine-similarity">cosine similarity</span> score keeps embedding retrieval ordered.'}
            />,
        )
        await act(async () => {
            await Promise.resolve()
        })

        fireEvent.click(screen.getByRole("button", { name: "Open definition for Cosine similarity" }))
        expect(screen.getByRole("dialog", { name: "Cosine similarity" })).toBeTruthy()
    } finally {
        restoreMatchMedia()
    }
})

test("renders glossary usage excerpts as markdown links and math", async () => {
    const getEntry = glossary.getGlossaryEntry
    const entrySpy = vi.spyOn(glossary, "getGlossaryEntry").mockImplementation((id) =>
        id === "matrix"
            ? {
                id: "matrix",
                title: "Matrix",
                importance: 80,
                definition: "A rectangular array of values.",
                example: "A table of learned weights.",
                relevance: "Represents a linear transformation.",
                usage: [{
                    title: "Example lesson",
                    url: "/learn/example",
                    excerpt: "[LoRA](/learn/lora-parameter-efficient-fine-tuning) adapts $W_0$.",
                }],
            }
            : getEntry(id),
    )

    try {
        render(
            <MarkdownRenderer
                content={'A <span data-glossary="matrix">matrix</span> stores learned weights.'}
            />,
        )
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Open definition for Matrix" }))
        })

        const dialog = screen.getByRole("dialog", { name: "Matrix" })
        const titleLink = within(dialog).getByRole("link", { name: "Example lesson" })
        const loraLink = within(dialog).getByRole("link", { name: "LoRA" })
        const renderedMath = Array.from(dialog.querySelectorAll(".katex-html"))
            .map((node) => node.textContent)
            .join(" ")

        expect(titleLink.getAttribute("href")).toBe("/learn/example")
        expect(loraLink.getAttribute("href")).toBe("/learn/lora-parameter-efficient-fine-tuning")
        expect(renderedMath).toContain("W")
        expect(renderedMath).toContain("0")
        expect(dialog.textContent).not.toContain("$W_0$")
    } finally {
        entrySpy.mockRestore()
    }
})

test("copies fenced code blocks to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText },
    })

    render(<MarkdownRenderer content={"```python\nprint('hello')\n```"} />)
    await act(async () => {
        await Promise.resolve()
    })

    fireEvent.click(screen.getByRole("button", { name: "Copy code" }))
    await act(async () => {
        await Promise.resolve()
    })

    expect(writeText).toHaveBeenCalledWith("print('hello')")
    expect(screen.getByRole("button", { name: "Code copied" })).toBeTruthy()
})

test("renders inline and display math with KaTeX", async () => {
    const { container } = render(
        <MarkdownRenderer
            content={"Condition number $\\kappa(A)$\n\n$$\n\\begin{pmatrix}1 & 0 \\\\ 0 & 1\\end{pmatrix}\n$$\n\n<figure><figcaption>Scale by $\\sqrt{d_k}$. Keep <code>$raw$</code> literal.</figcaption></figure>"}
        />,
    )
    await act(async () => {
        await Promise.resolve()
    })

    const renderedMath = Array.from(container.querySelectorAll(".katex-html"))
        .map((node) => node.textContent)
        .join(" ")

    expect(container.querySelector(".katex-display")).toBeTruthy()
    expect(renderedMath).toContain("κ")
    expect(renderedMath).not.toContain("\\kappa")
    expect(renderedMath).not.toContain("\\begin")
    expect(container.querySelectorAll("figcaption .katex")).toHaveLength(1)
    expect(container.querySelector("figcaption code")?.textContent).toBe("$raw$")
})

test("renders currency without literal escape markers", async () => {
    const { container } = render(
        <MarkdownRenderer
            content={"A prose price is \\$18.\n\n> Callout price is \\$18.\n\nInline code keeps `$18`.\n\n<figure><figcaption>Caption total is \\$18, compared with \\$24.</figcaption></figure>"}
        />,
    )
    await act(async () => {
        await Promise.resolve()
    })

    expect(container.textContent).toContain("A prose price is $18.")
    expect(container.textContent).toContain("Callout price is $18.")
    expect(container.textContent).toContain("Inline code keeps $18.")
    expect(container.textContent).toContain("Caption total is $18, compared with $24.")
    expect(container.querySelector("figcaption .katex")).toBeNull()
    expect(container.textContent).not.toContain("\\$18")
})

describe("heading anchors", () => {
    test("slugifies punctuation, apostrophes, and empty titles", () => {
        expect(slugifyHeading("Three ways to measure closeness")).toBe("three-ways-to-measure-closeness")
        expect(slugifyHeading("What's next?")).toBe("whats-next")
        expect(slugifyHeading("  Café — résumé  ")).toBe("cafe-resume")
        expect(slugifyHeading("!!!")).toBe("section")
    })

    test("suffixes duplicate heading ids", () => {
        const seen = new Map<string, number>()
        expect(uniqueHeadingId("Cosine similarity", seen)).toBe("cosine-similarity")
        expect(uniqueHeadingId("Cosine similarity", seen)).toBe("cosine-similarity-1")
        expect(uniqueHeadingId("Custom", seen, "dot-product")).toBe("dot-product")
        expect(uniqueHeadingId("Custom", seen, "dot-product")).toBe("dot-product-1")
    })

    test("turns markdown headings into same-page hash links", async () => {
        const { container } = render(
            <MarkdownRenderer
                content={"## Three ways to measure closeness\n\nIntro.\n\n### Cosine similarity\n\nBody.\n\n## Three ways to measure closeness\n\nAgain."}
            />,
        )
        await act(async () => {
            await Promise.resolve()
        })

        const headings = [...container.querySelectorAll("h2, h3")]
        expect(headings.map((heading) => heading.id)).toEqual([
            "three-ways-to-measure-closeness",
            "cosine-similarity",
            "three-ways-to-measure-closeness-1",
        ])

        const sectionLinks = screen.getAllByRole("link", { name: "Three ways to measure closeness" })
        expect(sectionLinks[0].getAttribute("href")).toBe("#three-ways-to-measure-closeness")
        expect(sectionLinks[0].getAttribute("data-heading-anchor")).toBe("")
        expect(sectionLinks[1].getAttribute("href")).toBe("#three-ways-to-measure-closeness-1")
        expect(screen.getByRole("link", { name: "Cosine similarity" }).getAttribute("href")).toBe("#cosine-similarity")
        expect(container.querySelectorAll("h2 a[data-heading-anchor]")).toHaveLength(2)
    })

    test("keeps heading ids stable after the theme mount pass", async () => {
        const { container, rerender } = render(
            <MarkdownRenderer content={"## Dot product\n\nBody.\n\n## Dot product\n\nAgain."} />,
        )
        await act(async () => {
            await Promise.resolve()
        })

        rerender(<MarkdownRenderer content={"## Dot product\n\nBody.\n\n## Dot product\n\nAgain."} />)
        await act(async () => {
            await Promise.resolve()
        })

        expect([...container.querySelectorAll("h2")].map((heading) => heading.id)).toEqual([
            "dot-product",
            "dot-product-1",
        ])
    })

    test("restores the hashed heading after render", async () => {
        const scrollIntoView = vi.fn()
        const original = HTMLElement.prototype.scrollIntoView
        HTMLElement.prototype.scrollIntoView = scrollIntoView
        window.location.hash = "#dot-product"

        try {
            render(<MarkdownRenderer content={"## Cosine similarity\n\nHi.\n\n## Dot product\n\nThere."} />)
            await act(async () => {
                await Promise.resolve()
            })

            expect(document.getElementById("dot-product")).toBeTruthy()
            expect(scrollIntoView).toHaveBeenCalled()
        } finally {
            HTMLElement.prototype.scrollIntoView = original
            window.location.hash = ""
        }
    })

    test("renders GitHub-style expandable fold edges for # fold markers and focus ranges", async () => {
        const snippet = [
            '```python title="attention.py"',
            "# fold:start imports & fixtures",
            "import math",
            "q = [1.0, 2.0]",
            "# fold:end",
            "def score(a, b):",
            "    return sum(x * y for x, y in zip(a, b)) / math.sqrt(len(a))",
            "# fold:start example run",
            "print(score(q, q))",
            "# fold:end",
            "```",
        ].join("\n")

        const { container } = render(<MarkdownRenderer content={snippet} />)
        await act(async () => {
            await Promise.resolve()
        })

        expect(container.querySelector('[data-code-folded="true"]')).toBeTruthy()
        expect(screen.getByRole("button", { name: /Expand 2 hidden lines: imports & fixtures/i })).toBeTruthy()
        expect(screen.getByRole("button", { name: /Expand 1 hidden line: example run/i })).toBeTruthy()
        expect(container.textContent).not.toContain("# fold:start")

        fireEvent.click(screen.getByRole("button", { name: /Expand 2 hidden lines: imports & fixtures/i }))
        expect(screen.queryByRole("button", { name: /Expand 2 hidden lines: imports & fixtures/i })).toBeNull()
        expect(screen.getByRole("button", { name: /Expand 1 hidden line: example run/i })).toBeTruthy()

        fireEvent.click(screen.getByRole("button", { name: /Full code \(5L\)/i }))
        expect(screen.getByRole("button", { name: /Fold setup/i })).toBeTruthy()
        expect(container.querySelector('[data-code-folded="true"]')).toBeNull()
    })

    test("folds surrounding context when focus fence metadata is specified", async () => {
        const snippet = [
            '```python title="loss.py" focus="4-5"',
            "import torch",
            "logits = torch.tensor([2.0, 1.0])",
            "target = torch.tensor(0)",
            "log_probs = logits - torch.logsumexp(logits, dim=-1)",
            "loss = -log_probs[target]",
            "assert loss.item() > 0",
            "print(round(loss.item(), 4))",
            "```",
        ].join("\n")

        const { container } = render(<MarkdownRenderer content={snippet} />)
        await act(async () => {
            await Promise.resolve()
        })

        expect(container.querySelector('[data-code-fold-toggle="top"]')).toBeTruthy()
        expect(container.querySelector('[data-code-fold-toggle="bottom"]')).toBeTruthy()
        expect(container.textContent).toContain("log_probs = logits - torch.logsumexp")
    })
})
