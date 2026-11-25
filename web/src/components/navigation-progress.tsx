"use client"

import { useEffect, useState, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"

/**
 * Top-of-page loading bar that shows during Next.js navigations.
 * Similar to NProgress / YouTube's red bar.
 */
export function NavigationProgress() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [progress, setProgress] = useState(0)
    const [visible, setVisible] = useState(false)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        // Navigation completed — finish the bar
        if (visible) {
            queueMicrotask(() => setProgress(100))
            const timeout = setTimeout(() => {
                setVisible(false)
                setProgress(0)
            }, 200)
            return () => clearTimeout(timeout)
        }
    }, [pathname, searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        // Intercept link clicks to start the progress bar
        const handleClick = (e: MouseEvent) => {
            const anchor = (e.target as HTMLElement).closest("a")
            if (!anchor) return

            const href = anchor.getAttribute("href")
            if (!href) return

            // Skip external links, anchor links, and special links
            if (
                href.startsWith("http") ||
                href.startsWith("#") ||
                href.startsWith("mailto:") ||
                anchor.target === "_blank" ||
                anchor.hasAttribute("download")
            ) {
                return
            }

            // Skip if it's the same page
            if (href === pathname) return

            // Start the progress bar
            setVisible(true)
            setProgress(13)

            if (timerRef.current) clearInterval(timerRef.current)
            timerRef.current = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 90) {
                        if (timerRef.current) clearInterval(timerRef.current)
                        return prev
                    }
                    // Slow down as we get closer to "done"
                    const increment = prev < 50 ? 8 : prev < 80 ? 3 : 1
                    return Math.min(prev + increment, 90)
                })
            }, 300)
        }

        document.addEventListener("click", handleClick)
        return () => {
            document.removeEventListener("click", handleClick)
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [pathname])

    if (!visible) return null

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] h-[2px] pointer-events-none">
            <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    )
}
