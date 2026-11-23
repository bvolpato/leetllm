import { Children, isValidElement, useId, type AnchorHTMLAttributes, type HTMLAttributes, type ReactNode } from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { ChevronDown, Link2 } from "lucide-react"
import { AnimatedIllustration } from "./animated-illustration"
import { SpeculativeDecodingAnimation } from "./illustrations/speculative-decoding-animated"
import { PersonalizedMermaidDiagram } from "./personalized-mermaid-diagram"
import { PersonalizedVizmaticDiagram } from "./personalized-vizmatic-diagram"
import { ContentCallout } from "./content-callout"
import { GlossaryMarkdownSpan } from "./glossary-markdown-span"
import { MarkdownCodeBlock, MarkdownImage } from "./markdown-interactive"
import { resolvePrismLanguage } from "./prism-language"

const CODE_META_SEPARATOR = "__meta_"

function encodeCodeFenceMeta(meta: string) {
    return Array.from(meta)
        .map((char) => char.charCodeAt(0).toString(16).padStart(4, "0"))
        .join("")
}

function decodeCodeFenceMeta(encoded: string) {
    const chars: string[] = []
    for (let index = 0; index < encoded.length; index += 4) {
        chars.push(String.fromCharCode(Number.parseInt(encoded.slice(index, index + 4), 16)))
    }
    return chars.join("")
}

