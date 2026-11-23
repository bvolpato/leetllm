import type { Metadata } from "next"
import { getPracticeProblems, toPracticeListItem } from "@/lib/practice"
import { getTheoryQuizzes } from "@/lib/theory-quizzes"
import { PracticePageClient } from "./practice-page-client"

export const metadata: Metadata = {
    title: "Practice",
    description: "Global AI engineering quizzes plus coding practice for LLM, retrieval, agent, training, inference, and platform concepts.",
}

export default function PracticePage() {
    const problems = getPracticeProblems().map(toPracticeListItem)
    const theoryQuizzes = getTheoryQuizzes()

    return <PracticePageClient problems={problems} theoryQuizzes={theoryQuizzes} />
}
