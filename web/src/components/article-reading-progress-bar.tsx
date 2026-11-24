"use client"

import { useEffect, useState } from "react"

export function ArticleReadingProgressBar({ targetId = "lesson-content" }: { targetId?: string }) {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        let frame = 0

        const compute = () => {
            frame = 0
            const target = document.getElementById(targetId)
            if (target) {
                const rect = target.getBoundingClientRect()
                const total = Math.max(1, target.offsetHeight - window.innerHeight)
                const scrolled = Math.min(total, Math.max(0, -rect.top))
                setProgress(Math.round((scrolled / total) * 1000) / 10)
                return
            }

            const docHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
            const ratio = Math.min(1, Math.max(0, window.scrollY / docHeight))
            setProgress(Math.round(ratio * 1000) / 10)
        }

        const schedule = () => {
            if (frame) return
            frame = window.requestAnimationFrame(compute)
        }

        compute()
        window.addEventListener("scroll", schedule, { passive: true })
        window.addEventListener("resize", schedule, { passive: true })

        return () => {
            if (frame) window.cancelAnimationFrame(frame)
            window.removeEventListener("scroll", schedule)
            window.removeEventListener("resize", schedule)
        }
    }, [targetId])

    return (
        <div
            aria-hidden="true"
            data-print-hidden
            className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2.5px] bg-transparent print:hidden"
        >
            <div
                className="h-full bg-gradient-to-r from-primary via-violet-400 to-sky-400 transition-[width] duration-75 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    )
}
