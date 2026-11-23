import type { Metadata } from "next"
import { DashboardClient } from "./dashboard-client"
import { getPracticeProblems, toPracticeListItem } from "@/lib/practice"
import { getQuestions } from "@/lib/questions"
import { getTheoryQuizzes } from "@/lib/theory-quizzes"
import { getLearningPlanTracks } from "@/lib/learning-plan-server"

export const metadata: Metadata = {
    title: "Your Learning",
    robots: { index: false, follow: false },
}

export default function Dashboard() {
    const lessons = getQuestions().map((lesson) => ({
        slug: lesson.slug,
        title: lesson.title,
        shortDescription: lesson.shortDescription,
        section: lesson.section,
        timeEstimate: lesson.timeEstimate,
    }))
    const tracks = getLearningPlanTracks()
    const theoryQuizzes = getTheoryQuizzes()
    const quizzes = theoryQuizzes.map((quiz) => ({
        slug: quiz.slug,
        title: quiz.title,
        level: quiz.level,
    }))
    const catalog = {
        practiceProblems: getPracticeProblems().map(toPracticeListItem).map((problem) => ({
            slug: problem.slug,
            title: problem.title,
            summary: problem.summary,
            difficulty: problem.difficulty,
            timeEstimateMinutes: problem.timeEstimateMinutes,
        })),
        theoryQuizzes: theoryQuizzes.map((quiz) => ({
            slug: quiz.slug,
            title: quiz.title,
            description: quiz.description,
            level: quiz.level,
            estimatedMinutes: quiz.estimatedMinutes,
        })),
    }

    return <DashboardClient lessons={lessons} tracks={tracks} quizzes={quizzes} catalog={catalog} />
}
