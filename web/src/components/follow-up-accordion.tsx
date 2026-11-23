"use client"

import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { FollowUpQuestion } from "@/lib/questions"

interface FollowUpAccordionProps {
    questions: FollowUpQuestion[]
}

/** Lightweight inline markdown renderer with math support for short text. */
function InlineMarkdown({ text }: { text: string }) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
                // Render everything inline — strip outer <p> wrappers
                p: ({ children }) => <>{children}</>,
            }}
        >
            {text}
        </ReactMarkdown>
    )
}

export function FollowUpAccordion({ questions }: FollowUpAccordionProps) {
    return (
        <>
            <Accordion type="multiple" className="w-full" data-print-hidden>
                {questions.map((fq, i) => (
                    <AccordionItem
                        key={i}
                        value={`fq-${i}`}
                        className="border-border/30"
                    >
                        <AccordionTrigger className="hover:no-underline py-3 gap-3">
                            <span className="flex items-center gap-3 text-left">
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex-shrink-0">
                                    <span className="text-[10px] font-bold text-blue-400">{i + 1}</span>
                                </span>
                                <span className="text-sm text-foreground/90">
                                    <InlineMarkdown text={fq.question} />
                                </span>
                            </span>
                        </AccordionTrigger>
                        <AccordionContent className="text-sm [color:var(--reading-muted)] leading-relaxed pl-8">
                            <InlineMarkdown text={fq.answer} />
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
            <div data-print-only className="hidden space-y-4">
                {questions.map((fq, i) => (
                    <section key={i} data-print-question className="border-b [border-color:var(--reading-border)] pb-4 last:border-b-0">
                        <h4 className="text-sm font-semibold [color:var(--reading-heading)]">
                            {i + 1}. <InlineMarkdown text={fq.question} />
                        </h4>
                        <div className="mt-2 text-sm leading-relaxed [color:var(--reading-muted)]">
                            <InlineMarkdown text={fq.answer} />
                        </div>
                    </section>
                ))}
            </div>
        </>
    )
}
