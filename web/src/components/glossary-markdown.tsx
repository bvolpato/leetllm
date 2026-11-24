"use client"

import {
    useEffect,
    useId,
    useRef,
    useState,
    type CSSProperties,
    type FocusEvent as ReactFocusEvent,
    type MouseEvent as ReactMouseEvent,
    type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import ReactMarkdown, { defaultUrlTransform } from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"
import "katex/dist/katex.min.css"
import { CircleHelp } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { DeferredCodeContent } from "./deferred-code-content"
import { resolvePrismLanguage } from "./prism-language"
import { getGlossarySummary, useGlossaryEntry } from "@/lib/glossary-client"
import { getGlossaryPreviewMarkdown, glossaryPreviewStartsWithTitle } from "@/lib/glossary-preview"
import { getResponsiveContentImageProps } from "@/lib/responsive-content-image"

export type GlossaryMarkdownProps = {
    content: string
    className?: string
    /** Optional glossary entry id, used to resolve relative illustration paths. */
    entryId?: string
    /** Dialog mode: open related terms in-place without leaving the page. */
    onGlossaryLink?: (id: string) => void
    /** Page mode: navigate related terms via in-page links. */
    onNavigateTerm?: (event: React.MouseEvent<HTMLAnchorElement>, id: string) => void
}

const CODE_FONT_FAMILY = "var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"

function resolveCodeLanguage(rawLanguage: string) {
    const label = rawLanguage.replace(/^\./, "").toLowerCase().split(/\s+/)[0] ?? "text"
    return {
        label,
        highlighterLanguage: resolvePrismLanguage(label) ?? label,
    }
}

function resolveGlossaryImageSrc(src: string | undefined, entryId?: string): string | undefined {
    if (!src) return src
    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
        return src
    }
    if (src.startsWith("/cdn/content-image/") || src.startsWith("/")) {
        return src
    }
    // Relative illustration paths inside a glossary entry, e.g. illustrations/_generated/foo.png
    if (entryId && (src.includes("illustrations/") || src.includes("_generated/"))) {
        const cleaned = src.replace(/^\.\//, "")
        return `/cdn/content-image/glossary/${entryId}/${cleaned}`
    }
    return src
}

function glossaryUrlTransform(url: string) {
    return url.startsWith("glossary:") ? url : defaultUrlTransform(url)
}

function mermaidDiagramIndex(content: string, startLine: number | undefined) {
    if (!startLine) return 0

    const precedingLines = content.split("\n").slice(0, startLine - 1).join("\n")
    return Array.from(precedingLines.matchAll(/^ {0,3}(?:```|~~~)[ \t]*mermaid(?:[ \t].*)?$/gim)).length
}

/**
 * Pre-rendered Mermaid PNGs for glossary terms live at:
 * glossary/<entryId>/diagrams/_generated/<entryId>_diagram_<n>_{dark|light}.png
 */
export function glossaryDiagramImageSrc(entryId: string, diagramIndex: number, theme: "dark" | "light"): string {
    return `/cdn/content-image/glossary/${entryId}/diagrams/_generated/${entryId}_diagram_${diagramIndex}_${theme}.png`
}

function GlossaryMermaidFigure({
    entryId,
    diagramIndex,
    chart,
    isDark,
}: {
    entryId?: string
    diagramIndex: number
    chart: string
    isDark: boolean
}) {
    if (entryId) {
        const darkSrc = glossaryDiagramImageSrc(entryId, diagramIndex, "dark")
        const lightSrc = glossaryDiagramImageSrc(entryId, diagramIndex, "light")
        const activeSrc = isDark ? darkSrc : lightSrc
        return (
            <figure
                className="my-3 overflow-hidden rounded-lg border [border-color:var(--reading-border)]"
                data-glossary-diagram={entryId}
                data-glossary-diagram-index={diagramIndex}
            >
                <picture data-themed-picture="true">
                    <source srcSet={activeSrc} />
                    <img
                        src={activeSrc}
                        alt="Glossary diagram"
                        width={960}
                        height={540}
                        data-glossary-image={entryId}
                        data-themed-image="true"
                        data-dark-src={darkSrc}
                        data-light-src={lightSrc}
                        className="block aspect-[16/9] max-h-[360px] w-full max-w-full object-contain"
                        loading="lazy"
                        decoding="async"
                    />
                </picture>
            </figure>
        )
    }

    // No entry id / pre-render path: show a compact diagram placeholder (not a code highlighter frame).
    return (
        <div
            className="my-3 overflow-x-auto rounded-lg border [border-color:var(--reading-border)] [background:var(--reading-code-bg)] p-3"
            data-glossary-diagram-fallback="mermaid"
        >
            <pre className="m-0 whitespace-pre-wrap font-mono text-[0.75rem] leading-relaxed [color:var(--reading-muted)]">
                <code>{chart.trim()}</code>
            </pre>
        </div>
    )
}

function RelatedGlossaryLink({
    targetId,
    children,
    onGlossaryLink,
    onNavigateTerm,
}: {
    targetId: string
    children: ReactNode
    onGlossaryLink?: (id: string) => void
    onNavigateTerm?: (event: ReactMouseEvent<HTMLAnchorElement>, id: string) => void
}) {
    const summary = getGlossarySummary(targetId)
    const [tooltipOpen, setTooltipOpen] = useState(false)
    const { entry, error } = useGlossaryEntry(targetId, tooltipOpen)
    const [tooltipStyle, setTooltipStyle] = useState<CSSProperties | null>(null)
    const triggerRef = useRef<HTMLElement | null>(null)
    const tooltipId = useId()
    const href = `/glossary#${encodeURIComponent(targetId)}`

    useEffect(() => {
        if (!tooltipOpen) return

        function updateTooltipPosition() {
            const rect = triggerRef.current?.getBoundingClientRect()
            if (!rect) return

            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight
            const width = Math.min(352, Math.max(200, viewportWidth - 32))
            const left = Math.min(
                Math.max(rect.left + rect.width / 2, 16 + width / 2),
                viewportWidth - 16 - width / 2,
            )
            const showAbove = viewportHeight - rect.bottom < 180 && rect.top > viewportHeight - rect.bottom
            const top = showAbove ? Math.max(16, rect.top - 10) : Math.min(viewportHeight - 16, rect.bottom + 10)

            setTooltipStyle({
                left,
                maxWidth: width,
                position: "fixed",
                top,
                transform: showAbove ? "translate(-50%, -100%)" : "translate(-50%, 0)",
                width,
            })
        }

        updateTooltipPosition()
        window.addEventListener("resize", updateTooltipPosition)
        window.addEventListener("scroll", updateTooltipPosition, true)
        return () => {
            window.removeEventListener("resize", updateTooltipPosition)
            window.removeEventListener("scroll", updateTooltipPosition, true)
        }
    }, [tooltipOpen])

    function handleBlur(event: ReactFocusEvent<HTMLElement>) {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
        setTooltipOpen(false)
    }

    const className = "inline-flex items-center gap-1 rounded-sm text-primary underline decoration-primary/35 underline-offset-4 hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    const tooltipProps = summary
        ? {
            "aria-describedby": tooltipOpen ? tooltipId : undefined,
            onFocus: () => setTooltipOpen(true),
            onMouseEnter: () => setTooltipOpen(true),
        }
        : {}

    let trigger: ReactNode
    if (summary && onGlossaryLink) {
        trigger = (
            <button
                ref={(element) => {
                    triggerRef.current = element
                }}
                type="button"
                aria-label={`Open related glossary term ${summary.title}`}
                className={className}
                {...tooltipProps}
                data-glossary-related-link={targetId}
                onClick={() => onGlossaryLink(targetId)}
            >
                <span>{children}</span>
                <CircleHelp className="h-3 w-3 shrink-0" aria-hidden="true" />
            </button>
        )
    } else if (onNavigateTerm) {
        trigger = (
            <a
                ref={(element) => {
                    triggerRef.current = element
                }}
                href={href}
                className={className}
                {...tooltipProps}
                data-glossary-related-link={targetId}
                onClickCapture={(event) => onNavigateTerm(event, targetId)}
            >
                <span>{children}</span>
                {summary && <CircleHelp className="h-3 w-3 shrink-0" aria-hidden="true" />}
            </a>
        )
    } else {
        trigger = (
            <Link
                ref={(element) => {
                    triggerRef.current = element
                }}
                href={href}
                prefetch={false}
                className={className}
                {...tooltipProps}
                data-glossary-related-link={targetId}
            >
                <span>{children}</span>
                {summary && <CircleHelp className="h-3 w-3 shrink-0" aria-hidden="true" />}
            </Link>
        )
    }

    return (
        <span
            className="inline"
            onBlurCapture={handleBlur}
            onMouseLeave={() => setTooltipOpen(false)}
        >
            {trigger}
            {summary && tooltipOpen && tooltipStyle && createPortal(
                <div
                    id={tooltipId}
                    role="tooltip"
                    data-glossary-link-tooltip={targetId}
                    style={tooltipStyle}
                    className="pointer-events-none z-[100] rounded-lg border [border-color:var(--reading-border)] [background:var(--reading-panel-solid)] p-3 text-left text-sm leading-relaxed [color:var(--reading-ink)] shadow-xl shadow-black/20"
                >
                    {(!entry || !glossaryPreviewStartsWithTitle(entry.definition, summary.title)) && (
                        <p className="mb-2 font-semibold [color:var(--reading-heading)]">{summary.title}</p>
                    )}
                    {entry ? <GlossaryMarkdown
                        content={getGlossaryPreviewMarkdown(entry.definition)}
                        entryId={targetId}
                        className="text-sm [&>p]:m-0"
                    /> : <p>{error ? "Preview unavailable. Follow the link for the definition." : "Loading definition..."}</p>}
                </div>,
                document.body,
            )}
        </span>
    )
}

export function GlossaryMarkdown({
    content,
    className,
    entryId,
    onGlossaryLink,
    onNavigateTerm,
}: GlossaryMarkdownProps) {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        queueMicrotask(() => setMounted(true))
    }, [])

    const isDark = mounted ? resolvedTheme !== "light" : true

    return (
        <div className={["glossary-markdown", className].filter(Boolean).join(" ")}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeRaw]}
                urlTransform={glossaryUrlTransform}
                components={{
                    p({ children }) {
                        return <p className="my-2 first:mt-0 last:mb-0">{children}</p>
                    },
                    ul({ children }) {
                        return <ul className="my-2 list-disc space-y-1 pl-5 first:mt-0 last:mb-0">{children}</ul>
                    },
                    ol({ children }) {
                        return <ol className="my-2 list-decimal space-y-1 pl-5 first:mt-0 last:mb-0">{children}</ol>
                    },
                    li({ children }) {
                        return <li className="leading-relaxed">{children}</li>
                    },
                    h3({ children }) {
                        return (
                            <h3 className="mt-3 mb-1 text-sm font-semibold [color:var(--reading-heading)]">
                                {children}
                            </h3>
                        )
                    },
                    h4({ children }) {
                        return (
                            <h4 className="mt-2 mb-1 text-xs font-semibold uppercase tracking-wider [color:var(--reading-muted)]">
                                {children}
                            </h4>
                        )
                    },
                    blockquote({ children }) {
                        return (
                            <blockquote className="my-2 border-l-2 border-primary/40 pl-3 [color:var(--reading-muted)]">
                                {children}
                            </blockquote>
                        )
                    },
                    table({ children }) {
                        return (
                            <div className="my-3 overflow-x-auto">
                                <table className="w-full border-collapse text-left text-sm">{children}</table>
                            </div>
                        )
                    },
                    th({ children }) {
                        return (
                            <th className="border [border-color:var(--reading-border)] bg-black/5 px-2 py-1 font-semibold">
                                {children}
                            </th>
                        )
                    },
                    td({ children }) {
                        return (
                            <td className="border [border-color:var(--reading-border)] px-2 py-1 align-top">
                                {children}
                            </td>
                        )
                    },
                    figure({ children }) {
                        return (
                            <figure
                                className="my-3 max-w-full overflow-x-auto"
                                data-glossary-figure={entryId ?? "true"}
                            >
                                {children}
                            </figure>
                        )
                    },
                    figcaption({ children }) {
                        return (
                            <figcaption className="mt-1 text-xs leading-relaxed [color:var(--reading-muted)]">
                                {children}
                            </figcaption>
                        )
                    },
                    pre({ children }) {
                        return <>{children}</>
                    },
                    code({ className: codeClassName, children, node }) {
                        const match = /language-([^\s]+)/.exec(codeClassName || "")
                        const codeString = String(children).replace(/\n$/, "")
                        // Fenced blocks carry a language class or multi-line content.
                        const isBlock = Boolean(match) || codeString.includes("\n")

                        if (isBlock) {
                            const language = match
                                ? resolveCodeLanguage(match[1])
                                : { label: "text", highlighterLanguage: "text" }

                            // Mermaid: render as diagram images (pre-rendered pipeline), not code chrome.
                            if (language.label === "mermaid") {
                                const diagramIndex = mermaidDiagramIndex(content, node?.position?.start.line)
                                return (
                                    <GlossaryMermaidFigure
                                        entryId={entryId}
                                        diagramIndex={diagramIndex}
                                        chart={codeString}
                                        isDark={isDark}
                                    />
                                )
                            }

                            const label = language.label

                            return (
                                <div
                                    className="my-3 overflow-hidden rounded-lg border [border-color:var(--reading-border)] shadow-sm shadow-black/5"
                                    data-glossary-code-block={language.label}
                                >
                                    <div className="flex items-center gap-2 border-b px-3 py-1.5 [border-color:var(--reading-border)] [background:var(--reading-code-header)]">
                                        <div className="flex gap-1">
                                            <div className="h-2 w-2 rounded-full bg-red-500/60" />
                                            <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
                                            <div className="h-2 w-2 rounded-full bg-green-500/60" />
                                        </div>
                                        <span className="min-w-0 flex-1 truncate font-mono text-[0.7rem] font-semibold [color:var(--reading-heading)]">
                                            {label}
                                        </span>
                                    </div>
                                    <DeferredCodeContent
                                        code={codeString}
                                        language={resolvePrismLanguage(language.highlighterLanguage)}
                                        label={label}
                                        isDark={isDark}
                                        className="m-0 max-w-full overflow-x-auto px-4 py-[0.9rem] text-[0.8rem] leading-[1.6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50"
                                        style={{
                                            background: "var(--reading-code-bg)",
                                            fontFamily: CODE_FONT_FAMILY,
                                            lineHeight: "1.6",
                                        }}
                                        codeStyle={{ fontFamily: CODE_FONT_FAMILY }}
                                    />
                                </div>
                            )
                        }

                        return (
                            <code className="rounded border [border-color:var(--reading-code-inline-border)] px-1 py-0.5 font-mono text-[0.9em] [background:var(--reading-code-inline-bg)] [color:var(--reading-code-inline-ink)]">
                                {children}
                            </code>
                        )
                    },
                    img(props: React.ImgHTMLAttributes<HTMLImageElement> & {
                        node?: unknown
                        "data-themed-image"?: string
                        "data-dark-src"?: string
                        "data-light-src"?: string
                        "data-natural-width"?: string
                        "data-dark-natural-width"?: string
                        "data-light-natural-width"?: string
                    }) {
                        const { src, alt, className: imgClassName } = props
                        const resolved = resolveGlossaryImageSrc(
                            typeof src === "string" ? src : undefined,
                            entryId,
                        )
                        if (!resolved) return null
                        const darkSrc = resolveGlossaryImageSrc(props["data-dark-src"], entryId)
                        const lightSrc = resolveGlossaryImageSrc(props["data-light-src"], entryId)
                        const isThemed = props["data-themed-image"] === "true" && Boolean(darkSrc || lightSrc)
                        const activeSrc = isThemed
                            ? (isDark ? darkSrc ?? lightSrc : lightSrc ?? darkSrc) ?? resolved
                            : resolved
                        const imageWidth = Number(props.width)
                        const imageHeight = Number(props.height)
                        const isWideDiagram = Boolean(
                            entryId
                            && imageWidth > 0
                            && imageHeight > 0
                            && imageWidth / imageHeight > 6.5,
                        )
                        const naturalWidth = isThemed
                            ? (isDark
                                ? props["data-dark-natural-width"] ?? props["data-light-natural-width"]
                                : props["data-light-natural-width"] ?? props["data-dark-natural-width"])
                                ?? props["data-natural-width"]
                            : props["data-natural-width"]
                        const responsiveProps = getResponsiveContentImageProps(
                            activeSrc,
                            naturalWidth ? Number(naturalWidth) : undefined,
                            isWideDiagram ? "(max-width: 768px) 768px, 960px" : "(max-width: 768px) calc(100vw - 64px), 768px",
                        )
                        const image = (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={activeSrc}
                                {...responsiveProps}
                                alt={alt ?? ""}
                                width={props.width}
                                height={props.height}
                                data-glossary-image={entryId ?? "true"}
                                data-themed-image={isThemed ? "true" : undefined}
                                data-dark-src={darkSrc}
                                data-light-src={lightSrc}
                                data-natural-width={props["data-natural-width"]}
                                data-dark-natural-width={props["data-dark-natural-width"]}
                                data-light-natural-width={props["data-light-natural-width"]}
                                data-glossary-wide-diagram={isWideDiagram ? "true" : undefined}
                                className={
                                    isWideDiagram
                                        ? "my-3 h-auto w-auto min-w-[48rem] max-w-none rounded-lg border [border-color:var(--reading-border)]"
                                        : imgClassName
                                        ? String(imgClassName)
                                        : "my-3 max-h-[320px] w-auto max-w-full rounded-lg border [border-color:var(--reading-border)]"
                                }
                                loading="lazy"
                                decoding="async"
                            />
                        )
                        if (!isThemed) return image
                        return (
                            <picture data-themed-picture="true">
                                <source
                                    srcSet={responsiveProps.srcSet ?? activeSrc}
                                    sizes={responsiveProps.sizes}
                                />
                                {image}
                            </picture>
                        )
                    },
                    a({ children, href }) {
                        if (typeof href === "string" && href.startsWith("glossary:")) {
                            const targetId = href.replace(/^glossary:(?:\/\/)?/, "")
                            return (
                                <RelatedGlossaryLink
                                    targetId={targetId}
                                    onGlossaryLink={onGlossaryLink}
                                    onNavigateTerm={onNavigateTerm}
                                >
                                    {children}
                                </RelatedGlossaryLink>
                            )
                        }

                        const isInternal =
                            typeof href === "string" && href.startsWith("/") && !href.startsWith("//")

                        if (isInternal) {
                            return (
                                <Link
                                    href={href}
                                    className="text-primary underline decoration-primary/35 underline-offset-4 hover:text-primary/80"
                                >
                                    {children}
                                </Link>
                            )
                        }

                        return (
                            <a
                                href={href}
                                className="text-primary underline decoration-primary/35 underline-offset-4 hover:text-primary/80"
                                target={href?.startsWith("#") ? undefined : "_blank"}
                                rel={href?.startsWith("#") ? undefined : "noopener noreferrer"}
                            >
                                {children}
                            </a>
                        )
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}

/** Pure helper exported for unit tests (image path resolution). */
export function resolveGlossaryImageSrcForTest(src: string, entryId?: string): string | undefined {
    return resolveGlossaryImageSrc(src, entryId)
}

export type { ReactNode }
