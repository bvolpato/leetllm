import {
    getQuestionsForUser,
    difficultyConfig,
    categoryConfig,
    sectionConfig,
    sections,
    type Section,
    type QuestionSummary,
} from "@/lib/questions"
import { LearnPageClient } from "./learn-page-client"
import { getLessonVideo } from "@/lib/lesson-videos"

export const metadata = {
    title: "Learn LLM & AI Concepts",
    description:
        "Master LLM engineering with in-depth articles on transformer architecture, RAG, fine-tuning, inference optimization, and more. All lessons are free.",
    alternates: {
        canonical: "/learn",
    },
    openGraph: {
        title: "Learn LLM & AI Concepts | LeetLLM",
        description: "Master LLM engineering with in-depth articles on transformer architecture, RAG, fine-tuning, inference optimization, and more. All lessons are free.",
        url: "https://leetllm.com/learn",
        type: "website",
        images: [
            {
                url: "https://leetllm.com/default-og-image.png",
                width: 1200,
                height: 630,
                alt: "LeetLLM Open Graph Image",
                type: "image/png",
            }
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Learn LLM & AI Concepts | LeetLLM",
        description: "Master LLM engineering with in-depth articles on transformer architecture, RAG, fine-tuning, inference optimization, and more. All lessons are free.",
        images: ["https://leetllm.com/default-og-image.png"],
    }
}

// Content ships with the image. Auth-only UI resolves client-side.
export const revalidate = false

export default async function LearnPage() {
    const allQuestions = getQuestionsForUser(false)
    const totalCount = allQuestions.length

    // Group questions by section
    const questionsBySection: Record<Section, QuestionSummary[]> = {} as Record<Section, QuestionSummary[]>
    sections.forEach((s) => { questionsBySection[s] = [] })

    allQuestions.forEach((q) => {
        const section = q.section
        if (questionsBySection[section]) {
            questionsBySection[section].push(q)
        }
    })

    // Prepare serializable data for the client component
    const sectionsData = sections.map((section) => ({
        name: section,
        config: sectionConfig[section],
        questions: questionsBySection[section].map((q) => ({
            id: q.id,
            title: q.title,
            slug: q.slug,
            shortDescription: q.shortDescription,
            difficulty: q.difficulty,
            category: q.category,
            timeEstimate: q.timeEstimate,
            diffConfig: difficultyConfig[q.difficulty],
            catConfig: categoryConfig[q.category],
            video: getLessonVideo(q.slug),
        })),
    }))

    return (
        <LearnPageClient
            sectionsData={sectionsData}
            totalCount={totalCount}
        />
    )
}
