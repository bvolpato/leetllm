"use client"

import { useEffect, useState, type ImgHTMLAttributes } from "react"
import { useTheme } from "next-themes"
import { Check, ChevronDown, ChevronUp, Copy } from "lucide-react"
import { DeferredCodeContent } from "./deferred-code-content"
import { IllustrationViewer } from "./illustration-viewer"
import { resolvePrismLanguage } from "./prism-language"
import { MAX_CONTENT_IMAGE_HEIGHT_PX } from "@/lib/content-media"
import { getResponsiveContentImageProps } from "@/lib/responsive-content-image"

const CODE_FONT_FAMILY = "var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"

function useContentDarkTheme() {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    useEffect(() => { queueMicrotask(() => setMounted(true)) }, [])
    return mounted ? resolvedTheme !== "light" : true
}

async function copyTextToClipboard(text: string) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        return
    }

    const textArea = document.createElement("textarea")
    textArea.value = text
    textArea.setAttribute("readonly", "")
    textArea.style.position = "fixed"
    textArea.style.top = "-9999px"
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand("copy")
    document.body.removeChild(textArea)
}

function CodeCopyButton({ code }: { code: string }) {
    const [copied, setCopied] = useState(false)

    async function handleCopy() {
        await copyTextToClipboard(code)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1600)
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "Code copied" : "Copy code"}
            title={copied ? "Copied" : "Copy code"}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border [border-color:var(--reading-border)] [color:var(--reading-muted)] hover:[color:var(--reading-ink)] hover:bg-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:h-9 sm:w-9"
        >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
    )
}

const COLLAPSE_LINE_THRESHOLD = 45
const PLAIN_TEXT_LANGUAGES = new Set(["text", "plaintext", "txt", "output"])

