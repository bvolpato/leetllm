"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const ARTICLE_SIDEBAR_STORAGE_KEY = "leetllm_article_sidebar_visible"

export function ArticleLayoutShell({
    sidebar,
    children,
}: {
    sidebar: React.ReactNode
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const [showSidebar, setShowSidebar] = useState(true)
    const sidebarScrollRef = useRef<HTMLDivElement | null>(null)
    const toggleButtonRef = useRef<HTMLButtonElement | null>(null)
    const restoreToggleFocus = useRef(false)

    useEffect(() => {
        if (typeof window === "undefined") return

        try {
            const stored = window.localStorage.getItem(ARTICLE_SIDEBAR_STORAGE_KEY)
            if (stored === null) return

            queueMicrotask(() => {
                setShowSidebar(stored !== "0")
            })
        } catch {
            // Reading and navigation still work when browser storage is unavailable.
        }
    }, [])

    useEffect(() => {
        if (!restoreToggleFocus.current) return
        restoreToggleFocus.current = false
        toggleButtonRef.current?.focus({ preventScroll: true })
    }, [showSidebar])

    useEffect(() => {
        if (!showSidebar) return

        let cancelled = false
        let timeoutId: number | null = null
        let attempts = 0

        function alignCurrentArticle() {
            if (cancelled) return

            const container = sidebarScrollRef.current
            if (!container || container.clientHeight === 0) return

            const currentArticle = container.querySelector<HTMLAnchorElement>('a[aria-current="page"]')
            if (!currentArticle) return

            const containerBox = container.getBoundingClientRect()
            const articleBox = currentArticle.getBoundingClientRect()
            container.scrollTop = Math.max(
                0,
                container.scrollTop + articleBox.top - containerBox.top
                    + (articleBox.height - container.clientHeight) / 2
            )

            attempts += 1
            if (attempts < 4) {
                timeoutId = window.setTimeout(alignCurrentArticle, 100)
            }
        }

        const frame = window.requestAnimationFrame(() => {
            timeoutId = window.setTimeout(alignCurrentArticle, 0)
        })

        return () => {
            cancelled = true
            window.cancelAnimationFrame(frame)
            if (timeoutId !== null) {
                window.clearTimeout(timeoutId)
            }
        }
    }, [pathname, showSidebar])

    function toggleSidebar() {
        const next = !showSidebar
        restoreToggleFocus.current = true
        setShowSidebar(next)
        if (typeof window !== "undefined") {
            try {
                window.localStorage.setItem(ARTICLE_SIDEBAR_STORAGE_KEY, next ? "1" : "0")
            } catch {
                // The preference is optional; keep the toggle usable.
            }
        }
    }

    return (
        <div className="flex gap-8">
            <a
                href="#lesson-content"
                data-print-hidden
                className="sr-only rounded-lg border border-primary bg-background px-4 py-3 text-sm font-medium text-foreground shadow-lg focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:outline-none focus:ring-2 focus:ring-primary"
            >
                Skip to lesson
            </a>
            {showSidebar && (
                <aside data-testid="article-sidebar" data-print-hidden className="hidden xl:block w-60 flex-shrink-0">
                    <div
                        ref={sidebarScrollRef}
                        className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 pb-8"
                    >
                        <div className="sticky top-0 z-10 mb-3 flex justify-end bg-background/95 py-1 backdrop-blur-sm">
                            <Button
                                ref={toggleButtonRef}
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                onClick={toggleSidebar}
                                aria-label="Hide sidebar"
                                title="Hide sidebar"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                        {sidebar}
                    </div>
                </aside>
            )}
            {!showSidebar && (
                <div data-print-hidden className="hidden xl:flex w-8 flex-shrink-0">
                    <div className="sticky top-24">
                        <Button
                            ref={toggleButtonRef}
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            onClick={toggleSidebar}
                            aria-label="Show sidebar"
                            title="Show sidebar"
                        >
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            )}

            <div
                data-testid="article-main-shell"
                className={cn(
                    "flex-1 min-w-0 mx-auto",
                    showSidebar ? "max-w-[1280px] xl:max-w-[1080px]" : "max-w-[1360px]"
                )}
            >
                {children}
            </div>
        </div>
    )
}
