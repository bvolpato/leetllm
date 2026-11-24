import type { Metadata } from "next"
import type { ReactNode } from "react"
import { notFound } from "next/navigation"
import { ServerMarkdownRenderer } from "@/components/server-markdown-renderer"
import { getPracticeProblem, getPracticeProblemSlugs, getPracticeProblems, toPracticeClientProblem, toPracticeListItem } from "@/lib/practice"
import type { PracticeLanguage } from "@/lib/practice-languages"
import { PracticeProblemClient } from "./practice-problem-client"

interface PageProps {
    params: Promise<{ slug: string }>
}

export function generateStaticParams() {
    return getPracticeProblemSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const problem = getPracticeProblem(slug)
    if (!problem) return {}

    return {
        title: `${problem.title} | Practice`,
        description: problem.summary,
    }
}

export default async function PracticeProblemPage({ params }: PageProps) {
    const { slug } = await params
    const problems = getPracticeProblems()
    const problem = problems.find((item) => item.slug === slug) ?? getPracticeProblem(slug)
    if (!problem) notFound()

    const clientProblem = toPracticeClientProblem(problem)
    const renderedSolutionGuides: Partial<Record<PracticeLanguage, ReactNode>> = {}
    for (const language of clientProblem.languages) {
        const guide = clientProblem.languageDetails[language]?.solutionGuide
        if (guide) {
            renderedSolutionGuides[language] = (
                <ServerMarkdownRenderer
                    content={guide}
                    contentKey={`${problem.slug}:solution:${language}`}
                />
            )
        }
    }

    return (
        <PracticeProblemClient
            key={problem.slug}
            problem={clientProblem}
            problems={problems.map(toPracticeListItem)}
            renderedBody={
                <ServerMarkdownRenderer
                    content={problem.body}
                    contentKey={`${problem.slug}:body`}
                />
            }
            renderedComplexityAnalysis={
                problem.complexityAnalysis ? (
                    <ServerMarkdownRenderer
                        content={problem.complexityAnalysis}
                        contentKey={`${problem.slug}:complexity`}
                    />
                ) : null
            }
            renderedSolutionGuides={renderedSolutionGuides}
            renderedFollowUpGuide={
                problem.followUpGuide ? (
                    <ServerMarkdownRenderer
                        content={problem.followUpGuide}
                        contentKey={`${problem.slug}:followups`}
                    />
                ) : null
            }
        />
    )
}
