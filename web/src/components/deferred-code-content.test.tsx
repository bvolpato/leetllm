import { act, cleanup, render, screen, waitFor } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { afterEach, expect, test, vi } from "vitest"
import { DeferredCodeContent } from "./deferred-code-content"
import { installControlledIntersectionObserver } from "./intersection-observer-test-utils"

const code = "const value = x < y;\n\nvalue++"

function renderCode(language: string | null, showLineNumbers = false) {
    return render(
        <DeferredCodeContent
            code={code}
            language={language}
            label={language ?? "text"}
            isDark={false}
            className="overflow-x-auto p-5 text-sm leading-[1.7]"
            style={{ fontFamily: "var(--font-jetbrains-mono)", lineHeight: "1.7" }}
            codeStyle={{ fontFamily: "var(--font-jetbrains-mono)" }}
            lineNumberStyle={{ minWidth: "2.5em", paddingRight: "1em", fontSize: "0.8rem" }}
            showLineNumbers={showLineNumbers}
        />,
    )
}

afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
})

test("server renders the complete code as plain, accessible text", () => {
    const html = renderToString(
        <DeferredCodeContent
            code={code}
            language="javascript"
            label="javascript"
            isDark={false}
            className="overflow-x-auto p-5 text-sm leading-[1.7]"
            style={{ fontFamily: "var(--font-jetbrains-mono)", lineHeight: "1.7" }}
            codeStyle={{ fontFamily: "var(--font-jetbrains-mono)" }}
            showLineNumbers
        />,
    )

    expect(html).toContain('role="region"')
    expect(html).toContain('aria-label="javascript code block"')
    expect(html).toContain("const value = x &lt; y;")
    expect(html).toContain("value++")
    expect(html).not.toContain("class=\"token")
})

test("keeps supported code plain offscreen, then highlights without losing focus or scroll", async () => {
    const intersection = installControlledIntersectionObserver()
    const { container } = renderCode("javascript", true)
    const region = screen.getByRole("region", { name: "javascript code block" })

    expect(region.tagName).toBe("DIV")
    expect(region.querySelector("pre code")?.textContent).toBe(code)
    expect(container.querySelector(".token")).toBeNull()
    expect(intersection.observers).toHaveLength(1)
    expect(intersection.observers[0].rootMargin).toBe("200px")

    region.scrollLeft = 24
    region.focus()
    await act(async () => intersection.enterAll(false))
    expect(container.querySelector(".token")).toBeNull()

    await act(async () => intersection.enterAll(true))
    await waitFor(() => expect(container.querySelector(".token")).toBeTruthy())

    expect(screen.getByRole("region", { name: "javascript code block" })).toBe(region)
    expect(document.activeElement).toBe(region)
    expect(region.scrollLeft).toBe(24)
    const highlightedCode = region.querySelector("code")?.cloneNode(true) as HTMLElement | null
    highlightedCode?.querySelectorAll(".linenumber").forEach((lineNumber) => lineNumber.remove())
    expect(highlightedCode?.textContent).toBe(code)
    expect(region.querySelectorAll(".linenumber")).toHaveLength(3)
    expect(intersection.observers[0].disconnect).toHaveBeenCalled()
})

test("keeps unknown languages plain even when they enter the viewport", async () => {
    const intersection = installControlledIntersectionObserver()
    const { container } = renderCode(null, true)

    expect(screen.getByRole("region", { name: "text code block" }).querySelector("pre")?.textContent).toBe(code)
    expect(intersection.observers).toHaveLength(0)
    await act(async () => intersection.enterAll())
    expect(container.querySelector(".token")).toBeNull()
})

test("loads syntax after mount when IntersectionObserver is unavailable", async () => {
    vi.stubGlobal("IntersectionObserver", undefined)
    const { container } = renderCode("javascript")

    expect(screen.getByRole("region", { name: "javascript code block" }).querySelector("pre")?.textContent).toBe(code)
    await waitFor(() => expect(container.querySelector(".token")).toBeTruthy())
})
