import "server-only"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"
import "katex/dist/katex.min.css"
import { CheckpointAccordionShell } from "./checkpoint-accordion-shell"
import { checkpointAnswerComponents, checkpointQuestionComponents } from "./checkpoint-content-components"
import { MarkdownBody } from "./markdown-body"
import { createMarkdownComponents, encodeMarkdownCodeFenceMeta, uniqueHeadingId } from "./markdown-components"
import type { HeadingEntry } from "./lesson-table-of-contents"

interface MarkdownTreeNode {
    type: string
    tagName?: string
    value?: string
    properties?: Record<string, unknown>
    children?: MarkdownTreeNode[]
}

const REPLACED_ATTRIBUTE_TAGS = new Set([
    "h1", "h2", "h3", "h4", "p", "ul", "ol", "li", "table", "thead", "th", "td", "tr",
    "blockquote", "details", "summary", "strong", "em", "figure", "figcaption", "a", "code", "pre", "img",
])

function retainsAttributes(node: MarkdownTreeNode) {
    if (REPLACED_ATTRIBUTE_TAGS.has(node.tagName ?? "")) return false
    if (node.tagName === "span" && typeof node.properties?.dataGlossary === "string") return false
    if (node.tagName === "div" && typeof node.properties?.dataCallout === "string") return false
    return true
}

function markdownTreeText(node: MarkdownTreeNode, accessible = false): string {
    if (accessible && retainsAttributes(node) && String(node.properties?.ariaHidden) === "true") return ""
    if (node.type === "text") return node.value ?? ""
    return node.children?.map((child) => markdownTreeText(child, accessible)).join("") ?? ""
}

function collectInitialHeadings(tree: MarkdownTreeNode, headings: HeadingEntry[]) {
    const seen = new Map<string, number>()

    function visit(node: MarkdownTreeNode, excluded = false) {
        const props = node.properties ?? {}
        if ((node.tagName === "figure" && props.dataAnimatedIllustration)
            || (node.tagName === "div" && (typeof props.dataAnimatedIllustration === "string"
                || props.dataLiveIllustration === "speculative-decoding-animated"))) return

        const hidden = excluded || (retainsAttributes(node) && (
            props.dataLessonTocExclude !== undefined
            || props.dataPrintOnly !== undefined
            || (props.hidden !== undefined && props.hidden !== false)
            || String(props.ariaHidden) === "true"
        ))
        if (/^h[1-4]$/.test(node.tagName ?? "")) {
            const preferredId = typeof props.id === "string" ? props.id : undefined
            const id = uniqueHeadingId(markdownTreeText(node), seen, preferredId)
            const title = markdownTreeText(node, true).trim()
            const level = Number(node.tagName?.slice(1))
            if (!hidden && title && (level === 2 || level === 3)) headings.push({ id, title, level })
        }

        const childExcluded = hidden || (node.tagName === "details" && !props.open)
        for (const child of node.children ?? []) visit(child, childExcluded)
    }

    visit(tree)
}

export function ServerMarkdownRenderer({
    content,
    contentKey,
    showTableOfContents = false,
    hideInlineTocOnDesktop = false,
}: {
    content: string
    contentKey: string
    showTableOfContents?: boolean
    hideInlineTocOnDesktop?: boolean
}) {
    const components = createMarkdownComponents({
        renderCheckpoint: (question, answer) => (
            <CheckpointAccordionShell
                question={(
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]} components={checkpointQuestionComponents}>
                        {question}
                    </ReactMarkdown>
                )}
                answer={(
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]} components={checkpointAnswerComponents}>
                        {answer}
                    </ReactMarkdown>
                )}
            />
        ),
    })

    const initialHeadings: HeadingEntry[] = []
    const markdown = ReactMarkdown({
        children: encodeMarkdownCodeFenceMeta(content),
        remarkPlugins: [remarkGfm, remarkMath],
        rehypePlugins: [rehypeKatex, rehypeRaw, () => (tree: MarkdownTreeNode) => {
            if (showTableOfContents) collectInitialHeadings(tree, initialHeadings)
        }],
        components,
        urlTransform: (url) => url,
    })

    return (
        <MarkdownBody
            contentKey={contentKey}
            showTableOfContents={showTableOfContents}
            hideInlineTocOnDesktop={hideInlineTocOnDesktop}
            initialHeadings={initialHeadings}
        >
            {markdown}
        </MarkdownBody>
    )
}
