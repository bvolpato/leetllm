import type { ReactNode } from "react"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"
import { GlossaryMarkdownSpan } from "./glossary-markdown-span"
import type { MasteryQuizQuestion } from "@/lib/mastery-quiz"

export interface RenderedMasteryQuestionNodes {
    question: ReactNode
    options: Record<string, ReactNode>
    answer: ReactNode
    explanation: ReactNode
}

export function ServerInlineMarkdown({ children }: { children: string }) {
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

export function renderMasteryQuizNodes(
    questions: MasteryQuizQuestion[],
): RenderedMasteryQuestionNodes[] {
    return questions.map((question) => {
        const options: Record<string, ReactNode> = {}
        for (const option of question.options) {
            options[option] = <ServerInlineMarkdown>{option}</ServerInlineMarkdown>
        }
        return {
            question: <ServerInlineMarkdown>{question.question}</ServerInlineMarkdown>,
            options,
            answer: <ServerInlineMarkdown>{question.answer}</ServerInlineMarkdown>,
            explanation: <ServerInlineMarkdown>{question.explanation}</ServerInlineMarkdown>,
        }
    })
}