export function MarkdownCodeBlock({ code: codeString, language, meta = { bare: false, compact: false, output: false } }: {
    code: string
    language?: { label: string; highlighterLanguage: string }
    meta?: { bare: boolean; compact: boolean; output: boolean; title?: string }
}) {
    const isDark = useContentDarkTheme()
    const [expanded, setExpanded] = useState(false)
    const lineCount = codeString.split("\n").length
    const isCollapsible = lineCount > COLLAPSE_LINE_THRESHOLD
    const isPlainOrOutput = meta.output || !language || PLAIN_TEXT_LANGUAGES.has(language.label)
    const isShortUntitled = !meta.title && lineCount <= 4
    const showWindowChrome = !meta.bare && !isPlainOrOutput && !isShortUntitled

    if (language) {
        const label = meta.title ?? (meta.output ? "Output" : language.label)
        const prismLanguage = resolvePrismLanguage(language.highlighterLanguage)
        const frameClassName = meta.compact
            ? "-mt-4 mb-5 rounded-xl overflow-hidden border [border-color:var(--reading-border)] shadow-sm shadow-black/5"
            : "my-7 rounded-xl overflow-hidden border [border-color:var(--reading-border)] shadow-sm shadow-black/5"

        return (
            <div
                className={frameClassName}
                data-code-output={meta.output ? "true" : undefined}
                data-compact-code={isShortUntitled && !isCollapsible ? "true" : undefined}
                data-print-code
            >
                {!meta.bare && (
                    <div
                        className={showWindowChrome
                            ? "flex items-center gap-2.5 px-4 py-2 border-b [border-color:var(--reading-border)] [background:var(--reading-code-header)]"
                            : "flex items-center justify-between gap-2 px-4 py-1.5 border-b [border-color:var(--reading-border)]/70 [background:var(--reading-code-header)]/65"}
                        data-print-code-header
                    >
                        {showWindowChrome && (
                            <div aria-hidden="true" className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/55" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/55" />
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/55" />
                            </div>
                        )}
                        <span className={showWindowChrome
                            ? "min-w-0 flex-1 truncate text-xs font-semibold font-mono [color:var(--reading-heading)] md:text-sm"
                            : "min-w-0 flex-1 truncate text-xs font-semibold font-mono [color:var(--reading-muted)]"}>
                            {label}
                        </span>
                        {isCollapsible && (
                            <span data-print-hidden className="hidden text-[11px] font-mono [color:var(--reading-subtle)] sm:inline">
                                {lineCount} lines
                            </span>
                        )}
                        <CodeCopyButton code={codeString} />
                    </div>
                )}
                <div className={isCollapsible && !expanded ? "relative max-h-[28rem] overflow-hidden print:max-h-none print:overflow-visible" : "relative"}>
                    <DeferredCodeContent
                        code={codeString}
                        language={prismLanguage}
                        label={label}
                        isDark={isDark}
                        printAware
                        showLineNumbers={Boolean(prismLanguage) && !meta.output && !isShortUntitled}
                        className={isShortUntitled
                            ? "max-w-full overflow-x-auto px-5 py-3.5 text-[0.85rem] leading-[1.7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50 md:text-[0.95rem]"
                            : "max-w-full overflow-x-auto p-5 text-[0.85rem] leading-[1.7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50 md:text-[0.95rem]"}
                        style={{
                            margin: 0,
                            background: "var(--reading-code-bg)",
                            colorScheme: isDark ? "dark" : "light",
                            fontFamily: CODE_FONT_FAMILY,
                            lineHeight: "1.7",
                            textShadow: "none",
                        }}
                        codeStyle={{ fontFamily: CODE_FONT_FAMILY, textShadow: "none" }}
                        lineNumberStyle={{
                            minWidth: "2.5em",
                            paddingRight: "1em",
                            color: "light-dark(rgba(0,0,0,0.28), rgba(255,255,255,0.24))",
                            userSelect: "none",
                            fontSize: "0.8rem",
                        }}
                        lineNumberClassName="leading-[calc(1.7*0.85rem)] md:leading-[calc(1.7*0.95rem)] max-[640px]:text-[0.8125rem] max-[640px]:leading-[calc(1.65*0.8125rem)] print:text-[8.5pt] print:leading-[1.45]"
                    />
                    {isCollapsible && !expanded && (
                        <div
                            data-print-hidden
                            className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center bg-gradient-to-t from-[var(--reading-code-bg)] via-[var(--reading-code-bg)]/90 to-transparent pt-16 pb-3 print:hidden"
                        >
                            <button
                                type="button"
                                onClick={() => setExpanded(true)}
                                className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border [border-color:var(--reading-border)] [background:var(--reading-panel-solid)] px-3.5 py-1.5 font-sans text-xs font-medium [color:var(--reading-heading)] shadow-sm transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                            >
                                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                                Show all {lineCount} lines
                            </button>
                        </div>
                    )}
                </div>
                {isCollapsible && expanded && (
                    <div
                        data-print-hidden
                        className="flex justify-center border-t [border-color:var(--reading-border)]/70 [background:var(--reading-code-header)]/65 py-2 print:hidden"
                    >
                        <button
                            type="button"
                            onClick={() => setExpanded(false)}
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-xs font-medium [color:var(--reading-muted)] transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        >
                            <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                            Collapse code
                        </button>
                    </div>
                )}
            </div>
        )
    }
    return (
        <div
            className="my-7 rounded-xl overflow-hidden border [border-color:var(--reading-border)] shadow-sm shadow-black/5"
            data-compact-code={isShortUntitled && !isCollapsible ? "true" : undefined}
            data-print-code
        >
            {!meta.bare && (
                <div
                    className="flex items-center justify-end gap-2 px-4 py-1.5 border-b [border-color:var(--reading-border)]/70 [background:var(--reading-code-header)]/65"
                    data-print-code-header
                >
                    <CodeCopyButton code={codeString} />
                </div>
            )}
            <div className={isCollapsible && !expanded ? "relative max-h-[28rem] overflow-hidden print:max-h-none print:overflow-visible" : "relative"}>
                <pre tabIndex={0} role="region" aria-label="Code block" className="p-5 overflow-x-auto [background:var(--reading-code-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50">
                    <code className="text-sm font-mono leading-relaxed [color:var(--reading-ink)]">
                        {codeString}
                    </code>
                </pre>
                {isCollapsible && !expanded && (
                    <div
                        data-print-hidden
                        className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center bg-gradient-to-t from-[var(--reading-code-bg)] via-[var(--reading-code-bg)]/90 to-transparent pt-16 pb-3 print:hidden"
                    >
                        <button
                            type="button"
                            onClick={() => setExpanded(true)}
                            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border [border-color:var(--reading-border)] [background:var(--reading-panel-solid)] px-3.5 py-1.5 font-sans text-xs font-medium [color:var(--reading-heading)] shadow-sm transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        >
                            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                            Show all {lineCount} lines
                        </button>
                    </div>
                )}
            </div>
            {isCollapsible && expanded && (
                <div
                    data-print-hidden
                    className="flex justify-center border-t [border-color:var(--reading-border)]/70 [background:var(--reading-code-header)]/65 py-2 print:hidden"
                >
                    <button
                        type="button"
                        onClick={() => setExpanded(false)}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-xs font-medium [color:var(--reading-muted)] transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                        <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                        Collapse code
                    </button>
                </div>
            )}
        </div>
    )
}

