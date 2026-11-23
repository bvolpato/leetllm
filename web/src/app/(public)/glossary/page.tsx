import { GLOSSARY_SUMMARIES, getGlossaryEntry } from "@/lib/glossary-server"
import { GlossaryPageClient } from "./glossary-page-client"

export const metadata = {
    title: "Glossary",
    description:
        "Study AI, ML, and LLM terms with definitions, intuition, examples, decision rules, common mistakes, and related terms.",
    alternates: {
        canonical: "/glossary",
    },
    openGraph: {
        title: "Glossary | LeetLLM",
        description:
            "Study AI, ML, and LLM terms with definitions, intuition, examples, decision rules, common mistakes, and related terms.",
        url: "https://leetllm.com/glossary",
        type: "website",
        images: [
            {
                url: "https://leetllm.com/default-og-image.png",
                width: 1200,
                height: 630,
                alt: "LeetLLM Open Graph Image",
                type: "image/png",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Glossary | LeetLLM",
        description:
            "Study AI, ML, and LLM terms with definitions, intuition, examples, decision rules, common mistakes, and related terms.",
        images: ["https://leetllm.com/default-og-image.png"],
    },
}

export const revalidate = false

export default function GlossaryPage() {
    return (
        <GlossaryPageClient
            initialEntry={getGlossaryEntry(GLOSSARY_SUMMARIES[0].id)!}
        />
    )
}
