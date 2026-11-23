"use client"

import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"
import { GlossaryMarkdownSpan } from "./glossary-markdown-span"

export { GlossaryMarkdownSpan } from "./glossary-markdown-span"

export function InlineMarkdown({ children }: { children: string }) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex, rehypeRaw]}
            components={{
                p: ({ children: markdownChildren }) => <>{markdownChildren}</>,
                span: GlossaryMarkdownSpan,
            }}
        >
            {children}
        </ReactMarkdown>
    )
}
