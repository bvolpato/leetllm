"use client"

import { useTheme } from "next-themes"
import { useEffect, useMemo, useState } from "react"
import { IllustrationViewer } from "./illustration-viewer"

const MAX_SPEC_CHARS = 16 * 1024
const MAX_SVG_CHARS = 1_000_000

interface ClientVizmaticSpec {
    alt?: string
    caption?: string
    [key: string]: unknown
}

function parseSpec(source: string) {
    if (!source.trim() || source.length > MAX_SPEC_CHARS) return null
    try {
        const parsed = JSON.parse(source) as unknown
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null
        return parsed as ClientVizmaticSpec
    } catch {
        return null
    }
}

function encodedSvgSource(svg: string) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

interface RenderState {
    key: string
    source?: string
    error?: string
}

export function PersonalizedVizmaticDiagram({ source, lessonSlug }: { source: string; lessonSlug?: string }) {
    const { resolvedTheme } = useTheme()
    const theme = resolvedTheme === "light" ? "light" : resolvedTheme === "dark" ? "dark" : null
    const spec = useMemo(() => parseSpec(source), [source])
    const renderKey = `${theme ?? "pending"}:${source}`
    const [rendered, setRendered] = useState<RenderState | null>(null)

    useEffect(() => {
        if (!spec || !theme || !lessonSlug) return
        const controller = new AbortController()

        async function render() {
            try {
                const response = await fetch("/api/personalization/render-vizmatic", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ spec, theme, slug: lessonSlug }),
                    cache: "no-store",
                    signal: controller.signal,
                })
                if (!response.ok) throw new Error("render failed")
                const svg = await response.text()
                if (!svg.startsWith("<svg") || svg.length > MAX_SVG_CHARS) {
                    throw new Error("invalid render")
                }
                if (!controller.signal.aborted) {
                    setRendered({ key: renderKey, source: encodedSvgSource(svg) })
                }
            } catch (error) {
                if (!controller.signal.aborted && !(error instanceof Error && error.name === "AbortError")) {
                    setRendered({ key: renderKey, error: "Personalized illustration could not be rendered." })
                }
            }
        }

        void render()
        return () => controller.abort()
    }, [lessonSlug, renderKey, spec, theme])

    if (!spec || !lessonSlug) {
        return (
            <div role="alert" className="my-8 rounded-xl border [border-color:var(--reading-border)] p-5">
                Personalized illustration has an invalid scene specification.
            </div>
        )
    }

    const activeRender = rendered?.key === renderKey ? rendered : null
    if (activeRender?.error) {
        const fallbackSrc = theme === "light"
            ? (typeof spec.fallbackLightSrc === "string" ? spec.fallbackLightSrc : null)
            : (typeof spec.fallbackDarkSrc === "string" ? spec.fallbackDarkSrc : null)
        const fallbackAlt = typeof spec.alt === "string" && spec.alt.trim()
            ? spec.alt.trim()
            : "Canonical lesson illustration"
        const fallbackCaption = typeof spec.caption === "string" && spec.caption.trim()
            ? spec.caption.trim()
            : null
        if (fallbackSrc) {
            return (
                <figure className="my-9 flex w-full flex-col items-center gap-3" data-visual-fallback="canonical">
                    <IllustrationViewer src={fallbackSrc} alt={fallbackAlt} caption={fallbackCaption}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={fallbackSrc} alt={fallbackAlt} className="h-auto max-w-full" />
                    </IllustrationViewer>
                    {fallbackCaption && <figcaption className="max-w-3xl text-center text-sm leading-relaxed [color:var(--reading-muted)]">{fallbackCaption}</figcaption>}
                </figure>
            )
        }
        return (
            <div role="alert" className="my-8 rounded-xl border [border-color:var(--reading-border)] [background:var(--reading-code-bg)] p-5">
                <p className="font-semibold [color:var(--reading-heading)]">{activeRender.error}</p>
            </div>
        )
    }

    if (!activeRender?.source) {
        return (
            <div role="status" className="my-8 rounded-xl border [border-color:var(--reading-border)] p-6 text-center text-sm [color:var(--reading-muted)]">
                Rendering personalized illustration…
            </div>
        )
    }

    const alt = typeof spec.alt === "string" && spec.alt.trim()
        ? spec.alt.trim()
        : "Personalized Vizmatic illustration"
    const caption = typeof spec.caption === "string" && spec.caption.trim() ? spec.caption.trim() : null

    return (
        <figure className="my-9 flex w-full flex-col items-center gap-3">
            <IllustrationViewer src={activeRender.source} alt={alt} caption={caption}>
                {/* Runtime SVG data URIs cannot use Next image optimization. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={activeRender.source} alt={alt} className="h-auto max-w-full" />
            </IllustrationViewer>
            {caption && <figcaption className="max-w-3xl text-center text-sm leading-relaxed [color:var(--reading-muted)]">{caption}</figcaption>}
        </figure>
    )
}
