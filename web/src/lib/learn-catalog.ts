import prebuiltLearnCatalog from "@/generated/learn-catalog.json"
import { getQuestions, type Category, type Difficulty, type Section } from "./questions"

export interface LessonCatalogItem {
    id: string
    title: string
    slug: string
    section: Section
    category: Category
    difficulty: Difficulty
    timeEstimate: number
    shortDescription: string
}

const usePrebuiltCatalog = process.env.NODE_ENV === "production"

export function getLessonCatalog(): LessonCatalogItem[] {
    if (usePrebuiltCatalog) {
        return prebuiltLearnCatalog as LessonCatalogItem[]
    }

    return getQuestions().map((question) => ({
        id: question.id,
        title: question.title,
        slug: question.slug,
        section: question.section,
        category: question.category,
        difficulty: question.difficulty,
        timeEstimate: question.timeEstimate,
        shortDescription: question.shortDescription,
    }))
}
