"use client"

import { useEffect, useState, type RefObject } from "react"
import { ChevronDown } from "lucide-react"

export interface HeadingEntry {
    id: string
    title: string
    level: number
}

function readHeadings(body: HTMLElement, stripMathMl = false): HeadingEntry[] {
    return Array.from(body.querySelectorAll<HTMLElement>("h2[id], h3[id]"))
        .filter((heading) => {
            if (heading.closest("[data-lesson-toc-exclude], [data-print-only], [hidden], [aria-hidden='true']")) return false
            let ancestor = heading.parentElement
            while (ancestor && ancestor !== body) {
                if (ancestor instanceof HTMLDetailsElement && !ancestor.open) return false
                ancestor = ancestor.parentElement
            }
            return true
        })
        .map((heading) => {
            const label = heading.cloneNode(true) as HTMLElement
            if (stripMathMl) {
                label.querySelectorAll(".katex-mathml").forEach((node) => node.remove())
                label.querySelectorAll("[aria-hidden='true']").forEach((node) => {
                    if (!node.closest(".katex")) node.remove()
                })
            } else {
                label.querySelectorAll("[aria-hidden='true']").forEach((node) => node.remove())
            }
            return { id: heading.id, title: label.textContent?.replace(/\s+/g, " ").trim() ?? "", level: Number(heading.tagName.slice(1)) }
        })
        .filter((heading) => heading.title.length > 0)
}

function headingsEqual(previous: HeadingEntry[], next: HeadingEntry[]) {
    return previous.length === next.length && previous.every((heading, index) => (
        heading.id === next[index].id && heading.title === next[index].title && heading.level === next[index].level
    ))
}

export function LessonTableOfContents({
    bodyRef,
    content,
    initialHeadings = [],
    hideOnDesktop = false,
}: {
    bodyRef: RefObject<HTMLDivElement | null>
    content: string
    initialHeadings?: HeadingEntry[]
    hideOnDesktop?: boolean
}) {
    const [headings, setHeadings] = useState<HeadingEntry[]>(initialHeadings)

    useEffect(() => {
        const body = bodyRef.current
        if (!body) return
        const update = () => {
            const next = readHeadings(body)
            setHeadings((previous) => (headingsEqual(previous, next) ? previous : next))
        }
        update()
        const observer = new MutationObserver(update)
        observer.observe(body, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ["id", "open", "hidden", "aria-hidden"],
        })
        return () => observer.disconnect()
    }, [bodyRef, content])

    if (headings.length === 0) return null

    return (
        <details
            data-print-hidden
            className={`reader-prose-block group mb-7 rounded-xl border [border-color:var(--reading-border)] [background:var(--reading-panel-solid)] print:hidden ${hideOnDesktop ? "xl:hidden" : ""}`.trim()}
        >
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold [color:var(--reading-heading)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 [&::-webkit-details-marker]:hidden">
                On this page
                <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <nav aria-label="On this page" className="max-h-80 overflow-y-auto border-t px-3 py-2 [border-color:var(--reading-border)]">
                <ul className="m-0 list-none space-y-0.5 p-0">
                    {headings.map((heading) => (
                        <li key={heading.id}>
                            <a
                                href={`#${encodeURIComponent(heading.id)}`}
                                className={`flex min-h-9 items-center rounded-md py-2 pr-3 text-sm leading-snug [color:var(--reading-ink)] hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${heading.level === 3 ? "pl-6" : "pl-3 font-medium"}`}
                            >
                                {heading.title}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </details>
    )
}

export function ArticleRightRailToc({
    containerId = "lesson-content",
    initialHeadings = [],
}: {
    containerId?: string
    initialHeadings?: HeadingEntry[]
}) {
    const [headings, setHeadings] = useState<HeadingEntry[]>(initialHeadings)
    const [activeId, setActiveId] = useState<string>(initialHeadings[0]?.id ?? "")

    useEffect(() => {
        const container = document.getElementById(containerId)
        if (!container) return

        const updateHeadings = () => {
            const body = container.querySelector<HTMLElement>(".question-content") ?? container
            const next = readHeadings(body, true)
            setHeadings((previous) => (headingsEqual(previous, next) ? previous : next))
        }

        updateHeadings()
        const observer = new MutationObserver(updateHeadings)
        observer.observe(container, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ["id", "open", "hidden", "aria-hidden"],
        })

        return () => observer.disconnect()
    }, [containerId])

    useEffect(() => {
        if (headings.length === 0) return

        let frame = 0
        const updateActive = () => {
            frame = 0
            const threshold = 136
            let current = headings[0]?.id ?? ""

            for (const heading of headings) {
                const node = document.getElementById(heading.id)
                if (!node) continue
                if (node.getBoundingClientRect().top <= threshold) {
                    current = heading.id
                } else {
                    break
                }
            }

            if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 24) {
                current = headings[headings.length - 1]?.id ?? current
            }

            setActiveId((previous) => (previous === current ? previous : current))
        }

        const schedule = () => {
            if (frame) return
            frame = window.requestAnimationFrame(updateActive)
        }

        updateActive()
        window.addEventListener("scroll", schedule, { passive: true })
        window.addEventListener("resize", schedule, { passive: true })
        window.addEventListener("hashchange", schedule)

        return () => {
            if (frame) window.cancelAnimationFrame(frame)
            window.removeEventListener("scroll", schedule)
            window.removeEventListener("resize", schedule)
            window.removeEventListener("hashchange", schedule)
        }
    }, [headings])

    if (headings.length === 0) return null

    return (
        <nav aria-label="Table of contents" className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] [color:var(--reading-subtle)]">
                On this page
            </p>
            <ul className="m-0 list-none border-l [border-color:var(--reading-border)] p-0">
                {headings.map((heading) => {
                    const isActive = heading.id === activeId
                    return (
                        <li key={heading.id} className="-ml-px">
                            <a
                                href={`#${encodeURIComponent(heading.id)}`}
                                aria-current={isActive ? "location" : undefined}
                                className={[
                                    "block border-l-2 py-1.5 pr-2 text-xs leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                    heading.level === 3 ? "pl-5" : "pl-3",
                                    isActive
                                        ? "border-primary font-medium text-primary"
                                        : "border-transparent [color:var(--reading-subtle)] hover:border-primary/40 hover:[color:var(--reading-heading)]",
                                ].join(" ")}
                            >
                                {heading.title}
                            </a>
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}
