import type { Components } from "react-markdown"
import { GlossaryMarkdownSpan } from "./glossary-markdown-span"

export const checkpointQuestionComponents: Components = {
    p: ({ children }) => <>{children}</>,
    span: GlossaryMarkdownSpan,
}

export const checkpointAnswerComponents: Components = {
    p: ({ children }) => <p className="text-sm [color:var(--reading-ink)] leading-[1.74] mb-3 last:mb-0">{children}</p>,
    strong: ({ children }) => <strong className="[color:var(--reading-heading)] font-semibold">{children}</strong>,
    code: ({ children }) => (
        <code className="px-1.5 py-0.5 rounded text-[0.85em] font-mono border [background:var(--reading-code-inline-bg)] [color:var(--reading-code-inline-ink)] [border-color:var(--reading-code-inline-border)]">
            {children}
        </code>
    ),
    span: GlossaryMarkdownSpan,
}
