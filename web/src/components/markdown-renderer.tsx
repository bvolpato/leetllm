"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"
import "katex/dist/katex.min.css"
import { useMemo } from "react"
import { CheckpointAccordion } from "./checkpoint-accordion"
import { MarkdownBody } from "./markdown-body"
import { createMarkdownComponents, encodeMarkdownCodeFenceMeta } from "./markdown-components"

export { headingPlainText, resolveCodeFenceLanguage, slugifyHeading, uniqueHeadingId } from "./markdown-components"

interface MarkdownRendererProps {
    content: string
    personalizationSlug?: string
    showTableOfContents?: boolean
    hideInlineTocOnDesktop?: boolean
}

export function MarkdownRenderer({
    content,
    personalizationSlug,
    showTableOfContents = false,
    hideInlineTocOnDesktop = false,
}: MarkdownRendererProps) {
    const markdownComponents = createMarkdownComponents({
        personalizationSlug,
        renderCheckpoint: (question, answer) => <CheckpointAccordion question={question} answer={answer} />,
    })
    const encodedContent = useMemo(() => encodeMarkdownCodeFenceMeta(content), [content])
    return (
        <MarkdownBody
            contentKey={content}
            showTableOfContents={showTableOfContents}
            hideInlineTocOnDesktop={hideInlineTocOnDesktop}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeRaw]}
                components={markdownComponents}
                urlTransform={(url) => url}
            >
                {encodedContent}
            </ReactMarkdown>
        </MarkdownBody>
    )
}
