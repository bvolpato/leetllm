"use client"

import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"
import { InlineMarkdown } from "./inline-markdown"
import { CheckpointAccordionShell } from "./checkpoint-accordion-shell"
import { checkpointAnswerComponents } from "./checkpoint-content-components"

interface CheckpointAccordionProps {
    question: string
    answer: string
    index?: number
}

export function CheckpointAccordion({ question, answer, index }: CheckpointAccordionProps) {
    return (
        <CheckpointAccordionShell
            index={index}
            question={<InlineMarkdown>{question}</InlineMarkdown>}
            answer={(
                <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex, rehypeRaw]}
                    components={checkpointAnswerComponents}
                >
                    {answer}
                </ReactMarkdown>
            )}
        />
    )
}
