import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { renderToStaticMarkup, renderToString } from "react-dom/server"
import { hydrateRoot, type Root } from "react-dom/client"
import { describe, expect, test, vi } from "vitest"
import { ServerMarkdownRenderer } from "./server-markdown-renderer"

vi.mock("./animated-illustration", () => ({
    AnimatedIllustration: () => <div>Animation frame</div>,
}))

describe("server article markdown", () => {
    test("renders headings, GFM, raw HTML, and math before client effects run", () => {
        const html = renderToStaticMarkup(
            <ServerMarkdownRenderer
                contentKey="static-article"
                content={'## Repeat\n\n### **Nested** `code`\n\n## Repeat\n\n<h2 id="custom:section">Explicit section</h2>\n\n| Name | Value |\n| --- | --- |\n| Score | $x^2$ |\n\n<details><summary>Extra explanation</summary><p>Raw body.</p></details>'}
            />
        )
        const body = document.createElement("div")
        body.innerHTML = html

        expect(Array.from(body.querySelectorAll("h2, h3")).map((heading) => heading.id))
            .toEqual(["repeat", "nested-code", "repeat-1", "custom:section"])
        expect(body.querySelector("h2[id='custom:section'] a")?.getAttribute("href")).toBe("#custom%3Asection")
        expect(body.querySelector("table td .katex-html")?.textContent).toContain("x")
        expect(body.querySelector("details summary")?.textContent).toBe("Extra explanation")
        expect(body.querySelector("details p")?.textContent).toBe("Raw body.")
        expect(body.textContent).not.toContain("$x^2$")
    })

    test("preserves responsive themed images, captions, and external citations in server HTML", () => {
        const html = renderToStaticMarkup(
            <ServerMarkdownRenderer
                contentKey="images-and-references"
                content={'<figure><img src="/cdn/content-image/blog/article/illustrations/_generated/example_dark.png?v=1" alt="Example diagram" data-themed-image="true" data-dark-src="/cdn/content-image/blog/article/illustrations/_generated/example_dark.png?v=1" data-light-src="/cdn/content-image/blog/article/illustrations/_generated/example_light.png?v=1" data-dark-natural-width="2240" width="1120" height="630" /><figcaption>Author caption.</figcaption></figure>\n\nA claim<sup><a href="https://example.com/paper" data-reference-link="true" data-reference-number="1" data-reference-title="A primary source" data-reference-url="https://example.com/paper">[1]</a></sup>.'}
            />,
        )
        const body = document.createElement("div")
        body.innerHTML = html
        const image = body.querySelector("picture img")!
        const source = body.querySelector("picture source")!

        expect(body.querySelectorAll("picture img")).toHaveLength(1)
        expect(image.getAttribute("width")).toBe("1120")
        expect(image.getAttribute("height")).toBe("630")
        expect(image.getAttribute("srcset")).toContain("example_dark.png?w=320&v=1&cv=2 320w")
        expect(source.getAttribute("srcset")).toBe(image.getAttribute("srcset"))
        expect(body.querySelector("figcaption")?.textContent).toBe("Author caption.")
        expect(body.querySelector("a[data-reference-link]")?.getAttribute("aria-label"))
            .toBe("Open reference 1: A primary source")
        expect(body.querySelector("a[data-reference-link]")?.getAttribute("rel")).toBe("noopener noreferrer")
    })

    test("renders math in HTML figure captions while preserving markup and literal code", () => {
        const html = renderToStaticMarkup(
            <ServerMarkdownRenderer
                contentKey="caption-math"
                content={'<figure><figcaption>Scale by $\\sqrt{d_k}$, then <strong>compare</strong> $QK^T$. Keep <code>$raw$</code> literal.</figcaption></figure>'}
            />,
        )
        const body = document.createElement("div")
        body.innerHTML = html
        const caption = body.querySelector("figcaption")!

        expect(caption.querySelectorAll(".katex")).toHaveLength(2)
        expect(caption.querySelector("strong")?.textContent).toBe("compare")
        expect(caption.querySelector("code")?.textContent).toBe("$raw$")
        expect(caption.textContent).toContain("compare ")
        expect(caption.textContent).not.toContain("$\\sqrt")
        expect(caption.querySelector("p")).toBeNull()
    })

    test("passes parsed checkpoint nodes to the accordion and its printable answer", async () => {
        const checkpoint = (
            <ServerMarkdownRenderer
                contentKey="checkpoint"
                content={'```checkpoint\nWhat is **squared** $x$?\n---\nIt is $x^2$. Read the [proof](/blog/proof).\n```'}
            />
        )
        const staticBody = document.createElement("div")
        staticBody.innerHTML = renderToStaticMarkup(checkpoint)
        expect(staticBody.querySelector("[data-print-question] .katex-html")?.textContent).toContain("x")
        expect(staticBody.querySelector("[data-print-question] a")?.getAttribute("href")).toBe("/blog/proof")

        const { container } = render(checkpoint)
        const trigger = screen.getByRole("button")
        const printable = container.querySelector("[data-print-question]")!

        expect(trigger.querySelector("strong")?.textContent).toBe("squared")
        expect(trigger.querySelector(".katex-html")?.textContent).toContain("x")
        expect(printable.querySelector(".katex-html")?.textContent).toContain("x")
        expect(printable.querySelector("a")?.getAttribute("href")).toBe("/blog/proof")
        fireEvent.click(trigger)
        await waitFor(() => expect(container.querySelector("[data-lesson-toc-exclude] [data-state='open']")).toBeTruthy())
        expect(screen.getAllByRole("link", { name: "proof" })).toHaveLength(2)
        expect(container.textContent).not.toContain("$x^2$")
    })

    test("copies the complete server-provided code source and retains fence metadata", async () => {
        const writeText = vi.fn().mockResolvedValue(undefined)
        Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } })
        const code = "uv run --with pytest -m pytest tests/test_scorer.py -q --tb=line\n# Preserve the entire command"
        const { container } = render(
            <ServerMarkdownRenderer contentKey="code" content={`\`\`\`bash title="terminal"\n${code}\n\`\`\`\n\n\`\`\`text output compact bare\npassed\n\`\`\``} />,
        )
        const region = screen.getByRole("region", { name: "terminal code block" })

        expect(region.textContent).toContain(code)
        expect(region.tabIndex).toBe(0)
        expect(container.querySelector("[data-code-output='true']")?.textContent).toContain("passed")
        fireEvent.click(screen.getByRole("button", { name: "Copy code" }))
        await act(async () => { await Promise.resolve() })
        expect(writeText).toHaveBeenCalledWith(code)
        expect(screen.getByRole("button", { name: "Code copied" })).toBeTruthy()
    })

    test("keeps the optional outline scoped to server headings and excludes checkpoint answers", async () => {
        render(
            <ServerMarkdownRenderer
                contentKey="outline"
                showTableOfContents
                content={'## Main section\n\n## Main section\n\n```checkpoint\nQuestion?\n---\n<h2 id="answer-heading">Nested answer</h2>\n```'}
            />,
        )
        const summary = await screen.findByText("On this page", { selector: "summary" })
        fireEvent.click(summary)
        const outline = screen.getByRole("navigation", { name: "On this page" })
        expect(within(outline).getAllByRole("link").map((link) => link.getAttribute("href")))
            .toEqual(["#main-section", "#main-section-1"])
        fireEvent.click(screen.getByRole("button", { name: "Question?" }))
        expect(within(outline).queryByText("Nested answer")).toBeNull()
    })

    test("renders native outline links in server HTML with matching IDs and accessible labels", () => {
        const html = renderToStaticMarkup(
            <ServerMarkdownRenderer
                contentKey="initial-outline"
                showTableOfContents
                content={'## Repeat\n\n<details><summary>Folded</summary><h2>Repeat</h2></details>\n\n## Repeat\n\n<h2 id="custom:section">Explicit <span aria-hidden="true">decoration</span>section</h2>\n\n<div data-print-only><h2>Print heading</h2></div>\n\n<div hidden><h2>Hidden heading</h2></div>\n\n<div aria-hidden="true"><h2>Hidden from readers</h2></div>\n\n<div data-lesson-toc-exclude><h2>Excluded heading</h2></div>\n\n<details open><summary>Expanded</summary><h3>Visible extra</h3></details>\n\n<div data-animated-illustration="{}"><h2>Repeat</h2></div>\n\n## Repeat\n\n### A formula $x^2$\n\n```checkpoint\nQuestion?\n---\n<h2>Answer heading</h2>\n```'}
            />,
        )
        const root = document.createElement("div")
        root.innerHTML = html
        const outline = root.querySelector("nav[aria-label='On this page']")!
        const links = Array.from(outline.querySelectorAll("a"))
        const body = root.querySelector(".question-content")!

        expect(outline.closest("details")?.open).toBe(false)
        expect(links.map((link) => link.getAttribute("href"))).toEqual([
            "#repeat", "#repeat-2", "#custom%3Asection", "#visible-extra", "#repeat-3", "#a-formula-x2x-2x2",
        ])
        for (const link of links) {
            const heading = Array.from(body.querySelectorAll("h2, h3"))
                .find((node) => node.id === decodeURIComponent(link.getAttribute("href")!.slice(1)))!
            const label = heading.cloneNode(true) as HTMLElement
            label.querySelectorAll("[aria-hidden='true']").forEach((node) => node.remove())
            expect(link.textContent).toBe(label.textContent?.trim())
        }
        expect(outline.textContent).not.toMatch(/Folded|Print heading|Hidden heading|Hidden from readers|Excluded heading|Answer heading|decoration/)
        expect(body.textContent).toContain("Animation frame")
        expect(Array.from(body.querySelectorAll("h2")).filter((heading) => heading.textContent === "Repeat"))
            .toHaveLength(4)
    })

    test("replaces a film's static image on the web while keeping its caption", () => {
        const html = renderToStaticMarkup(<ServerMarkdownRenderer contentKey="film-image"
            content={'<figure><img src="/backup_dark.png" alt="Value backup" data-animated-illustration="{}" /><figcaption>The value moves one step back.</figcaption></figure>'} />)
        expect(html).toContain("Animation frame")
        expect(html).toContain("The value moves one step back.")
    })

    test("hydrates linked headings without replacing article nodes or nesting permalinks", async () => {
        const element = (
            <ServerMarkdownRenderer
                contentKey="linked-heading-hydration"
                showTableOfContents
                content={'## Plain heading\n\n## [Linked heading](/learn/attention)\n\n### A **[formatted link](/blog/report)**\n\n<h2 id="named:section"><em>Named <a>anchor</a></em></h2>\n\n### Cited model<sup><a href="https://example.com/paper" data-reference-link="true" data-reference-number="2" data-reference-title="Primary paper" data-reference-url="https://example.com/paper">[2]</a></sup>\n\n<h2 id="visible-name">Visible <span aria-hidden="true">decoration</span>title</h2>\n\n### A formula $x^2$\n\nBody.'}
            />
        )
        const container = document.createElement("div")
        container.innerHTML = renderToString(element)
        document.body.append(container)
        const body = container.querySelector(".question-content")!
        const headings = Array.from(body.querySelectorAll<HTMLElement>("h2, h3"))
        const ids = headings.map((heading) => heading.id)
        const authoredLinks = () => Array.from(body.querySelectorAll<HTMLAnchorElement>("h2 a:not([data-heading-anchor]), h3 a:not([data-heading-anchor])"))
            .map((link) => ({ href: link.getAttribute("href"), text: link.textContent }))
        const linksBefore = authoredLinks()
        const outline = container.querySelector("nav[aria-label='On this page']")!
        const outlineLabels = () => Array.from(outline.querySelectorAll("a")).map((link) => link.textContent)
        const labelsBefore = outlineLabels()
        const recoverableError = vi.fn()
        let root: Root | undefined

        try {
            await act(async () => { root = hydrateRoot(container, element, { onRecoverableError: recoverableError }) })
            expect(recoverableError).not.toHaveBeenCalled()
            expect(container.querySelector(".question-content")).toBe(body)
            Array.from(body.querySelectorAll("h2, h3")).forEach((heading, index) => expect(heading).toBe(headings[index]))
            expect(headings.map((heading) => heading.id)).toEqual(ids)
            expect(authoredLinks()).toEqual(linksBefore)
            expect(outlineLabels()).toEqual(labelsBefore)
            expect(body.querySelector("a a")).toBeNull()
            expect(linksBefore.map((link) => link.href)).toEqual([
                "/learn/attention", "/blog/report", null, "https://example.com/paper",
            ])
            for (const name of ["Visible title", "A formula x2x^2"]) {
                const heading = within(container).getByRole("heading", { name })
                expect(within(heading).getByRole("link", { name })).toBe(heading.querySelector("a[data-heading-anchor]"))
            }
            for (const heading of headings) {
                const permalink = heading.querySelector<HTMLAnchorElement>("a[data-heading-anchor]")!
                expect(permalink.parentElement).toBe(heading)
                expect(permalink.getAttribute("href")).toBe("#" + encodeURIComponent(heading.id))
                expect(heading.getAttribute("aria-labelledby")).toBe(permalink.getAttribute("aria-labelledby"))
                expect(permalink.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true")
                permalink.focus()
                expect(document.activeElement).toBe(permalink)
            }
        } finally {
            await act(async () => root?.unmount())
            container.remove()
        }
    })

    test("keeps the initial outline and article nodes in place during hydration", async () => {
        const element = (
            <ServerMarkdownRenderer contentKey="hydration" showTableOfContents content={"## First section\n\nBody.\n\n### Nested section\n\nMore."} />
        )
        const container = document.createElement("div")
        container.innerHTML = renderToString(element)
        document.body.append(container)
        const outline = container.querySelector("details")!
        const outlineMarkup = outline.outerHTML
        const body = container.querySelector(".question-content")!
        const firstHeading = body.querySelector("h2")!
        const recoverableError = vi.fn()
        let root: Root | undefined

        try {
            expect(outline.nextElementSibling).toBe(body)
            await act(async () => { root = hydrateRoot(container, element, { onRecoverableError: recoverableError }) })
            expect(container.querySelector("details")).toBe(outline)
            expect(outline.outerHTML).toBe(outlineMarkup)
            expect(container.querySelector(".question-content")).toBe(body)
            expect(body.querySelector("h2")).toBe(firstHeading)
            expect(outline.nextElementSibling).toBe(body)
            expect(recoverableError).not.toHaveBeenCalled()
        } finally {
            await act(async () => root?.unmount())
            container.remove()
        }
    })
})
