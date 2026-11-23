import { vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, test } from "vitest"
import Link from "next/link"
import { ArticleLayoutShell } from "./article-layout-shell"

vi.mock("next/navigation", () => ({
    usePathname: () => "/learn/current",
}))

describe("ArticleLayoutShell", () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        window.localStorage.clear()
        Element.prototype.scrollIntoView = vi.fn()
    })

    test("can hide sidebar and widen main content", () => {
        render(
            <ArticleLayoutShell sidebar={<div>Sidebar</div>}>
                <div>Main content</div>
            </ArticleLayoutShell>
        )

        expect(screen.getByTestId("article-sidebar")).toBeDefined()
        expect(screen.getByTestId("article-main-shell").className).toContain("xl:max-w-[1080px]")

        fireEvent.click(screen.getByRole("button", { name: "Hide sidebar" }))

        expect(screen.queryByTestId("article-sidebar")).toBeNull()
        expect(screen.getByTestId("article-main-shell").className).toContain("max-w-[1360px]")
        expect(window.localStorage.getItem("leetllm_article_sidebar_visible")).toBe("0")
    })

    test("offers a lesson skip link before the full course navigation", () => {
        render(
            <ArticleLayoutShell sidebar={<Link href="/learn/current">Current</Link>}>
                <article id="lesson-content" tabIndex={-1}>Main content</article>
            </ArticleLayoutShell>
        )
        const skip = screen.getByRole("link", { name: "Skip to lesson" })
        const current = screen.getByRole("link", { name: "Current" })

        expect(skip.getAttribute("href")).toBe("#lesson-content")
        expect(document.getElementById("lesson-content")).toBeTruthy()
        expect(skip.compareDocumentPosition(current) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    test("restores hidden sidebar preference from localStorage", async () => {
        window.localStorage.setItem("leetllm_article_sidebar_visible", "0")

        render(
            <ArticleLayoutShell sidebar={<div>Sidebar</div>}>
                <div>Main content</div>
            </ArticleLayoutShell>
        )

        await waitFor(() => expect(screen.queryByTestId("article-sidebar")).toBeNull())
        expect(screen.getByRole("button", { name: "Show sidebar" })).toBeDefined()
        expect(screen.getByTestId("article-main-shell").className).toContain("max-w-[1360px]")
    })

    test("centers the current article inside the sidebar without scrolling ancestors", async () => {
        render(
            <ArticleLayoutShell sidebar={<Link href="/learn/current" aria-current="page">Current</Link>}>
                <div>Main content</div>
            </ArticleLayoutShell>
        )

        const current = screen.getByRole("link", { name: "Current" })
        const scrollContainer = current.parentElement!
        Object.defineProperty(scrollContainer, "clientHeight", { value: 200 })
        vi.spyOn(scrollContainer, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 100, 240, 200))
        vi.spyOn(current, "getBoundingClientRect").mockImplementation(() =>
            new DOMRect(0, 880 - scrollContainer.scrollTop, 200, 40)
        )

        await waitFor(() => {
            expect(scrollContainer.scrollTop).toBe(700)
        })
        expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
    })

    test("keeps keyboard focus on the replacement sidebar toggle", () => {
        render(
            <ArticleLayoutShell sidebar={<div>Sidebar</div>}>
                <div>Main content</div>
            </ArticleLayoutShell>
        )

        const hide = screen.getByRole("button", { name: "Hide sidebar" })
        hide.focus()
        fireEvent.click(hide)
        const show = screen.getByRole("button", { name: "Show sidebar" })
        expect(document.activeElement).toBe(show)

        fireEvent.click(show)
        expect(document.activeElement).toBe(screen.getByRole("button", { name: "Hide sidebar" }))
    })

    test("works when the browser denies reading sidebar preferences", () => {
        vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
            throw new DOMException("Storage unavailable", "SecurityError")
        })

        expect(() => render(
            <ArticleLayoutShell sidebar={<div>Sidebar</div>}>
                <div>Main content</div>
            </ArticleLayoutShell>
        )).not.toThrow()
        expect(screen.getByRole("button", { name: "Hide sidebar" })).toBeTruthy()
    })

    test("toggles when saving sidebar preferences fails", () => {
        render(
            <ArticleLayoutShell sidebar={<div>Sidebar</div>}>
                <div>Main content</div>
            </ArticleLayoutShell>
        )
        vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
            throw new DOMException("Storage unavailable", "SecurityError")
        })

        expect(() => fireEvent.click(screen.getByRole("button", { name: "Hide sidebar" }))).not.toThrow()
        expect(screen.queryByTestId("article-sidebar")).toBeNull()
        expect(screen.getByRole("button", { name: "Show sidebar" })).toBeTruthy()
    })
})