export function encodeMarkdownCodeFenceMeta(content: string) {
    let activeFenceLength = 0

    return content
        .split("\n")
        .map((line) => {
            const fence = line.match(/^(`{3,})([^`\s]+)(.*)$/)
            if (!activeFenceLength && fence) {
                activeFenceLength = fence[1].length
                const meta = fence[3].trim()
                if (!meta) {
                    return line
                }
                return `${fence[1]}${fence[2]}${CODE_META_SEPARATOR}${encodeCodeFenceMeta(meta)}`
            }

            const closingFence = line.match(/^(`{3,})\s*$/)
            if (activeFenceLength && closingFence && closingFence[1].length >= activeFenceLength) {
                activeFenceLength = 0
            }

            return line
        })
        .join("\n")
}

function splitRenderedCodeFenceLanguage(rawLanguage: string) {
    const separatorIndex = rawLanguage.indexOf(CODE_META_SEPARATOR)
    if (separatorIndex === -1) {
        return {
            language: rawLanguage,
            meta: undefined,
        }
    }

    return {
        language: rawLanguage.slice(0, separatorIndex),
        meta: decodeCodeFenceMeta(rawLanguage.slice(separatorIndex + CODE_META_SEPARATOR.length)),
    }
}

export function resolveCodeFenceLanguage(rawLanguage: string) {
    const { language } = splitRenderedCodeFenceLanguage(rawLanguage)
    const label = language.replace(/^\./, "").toLowerCase()

    return {
        label,
        highlighterLanguage: resolvePrismLanguage(label) ?? label,
    }
}

type CodeFenceMeta = {
    bare: boolean
    compact: boolean
    output: boolean
    title?: string
}

type ReferenceCitationLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
    children?: ReactNode
    node?: unknown
    "data-reference-title"?: string
    "data-reference-url"?: string
    "data-reference-number"?: string
}

function ReferenceCitationLink({
    children,
    href,
    node,
    className,
    ...props
}: ReferenceCitationLinkProps) {
    void node
    const title = props["data-reference-title"] ?? "Reference"
    const url = props["data-reference-url"] ?? href ?? ""
    const number = props["data-reference-number"]
    const label = typeof props["aria-label"] === "string"
        ? props["aria-label"]
        : `Open reference${number ? ` ${number}` : ""}: ${title}`

    return (
        <a
            {...props}
            href={href ?? url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className={[
                "relative inline-flex border-b border-dotted border-primary px-0.5 text-[0.75rem] font-semibold leading-none text-primary no-underline transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                className,
            ].filter(Boolean).join(" ")}
        >
            {children}
            <span
                aria-hidden="true"
                className="reference-tooltip pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-md border [border-color:var(--reading-border)] [background:var(--reading-panel-solid)] p-3 text-left font-sans text-xs font-normal leading-snug [color:var(--reading-ink)] shadow-xl shadow-black/20"
            >
                <span className="block text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
                    Reference{number ? ` ${number}` : ""}
                </span>
                <span className="mt-1 block text-sm font-semibold [color:var(--reading-heading)]">
                    {title}
                </span>
                <span className="mt-1 block break-all font-mono text-[0.68rem] [color:var(--reading-subtle)]">
                    {url}
                </span>
            </span>
        </a>
    )
}

function parseCodeFenceMetaValue(rawMeta: string): CodeFenceMeta {
    const meta: CodeFenceMeta = {
        bare: false,
        compact: false,
        output: false,
    }
    const tokenPattern = /([A-Za-z][A-Za-z0-9_-]*)(?:=(?:"([^"]*)"|'([^']*)'|([^\s]+)))?/g

    for (const match of rawMeta.matchAll(tokenPattern)) {
        const key = match[1].toLowerCase()
        const value = match[2] ?? match[3] ?? match[4]

        if (key === "bare" || key === "noheader") {
            meta.bare = true
        } else if (key === "compact") {
            meta.compact = true
        } else if (key === "output") {
            meta.output = true
            meta.compact = true
        } else if ((key === "title" || key === "filename") && value) {
            meta.title = value
        }
    }

    return meta
}

export function headingPlainText(node: ReactNode): string {
    if (node == null || typeof node === "boolean") return ""
    if (typeof node === "string" || typeof node === "number") return String(node)
    if (Array.isArray(node)) return node.map(headingPlainText).join("")
    if (isValidElement<{ children?: ReactNode }>(node)) return headingPlainText(node.props.children)
    return ""
}

export function slugifyHeading(text: string): string {
    const slug = text
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/['’]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

    return slug || "section"
}

export function uniqueHeadingId(text: string, seen: Map<string, number>, preferredId?: string): string {
    const base = preferredId?.trim() || slugifyHeading(text)
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    return count === 0 ? base : `${base}-${count}`
}

function AnchoredHeading({
    as: Tag,
    className,
    children,
    id: preferredId,
    seen,
}: {
    as: "h1" | "h2" | "h3" | "h4"
    className: string
    children: ReactNode
    id?: string
    seen: Map<string, number>
}) {
    const id = uniqueHeadingId(headingPlainText(children), seen, preferredId)
    const labelId = useId()

    return (
        <Tag id={id} className={className} aria-labelledby={labelId}>
            <span id={labelId}>{children}</span>
            <a
                href={`#${encodeURIComponent(id)}`}
                data-heading-anchor=""
                aria-labelledby={labelId}
                className="ml-2 inline-flex h-6 w-6 items-center justify-center align-middle text-inherit no-underline opacity-60 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 print:hidden"
            >
                <Link2 aria-hidden="true" className="h-4 w-4" />
            </a>
        </Tag>
    )
}

export function createMarkdownComponents({
    personalizationSlug,
    renderCheckpoint,
}: {
    personalizationSlug?: string
    renderCheckpoint: (question: string, answer: string) => ReactNode
}): Components {
    const headingIds = new Map<string, number>()

    return {
        pre({ children }) {
            return <>{children}</>
        },
        code({ className, children, ...props }) {
            const match = /language-([^\s]+)/.exec(className || "")
            const codeString = String(children).replace(/\n$/, "")
            if (match) {
                const language = resolveCodeFenceLanguage(match[1])
                if (language.label === "mermaid") return <PersonalizedMermaidDiagram chart={codeString} />
                if (language.label === "vizmatic") return <PersonalizedVizmaticDiagram source={codeString} lessonSlug={personalizationSlug} />
                if (language.label === "checkpoint") {
                    const parts = codeString.split(/^---+$/m)
                    const question = parts[0]?.trim() ?? ""
                    const answer = parts[1]?.trim() ?? ""
                    if (question && answer) {
                        return <div data-lesson-toc-exclude>{renderCheckpoint(question, answer)}</div>
                    }
                }
                const { meta: rawMeta } = splitRenderedCodeFenceLanguage(match[1])
                return <MarkdownCodeBlock code={codeString} language={language} meta={rawMeta ? parseCodeFenceMetaValue(rawMeta) : undefined} />
            }

            const isBlock = codeString.includes("\n") || (props.node?.position && props.node.position.start.line !== props.node.position.end.line)
            if (isBlock) return <MarkdownCodeBlock code={codeString} />
            return (
                <code className="px-1.5 py-0.5 rounded text-[0.85em] font-mono border [background:var(--reading-code-inline-bg)] [color:var(--reading-code-inline-ink)] [border-color:var(--reading-code-inline-border)]">
                    {children}
                </code>
            )
        },

        // Paragraphs
        p({ children }) {
            return (
                <p className="text-base [color:var(--reading-ink)] leading-[1.78] my-5">
                    {children}
                </p>
            )
        },

        // Lists
        ul({ children }) {
            return <ul className="list-disc marker:text-primary/75 space-y-2.5 my-5 pl-6">{children}</ul>
        },
        ol({ children }) {
            return <ol className="list-decimal marker:text-primary/75 marker:font-semibold space-y-2.5 my-5 pl-6">{children}</ol>
        },
        li({ children }) {
            return (
                <li className="pl-1 text-base [color:var(--reading-ink)] leading-[1.74]">
                    {children}
                </li>
            )
        },

        // Tables
        table({ children }) {
            return (
                <div
                    className="overflow-x-auto my-7 rounded-lg border [border-color:var(--reading-border)] shadow-sm shadow-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    role="region"
                    tabIndex={0}
                    aria-label="Lesson table"
                    data-print-table
                >
                    <table className="w-full text-sm">{children}</table>
                </div>
            )
        },
        thead({ children }) {
            return <thead className="border-b [background:var(--reading-panel-solid)] [border-color:var(--reading-border)]">{children}</thead>
        },
        th({ children }) {
            return (
                <th className="px-4 py-3 text-left text-xs font-semibold [color:var(--reading-heading)] uppercase tracking-wider">
                    {children}
                </th>
            )
        },
        td({ children }) {
            return (
                <td className="px-4 py-2.5 text-sm [color:var(--reading-ink)] border-b [border-color:var(--reading-border)]">
                    {children}
                </td>
            )
        },
        tr({ children }) {
            return <tr className="hover:bg-primary/[0.03] transition-colors">{children}</tr>
        },

        // Blockquotes
        blockquote({ children }) {
            return (
                <blockquote className="border-l-2 border-primary/60 pl-5 py-1 my-7 bg-primary/[0.045] rounded-r-lg pr-4">
                    {children}
                </blockquote>
            )
        },
        details({ children, open }) {
            const items = Children.toArray(children).filter((child) => typeof child !== "string" || child.trim() !== "")
            const [summary, ...body] = items

            return (
                <details open={open} className="group my-6 overflow-hidden rounded-lg border [border-color:var(--reading-border)] [background:var(--reading-panel-solid)] shadow-sm shadow-black/5">
                    {summary}
                    <div className="border-t px-4 py-4 [border-color:var(--reading-border)] sm:px-5 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&>div]:mb-4 [&>div]:mt-4 [&>div]:rounded-lg [&>div]:border [&>div]:shadow-sm">
                        {body}
                    </div>
                </details>
            )
        },
        summary({ children }) {
            return (
                <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold [color:var(--reading-heading)] [&::-webkit-details-marker]:hidden">
                    <span className="flex-1">{children}</span>
                    <ChevronDown className="h-4 w-4 [color:var(--reading-muted)] transition-transform group-open:rotate-180" />
                </summary>
            )
        },

        // Horizontal rules
        hr() {
            return <hr className="[border-color:var(--reading-border)] my-10" />
        },

        // Strong / em
        strong({ children }) {
            return <strong className="[color:var(--reading-heading)] font-semibold">{children}</strong>
        },
        em({ children }) {
            return <em className="[color:var(--reading-muted)] italic">{children}</em>
        },

        img({ node, ...props }) {
            void node
            const animation = (props as { "data-animated-illustration"?: string })["data-animated-illustration"]
            if (animation) return <AnimatedIllustration data={animation} />
            return <MarkdownImage {...props} />
        },
        figure(props: HTMLAttributes<HTMLElement> & {
            node?: unknown
            "data-animated-illustration"?: string
            "data-diagram-alt"?: string
        }) {
            const animData = props["data-animated-illustration"]
            const diagramAlt = props["data-diagram-alt"]
            const diagramCaption = diagramAlt?.replace(/^Diagram showing\s+/i, "")
            if (animData) {
                return (
                    <div className="my-9 w-full">
                        <AnimatedIllustration data={animData} />
                    </div>
                )
            }
            return (
                <figure className="my-9 flex w-full flex-col items-center gap-3">
                    {props.children}
                    {diagramCaption && diagramAlt !== "Diagram" && (
                        <figcaption className="max-w-2xl text-center text-sm italic leading-relaxed [color:var(--reading-subtle)]">
                            {diagramCaption}
                        </figcaption>
                    )}
                </figure>
            )
        },
        figcaption({ children }) {
            return (
                <figcaption className="text-sm [color:var(--reading-subtle)] text-center max-w-lg italic">
                    {Children.map(children, (child) => {
                        if (typeof child !== "string" || !child.includes("$")) return child
                        return <>
                            {/^\s/.test(child) ? " " : ""}
                            <ReactMarkdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                                components={{ p: ({ children: text }) => <>{text}</> }}
                            >{child.trim()}</ReactMarkdown>
                            {/\s$/.test(child) ? " " : ""}
                        </>
                    })}
                </figcaption>
            )
        },
        span: GlossaryMarkdownSpan,
        div(props: HTMLAttributes<HTMLDivElement> & {
            node?: unknown
            "data-animated-illustration"?: string
            "data-live-illustration"?: string
            "data-callout"?: string
            "data-callout-title"?: string
        }) {
            const animData = props["data-animated-illustration"]
            const liveId = props["data-live-illustration"]
            const calloutVariant = props["data-callout"]
            const calloutTitle = props["data-callout-title"]
            if (typeof calloutVariant === "string") {
                return (
                    <ContentCallout
                        variant={calloutVariant === "warning" || calloutVariant === "tip" || calloutVariant === "success" ? calloutVariant : "info"}
                        title={typeof calloutTitle === "string" ? calloutTitle : undefined}
                    >
                        {props.children}
                    </ContentCallout>
                )
            }
            if (typeof animData === "string") {
                return (
                    <div className="my-9 w-full">
                        <AnimatedIllustration data={animData} />
                    </div>
                )
            }
            if (liveId === 'speculative-decoding-animated') {
                return (
                    <div className="my-9 w-full">
                        <SpeculativeDecodingAnimation />
                    </div>
                )
            }
            const { node, ...rest } = props
            void node
            return <div {...rest} />
        },

        // Links open external URLs in a new tab; internal and same-page anchors
        // stay in place. Reference citations are external links with metadata.
        a(props: AnchorHTMLAttributes<HTMLAnchorElement> & { node?: unknown; "data-reference-link"?: string }) {
            const { children, href } = props
            if (props["data-reference-link"] === "true") {
                return <ReferenceCitationLink {...props}>{children}</ReferenceCitationLink>
            }

            const isAnchor = href?.startsWith('#')
            const isInternal = href?.startsWith('/') && !href?.startsWith('//')
            const isContentAsset = href?.startsWith('/api/content-asset/')

            if (isAnchor || isInternal) {
                return (
                    <a
                        href={href}
                        download={isContentAsset ? "" : undefined}
                        className="text-primary hover:text-primary/80 underline decoration-primary/35 underline-offset-4 transition-colors"
                    >
                        {children}
                    </a>
                )
            }
            return (
                <a
                    href={href}
                    className="text-primary hover:text-primary/80 underline decoration-primary/35 underline-offset-4 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {children}
                </a>
            )
        },
        h1({ children, id }) {
            return (
                <AnchoredHeading
                    as="h1"
                    id={id}
                    seen={headingIds}
                    className="text-2xl sm:text-[1.7rem] font-bold mt-12 mb-5 [color:var(--reading-heading)] tracking-tight leading-tight border-b [border-color:var(--reading-border)] pb-3"
                >
                    {children}
                </AnchoredHeading>
            )
        },
        h2({ children, id }) {
            return (
                <AnchoredHeading
                    as="h2"
                    id={id}
                    seen={headingIds}
                    className="text-xl sm:text-[1.45rem] font-bold mt-12 mb-4 [color:var(--reading-heading)] tracking-tight leading-tight"
                >
                    {children}
                </AnchoredHeading>
            )
        },
        h3({ children, id }) {
            return (
                <AnchoredHeading
                    as="h3"
                    id={id}
                    seen={headingIds}
                    className="text-lg sm:text-[1.18rem] font-semibold mt-9 mb-3 [color:var(--reading-heading)] leading-snug"
                >
                    {children}
                </AnchoredHeading>
            )
        },
        h4({ children, id }) {
            return (
                <AnchoredHeading
                    as="h4"
                    id={id}
                    seen={headingIds}
                    className="text-base font-semibold mt-7 mb-2 [color:var(--reading-heading)]"
                >
                    {children}
                </AnchoredHeading>
            )
        },
    }
}
