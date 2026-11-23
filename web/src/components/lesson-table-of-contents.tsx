"use client"

import { useEffect, useState, type RefObject } from "react"
import { ChevronDown } from "lucide-react"

export interface HeadingEntry {
    id: string
    title: string
    level: number
}

function readHeadings(body: HTMLElement): HeadingEntry[] {
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
            label.querySelectorAll("[aria-hidden='true']").forEach((node) => node.remove())
            return { id: heading.id, title: label.textContent?.trim() ?? "", level: Number(heading.tagName.slice(1)) }
        })
        .filter((heading) => heading.title.length > 0)
}

export function LessonTableOfContents({ bodyRef, content, initialHeadings = [] }: {
    bodyRef: RefObject<HTMLDivElement | null>
    content: string
    initialHeadings?: HeadingEntry[]
}) {
    const [headings, setHeadings] = useState<HeadingEntry[]>(initialHeadings)

    useEffect(() => {
        const body = bodyRef.current
        if (!body) return
        const update = () => {
            const next = readHeadings(body)
            setHeadings((previous) => previous.length === next.length && previous.every((heading, index) => (
                heading.id === next[index].id && heading.title === next[index].title && heading.level === next[index].level
            )) ? previous : next)
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
        <details data-print-hidden className="reader-prose-block group mb-7 rounded-xl border [border-color:var(--reading-border)] [background:var(--reading-panel-solid)] print:hidden">
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
