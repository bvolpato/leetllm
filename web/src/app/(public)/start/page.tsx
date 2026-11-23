import type { Metadata } from "next"
import { LearningPlanBuilder } from "./learning-plan-builder"
import { getLearningPlanCatalog, getLearningPlanTracks } from "@/lib/learning-plan-server"

export const metadata: Metadata = {
    title: "Build Your AI Learning Plan",
    description: "Create a focused four-to-twenty-week LeetLLM plan based on your goal, experience, and weekly study time.",
    alternates: {
        canonical: "/start",
    },
    openGraph: {
        title: "Build Your AI Learning Plan | LeetLLM",
        description: "Create a focused four-to-twenty-week AI learning plan from LeetLLM's free curriculum.",
        url: "https://leetllm.com/start",
        type: "website",
        images: ["https://leetllm.com/default-og-image.png"],
    },
}

export default function StartPage() {
    return <LearningPlanBuilder tracks={getLearningPlanTracks()} catalog={getLearningPlanCatalog()} />
}
