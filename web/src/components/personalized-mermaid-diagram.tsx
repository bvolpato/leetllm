"use client"

import { useEffect, useId, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { IllustrationViewer } from "./illustration-viewer"

const MAX_MERMAID_SOURCE_CHARS = 20_000
const MAX_MERMAID_SOURCE_LINES = 250
const MERMAID_META_PREFIX = "%% leetllm-meta:"

let renderQueue: Promise<void> = Promise.resolve()

function enqueueRender<T>(render: () => Promise<T>) {
    const result = renderQueue.then(render, render)
    renderQueue = result.then(() => undefined, () => undefined)
    return result
}

function sourceError(chart: string) {
    if (!chart.trim()) return "Diagram source is empty."
    if (
        chart.length > MAX_MERMAID_SOURCE_CHARS
        || chart.split(/\r?\n/).length > MAX_MERMAID_SOURCE_LINES
    ) {
        return "Diagram is too large to render safely."
    }
    return null
}

function encodedSvgSource(svg: string) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

interface MermaidMetadata {
    alt?: string
    caption?: string
    fallbackDarkSrc?: string
    fallbackLightSrc?: string
}

function safeFallbackPath(value: unknown) {
    return typeof value === "string"
        && /^\/(?:cdn|api)\/content-image\/[A-Za-z0-9_./?=-]+$/.test(value)
        && !value.includes("..")
        ? value
        : undefined
}

function parsePersonalizedMermaidSource(source: string) {
    const [firstLine, ...rest] = source.split(/\r?\n/)
    if (!firstLine.startsWith(`${MERMAID_META_PREFIX} `)) {
        return { chart: source, metadata: {} as MermaidMetadata }
    }
    try {
        const encoded = firstLine.slice(MERMAID_META_PREFIX.length + 1).replace(/-/g, "+").replace(/_/g, "/")
        const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0))
        const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>
        return {
            chart: rest.join("\n"),
            metadata: {
                alt: typeof parsed.alt === "string" && parsed.alt.length <= 1_000 ? parsed.alt : undefined,
                caption: typeof parsed.caption === "string" && parsed.caption.length <= 500 ? parsed.caption : undefined,
                fallbackDarkSrc: safeFallbackPath(parsed.fallbackDarkSrc),
                fallbackLightSrc: safeFallbackPath(parsed.fallbackLightSrc),
            },
        }
    } catch {
        return { chart: "", metadata: {} as MermaidMetadata }
    }
}

interface RenderedDiagram {
    key: string
    source?: string
    error?: string
}

export function PersonalizedMermaidDiagram({ chart }: { chart: string }) {
    const { resolvedTheme } = useTheme()
    const theme = resolvedTheme === "light" ? "light" : resolvedTheme === "dark" ? "dark" : null
    const { chart: diagramSource, metadata } = parsePersonalizedMermaidSource(chart)
    const componentId = useId().replace(/[^A-Za-z0-9_-]/g, "") || "diagram"
    const renderCount = useRef(0)
    const [rendered, setRendered] = useState<RenderedDiagram | null>(null)
    const validationError = sourceError(diagramSource)
    const renderKey = `${theme ?? "pending"}:${diagramSource}`

    useEffect(() => {
        if (validationError || !theme) return

        let cancelled = false
        const renderId = `personalized-mermaid-${componentId}-${++renderCount.current}`

        async function renderDiagram() {
            try {
                const { default: mermaid } = await import("mermaid")
                if (cancelled) return

                const svg = await enqueueRender(async () => {
                    if (cancelled) return null
                    const host = document.createElement("div")
                    try {
                        mermaid.initialize({
                            startOnLoad: false,
                            securityLevel: "strict",
                            htmlLabels: false,
                            suppressErrorRendering: true,
                            maxTextSize: MAX_MERMAID_SOURCE_CHARS,
                            maxEdges: 160,
                            theme: theme === "dark" ? "dark" : "default",
                        })
                        return (await mermaid.render(renderId, diagramSource.trim(), host)).svg
                    } finally {
                        host.replaceChildren()
                        host.remove()
                    }
                })

                if (!cancelled && svg) {
                    setRendered({ key: renderKey, source: encodedSvgSource(svg) })
                }
            } catch {
                if (!cancelled) {
                    setRendered({ key: renderKey, error: "Diagram could not be rendered." })
                }
            }
        }

        void renderDiagram()
        return () => {
            cancelled = true
        }
    }, [componentId, diagramSource, renderKey, theme, validationError])

    const activeRender = rendered?.key === renderKey ? rendered : null
    const error = validationError ?? activeRender?.error

    if (error) {
        const fallbackSrc = theme === "light" ? metadata.fallbackLightSrc : metadata.fallbackDarkSrc
        if (fallbackSrc) {
            return (
                <figure className="my-9 flex w-full flex-col items-center gap-3" data-visual-fallback="canonical">
                    <IllustrationViewer
                        src={fallbackSrc}
                        alt={metadata.alt ?? "Canonical lesson diagram"}
                        caption={metadata.caption}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={fallbackSrc} alt={metadata.alt ?? "Canonical lesson diagram"} className="h-auto max-w-full" />
                    </IllustrationViewer>
                    {metadata.caption && <figcaption className="max-w-3xl text-center text-sm leading-relaxed [color:var(--reading-muted)]">{metadata.caption}</figcaption>}
                </figure>
            )
        }
        return (
            <div
                role="alert"
                className="my-8 rounded-xl border [border-color:var(--reading-border)] [background:var(--reading-code-bg)] p-5"
            >
                <p className="font-semibold [color:var(--reading-heading)]">{error}</p>
            </div>
        )
    }

    if (!activeRender?.source) {
        return (
            <div
                role="status"
                className="my-8 rounded-xl border [border-color:var(--reading-border)] p-6 text-center text-sm [color:var(--reading-muted)]"
            >
                Rendering personalized diagram…
            </div>
        )
    }

    const alt = metadata.alt ?? "Personalized Mermaid diagram"

    return (
        <figure className="my-8 flex w-full flex-col items-center gap-3 overflow-x-auto">
            <IllustrationViewer src={activeRender.source} alt={alt} caption={metadata.caption}>
                {/* Runtime SVG data URIs cannot use Next image optimization. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={activeRender.source} alt={alt} className="h-auto max-w-full" />
            </IllustrationViewer>
            {metadata.caption && <figcaption className="max-w-3xl text-center text-sm leading-relaxed [color:var(--reading-muted)]">{metadata.caption}</figcaption>}
        </figure>
    )
}
