import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPracticeProblem, getPracticeProblemSlugs, getPracticeProblems, toPracticeClientProblem, toPracticeListItem } from "@/lib/practice"
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

    return (
        <PracticeProblemClient
            key={problem.slug}
            problem={toPracticeClientProblem(problem)}
            problems={problems.map(toPracticeListItem)}
        />
    )
}
