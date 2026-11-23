"use client"

import type { ReactNode } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion"
import { HelpCircle } from "lucide-react"

interface CheckpointAccordionShellProps {
    question: ReactNode
    answer: ReactNode
    index?: number
}

export function CheckpointAccordionShell({ question, answer, index }: CheckpointAccordionShellProps) {
    return (
        <>
            <Accordion type="single" collapsible className="w-full my-6" data-print-hidden>
                <AccordionItem
                    value={`checkpoint-${index ?? 0}`}
                    className="border border-primary/20 rounded-xl overflow-hidden bg-primary/[0.03]"
                >
                    <AccordionTrigger headingLevel={null} className="hover:no-underline py-4 px-5 gap-3 [&[data-state=open]]:bg-primary/[0.06]">
                        <span className="flex items-center gap-3 text-left w-full">
                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex-shrink-0">
                                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                            </span>
                            <span className="text-sm font-medium [color:var(--reading-heading)]">
                                {question}
                            </span>
                        </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm [color:var(--reading-ink)] leading-relaxed px-5 pb-4 pt-2">
                        <div className="border-t [border-color:var(--reading-border)] pt-3">
                            <p className="text-xs font-semibold uppercase tracking-wider [color:var(--reading-muted)] mb-2">
                                Answer
                            </p>
                            {answer}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            <section
                data-print-only
                data-print-question
                className="hidden my-6 rounded-xl border border-primary/20 bg-primary/[0.03] px-5 py-4"
            >
                <h4 className="text-sm font-semibold [color:var(--reading-heading)]">
                    {question}
                </h4>
                <div className="mt-3 border-t [border-color:var(--reading-border)] pt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider [color:var(--reading-muted)]">
                        Answer
                    </p>
                    {answer}
                </div>
            </section>
        </>
    )
}