export function MarkdownImage(props: ImgHTMLAttributes<HTMLImageElement> & {
    "data-themed-image"?: string
    "data-dark-src"?: string
    "data-light-src"?: string
    "data-natural-width"?: string
    "data-dark-width"?: string
    "data-dark-height"?: string
    "data-dark-natural-width"?: string
    "data-light-width"?: string
    "data-light-height"?: string
    "data-light-natural-width"?: string
}) {
    const isDark = useContentDarkTheme()

    const { src, alt, className, width, height } = props
    if (typeof src !== "string" || !src) return null
    const darkSrc = props["data-dark-src"]
    const lightSrc = props["data-light-src"]
    const isThemed = props["data-themed-image"] === "true" && Boolean(darkSrc || lightSrc)
    const activeSrc = isThemed
        ? (isDark ? darkSrc ?? lightSrc : lightSrc ?? darkSrc) ?? src
        : src
    const activeWidth = isThemed
        ? (isDark ? props["data-dark-width"] : props["data-light-width"]) ?? width
        : width
    const activeHeight = isThemed
        ? (isDark ? props["data-dark-height"] : props["data-light-height"]) ?? height
        : height
    const displayWidth = typeof activeWidth === "number" ? activeWidth : Number(activeWidth)
    const displayHeight = typeof activeHeight === "number" ? activeHeight : Number(activeHeight)
    const reservedWidth = isThemed
        && Number.isFinite(displayWidth)
        && displayWidth > 0
        && Number.isFinite(displayHeight)
        && displayHeight > 0
        ? Math.min(
            displayWidth,
            Math.round(MAX_CONTENT_IMAGE_HEIGHT_PX * displayWidth / displayHeight),
        )
        : undefined
    const activeNaturalWidth = isThemed
        ? (isDark
            ? props["data-dark-natural-width"] ?? props["data-light-natural-width"]
            : props["data-light-natural-width"] ?? props["data-dark-natural-width"])
            ?? props["data-natural-width"]
        : props["data-natural-width"]
    const responsiveProps = getResponsiveContentImageProps(
        typeof activeSrc === "string" ? activeSrc : undefined,
        activeNaturalWidth ? Number(activeNaturalWidth) : undefined,
        "(max-width: 768px) 100vw, 768px",
    )
    const baseClasses = isThemed
        ? "mx-auto h-auto"
        : "mx-auto rounded-xl border [border-color:var(--reading-border)] shadow-lg h-auto"
    const allClasses = className
        ? `${baseClasses} ${className}`
        : baseClasses

    // Use width/height as intrinsic sizing hints for layout stability,
    // but always constrain to container width to prevent clipping.
    const image = (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={activeSrc}
            alt={alt || ""}
            className={allClasses}
            width={activeWidth}
            height={activeHeight}
            data-themed-image={isThemed ? "true" : undefined}
            data-dark-src={darkSrc}
            data-light-src={lightSrc}
            data-natural-width={props["data-natural-width"]}
            data-dark-width={props["data-dark-width"]}
            data-dark-height={props["data-dark-height"]}
            data-dark-natural-width={props["data-dark-natural-width"]}
            data-light-width={props["data-light-width"]}
            data-light-height={props["data-light-height"]}
            data-light-natural-width={props["data-light-natural-width"]}
            {...responsiveProps}
            style={{
                width: reservedWidth ? "100%" : "auto",
                maxWidth: "100%",
                height: "auto",
                maxHeight: `${MAX_CONTENT_IMAGE_HEIGHT_PX}px`,
            }}
            loading="lazy"
        />
    )

    const inlineImage = isThemed
        ? (
            <picture
                className="flex max-w-full justify-center"
                data-themed-picture="true"
                style={reservedWidth ? { width: `min(100%, ${reservedWidth}px)` } : undefined}
            >
                <source
                    srcSet={responsiveProps.srcSet ?? activeSrc}
                    sizes={responsiveProps.sizes}
                />
                {image}
            </picture>
        )
        : image

    return (
        <IllustrationViewer
            src={activeSrc}
            alt={alt || ""}
            displayWidth={activeWidth}
            displayHeight={activeHeight}
        >
            {inlineImage}
        </IllustrationViewer>
    )
}
