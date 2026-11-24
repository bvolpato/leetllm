"use client"

import { isValidElement, useEffect, useId, useRef, useState, type CSSProperties, type FocusEvent as ReactFocusEvent, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import Link from "next/link"
import { CopyMarkdownButton } from "@/components/copy-markdown-button"
import dynamic from "next/dynamic"
import { getGlossarySummary, useGlossaryEntry } from "@/lib/glossary-client"
import { getGlossaryImportanceLevel } from "@/lib/glossary-importance"
import { getGlossaryPreviewMarkdown, glossaryPreviewStartsWithTitle } from "@/lib/glossary-preview"

const GlossaryMarkdown = dynamic(
    () => import("@/components/glossary-markdown").then((module) => module.GlossaryMarkdown),
    { loading: () => <p>Loading definition...</p> },
)

type GlossaryTermProps = {
    id: string
    children?: ReactNode
}

function getVisibleText(node: ReactNode): string {
    if (typeof node === "string" || typeof node === "number" || typeof node === "bigint") {
        return String(node)
    }
    if (Array.isArray(node)) return node.map(getVisibleText).filter(Boolean).join(" ")
    if (isValidElement<{ children?: ReactNode; alt?: string; "aria-label"?: string; "aria-hidden"?: boolean | "true" | "false" }>(node)) {
        if (node.props["aria-hidden"] === true || node.props["aria-hidden"] === "true") return ""
        const visibleChildren = getVisibleText(node.props.children)
        return visibleChildren || node.props["aria-label"] || node.props.alt || ""
    }
    return ""
}

function GlossarySection({
    title,
    content,
    entryId,
    onGlossaryLink,
}: {
    title: string
    content?: string
    entryId?: string
    onGlossaryLink?: (id: string) => void
}) {
    if (!content) return null

    return (
        <section>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider [color:var(--reading-muted)]">{title}</h4>
            <GlossaryMarkdown content={content} entryId={entryId} onGlossaryLink={onGlossaryLink} />
        </section>
    )
}

function ImportancePill({ importance }: { importance: number }) {
    const level = getGlossaryImportanceLevel(importance)

    return (
        <span
            className={[
                "inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
                level.className,
            ].join(" ")}
            aria-label={`Importance: ${level.label}`}
        >
            {level.label}
        </span>
    )
}

export function GlossaryTerm({ id, children }: GlossaryTermProps) {
    const entry = getGlossarySummary(id)
    const [activeId, setActiveId] = useState<string | null>(null)
    const [open, setOpen] = useState(false)
    const [tooltipOpen, setTooltipOpen] = useState(false)
    const [tooltipStyle, setTooltipStyle] = useState<CSSProperties | null>(null)
    const [dialogHost, setDialogHost] = useState<HTMLElement | null>(null)
    const triggerRef = useRef<HTMLSpanElement>(null)
    const titleId = useId()
    const tooltipId = useId()
    const dialogId = activeId ?? id
    const activeSummary = getGlossarySummary(dialogId) ?? entry
    const { entry: previewEntry, error: previewError } = useGlossaryEntry(id, tooltipOpen && !open)
    const { entry: activeEntry, error, retry } = useGlossaryEntry(dialogId, open)

    useEffect(() => {
        if (!open) return

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setOpen(false)
            }
        }

        window.addEventListener("keydown", onKeyDown)
        return () => {
            document.body.style.overflow = previousOverflow
            window.removeEventListener("keydown", onKeyDown)
        }
    }, [open])

    useEffect(() => {
        if (!tooltipOpen || open) return

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
    }, [open, tooltipOpen])

    if (!entry) {
        return <span title={`Missing glossary entry: ${id}`}>{children}</span>
    }

    function hasActiveTextSelection() {
        const selection = window.getSelection()?.toString() ?? ""
        return selection.trim().length > 0
    }

    function openDialog() {
        setActiveId(id)
        setDialogHost(triggerRef.current?.closest<HTMLElement>('[data-slot="sheet-content"]') ?? null)
        setTooltipOpen(false)
        setOpen(true)
    }

    function openGlossaryLink(targetId: string) {
        setActiveId(targetId)
        setTooltipOpen(false)
        setOpen(true)
    }

    function handleBlur(event: ReactFocusEvent<HTMLElement>) {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
        setTooltipOpen(false)
    }

    function handleLabelClick() {
        if (hasActiveTextSelection()) return
        openDialog()
    }

    function handleLabelKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
        if (event.key !== "Enter" && event.key !== " ") return
        event.preventDefault()
        openDialog()
    }

    const label = children ?? entry.title
    const visibleLabel = getVisibleText(label).trim() || entry.title
    const accessibleLabel = visibleLabel.toLowerCase() === entry.title.trim().toLowerCase()
        ? `Open definition for ${entry.title}`
        : `Open definition for ${entry.title}: ${visibleLabel}`
    const labelClass = entry.kind === "code" ? "font-mono text-[0.95em]" : ""
    const previewStartsWithTitle = previewEntry && glossaryPreviewStartsWithTitle(previewEntry.definition, entry.title)

    return (
        <>
            <span
                data-glossary-term={id}
                onMouseEnter={() => setTooltipOpen(true)}
                onMouseLeave={() => setTooltipOpen(false)}
                onFocusCapture={() => setTooltipOpen(true)}
                onBlurCapture={handleBlur}
                className="inline select-text"
            >
                <span
                    ref={triggerRef}
                    role="button"
                    tabIndex={0}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    aria-describedby={tooltipOpen && !open ? tooltipId : undefined}
                    aria-label={accessibleLabel}
                    onClick={handleLabelClick}
                    onKeyDown={handleLabelKeyDown}
                    className="cursor-help rounded-sm underline decoration-dotted decoration-muted-foreground/45 decoration-1 underline-offset-[0.24em] transition-[color,text-decoration-color] hover:text-primary hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                    <span className={labelClass}>{label}</span>
                </span>
            </span>
            {tooltipOpen && !open && tooltipStyle && createPortal(
                <div
                    id={tooltipId}
                    role="tooltip"
                    data-glossary-tooltip={id}
                    style={tooltipStyle}
                    className="pointer-events-none z-[70] rounded-lg border [border-color:var(--reading-border)] [background:var(--reading-panel-solid)] p-3 text-left text-sm leading-relaxed [color:var(--reading-ink)] shadow-xl shadow-black/20"
                >
                    {!previewStartsWithTitle && (
                        <p className="mb-2 font-semibold [color:var(--reading-heading)]">{entry.title}</p>
                    )}
                    {previewEntry ? (
                        <GlossaryMarkdown
                            content={getGlossaryPreviewMarkdown(previewEntry.definition)}
                            entryId={id}
                            className="text-sm [&>p]:m-0"
                        />
                    ) : <p>{previewError ? "Preview unavailable. Click to retry the definition." : "Loading definition..."}</p>}
                    <p className="mt-3 rounded-md border border-primary/25 bg-primary/10 px-2 py-1.5 text-xs font-medium text-primary">
                        Click for deeper explanation, examples, code, and where it appears.
                    </p>
                </div>,
                document.body,
            )}
            {open && activeSummary && createPortal(
                <div
                    className={`${dialogHost ? "absolute" : "fixed"} inset-0 z-[80] flex items-center justify-center px-4 py-6`}
                    data-glossary-dialog={dialogId}
                >
                    <button
                        type="button"
                        aria-label="Close glossary definition"
                        className="absolute inset-0 bg-black/60"
                        onClick={() => setOpen(false)}
                    />
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={titleId}
                        className="relative z-10 max-h-[min(84vh,760px)] w-full max-w-2xl overflow-y-auto rounded-xl border [border-color:var(--reading-border)] [background:var(--reading-panel-solid)] p-5 shadow-2xl shadow-black/30 sm:p-6"
                    >
                        <div className="mb-4 flex items-start gap-4">
                            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                                <h3 id={titleId} className="text-lg font-semibold [color:var(--reading-heading)]">
                                    {activeSummary.title}
                                </h3>
                                <ImportancePill importance={activeSummary.importance} />
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <CopyMarkdownButton
                                    slug={dialogId}
                                    label="Copy"
                                    ariaLabel="Copy as markdown"
                                    className="border-[color:var(--reading-border)] [background:transparent] [color:var(--reading-muted)] hover:bg-primary/10 hover:[color:var(--reading-ink)]"
                                />
                                <button
                                    type="button"
                                    aria-label="Close glossary definition"
                                    onClick={() => setOpen(false)}
                                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border [border-color:var(--reading-border)] [color:var(--reading-muted)] transition-colors hover:bg-primary/10 hover:[color:var(--reading-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {activeSummary.aliases?.length ? (
                            <p className="mb-4 text-xs [color:var(--reading-muted)]">
                                Also known as {activeSummary.aliases.join(", ")}.
                            </p>
                        ) : null}

                        <div className="space-y-4 text-sm leading-relaxed [color:var(--reading-ink)]">
                            {activeEntry ? <>
                            <GlossarySection
                                title="Definition"
                                content={activeEntry.definition}
                                entryId={dialogId}
                                onGlossaryLink={openGlossaryLink}
                            />
                            <GlossarySection
                                title="Intuition"
                                content={activeEntry.intuition}
                                entryId={dialogId}
                                onGlossaryLink={openGlossaryLink}
                            />
                            <GlossarySection
                                title="Example"
                                content={activeEntry.example}
                                entryId={dialogId}
                                onGlossaryLink={openGlossaryLink}
                            />
                            <GlossarySection
                                title="Formula"
                                content={activeEntry.formula}
                                entryId={dialogId}
                                onGlossaryLink={openGlossaryLink}
                            />
                            {activeEntry.details?.map((detail) => (
                                <GlossarySection
                                    key={`${dialogId}-${detail.title}`}
                                    title={detail.title}
                                    content={detail.content}
                                    entryId={dialogId}
                                    onGlossaryLink={openGlossaryLink}
                                />
                            ))}
                            <GlossarySection
                                title="Decision rule"
                                content={activeEntry.decisionRule}
                                entryId={dialogId}
                                onGlossaryLink={openGlossaryLink}
                            />
                            <GlossarySection
                                title="Common mistake"
                                content={activeEntry.pitfall}
                                entryId={dialogId}
                                onGlossaryLink={openGlossaryLink}
                            />
                            <GlossarySection
                                title="Why it matters here"
                                content={activeEntry.relevance}
                                entryId={dialogId}
                                onGlossaryLink={openGlossaryLink}
                            />
                            {activeEntry.seeAlso && (
                                <section>
                                    <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider [color:var(--reading-muted)]">Related terms</h4>
                                    <GlossaryMarkdown
                                        content={activeEntry.seeAlso}
                                        entryId={dialogId}
                                        onGlossaryLink={openGlossaryLink}
                                    />
                                </section>
                            )}
                            {activeEntry.usage && activeEntry.usage.length > 0 && (
                                <section>
                                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider [color:var(--reading-muted)]">Where it appears</h4>
                                    <div className="space-y-3">
                                        {activeEntry.usage.map((item) => (
                                            <div
                                                key={`${item.url}-${item.excerpt}`}
                                                className="block rounded-lg border [border-color:var(--reading-border)] bg-black/5 px-3 py-2 transition-colors hover:border-primary/30 hover:bg-primary/5"
                                            >
                                                <Link
                                                    href={item.url}
                                                    className="text-sm font-medium text-primary hover:text-primary/80"
                                                    onClick={() => setOpen(false)}
                                                >
                                                    {item.title}
                                                </Link>
                                                <GlossaryMarkdown
                                                    content={item.excerpt}
                                                    entryId={dialogId}
                                                    onGlossaryLink={openGlossaryLink}
                                                    className="mt-1 text-sm [color:var(--reading-ink)] [&>blockquote]:m-0 [&>blockquote]:border-l [&>blockquote]:border-primary/35 [&>blockquote]:pl-3 [&>p]:m-0 [&>ul]:m-0 [&>ul]:list-disc [&>ul]:pl-5"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                            {activeEntry.code &&
                                ![
                                    activeEntry.definition,
                                    activeEntry.example,
                                    activeEntry.formula,
                                    activeEntry.intuition,
                                    activeEntry.decisionRule,
                                    activeEntry.pitfall,
                                    activeEntry.relevance,
                                    ...(activeEntry.details?.map((detail) => detail.content) ?? []),
                                ]
                                    .filter(Boolean)
                                    .some((section) => section!.includes("```")) && (
                                <section>
                                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider [color:var(--reading-muted)]">Code example</h4>
                                    <GlossaryMarkdown
                                        entryId={dialogId}
                                        content={`\`\`\`${activeEntry.code.language} title="${activeEntry.code.title}"\n${activeEntry.code.source.trimEnd()}\n\`\`\``}
                                    />
                                </section>
                            )}
                            </> : error ? (
                                <div role="alert">
                                    <p>{error}</p>
                                    <button type="button" onClick={retry} className="mt-2 text-primary underline">Try again</button>
                                </div>
                            ) : <p role="status">Loading definition...</p>}
                        </div>
                    </section>
                </div>,
                dialogHost ?? document.body,
            )}
        </>
    )
}
