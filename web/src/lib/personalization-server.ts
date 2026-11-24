import { createHash } from "crypto"
import { extractLessonBody } from "./lesson-content"
import { extractPersonalizationVisuals } from "./personalization-visuals"
import { getCanonicalQuestionSlug, getQuestionBySlug } from "./questions"

export function sha256(value: string) {
    return createHash("sha256").update(value).digest("hex")
}

export function getPersonalizableLessonSlug(slug: unknown) {
    if (typeof slug !== "string" || slug.length > 200) return null
    return getCanonicalQuestionSlug(slug) ?? null
}

type PersonalizableLesson = {
    slug: string
    title: string
    content: string
    visuals: ReturnType<typeof extractPersonalizationVisuals>
    sourceHash: string
}

const personalizableLessonCache = new Map<string, PersonalizableLesson>()

export function getPersonalizableLesson(slug: unknown) {
    const canonicalSlug = getPersonalizableLessonSlug(slug)
    if (!canonicalSlug) return null
    const isProd = process.env.NODE_ENV === "production"
    if (isProd) {
        const cached = personalizableLessonCache.get(canonicalSlug)
        if (cached) return cached
    }
    const question = getQuestionBySlug(canonicalSlug)
    if (!question) return null
    const { content } = extractLessonBody(question.content)
    const visuals = extractPersonalizationVisuals(canonicalSlug, content)
    const visualHashInput = visuals.map((visual) => (
        `${visual.id}\u0000${visual.kind}\u0000${visual.name}\u0000${visual.source}`
    )).join("\u0001")

    const lesson: PersonalizableLesson = {
        slug: canonicalSlug,
        title: question.title,
        content,
        visuals,
        sourceHash: sha256(`${content}\u0002${visualHashInput}`),
    }

    if (isProd) {
        personalizableLessonCache.set(canonicalSlug, lesson)
    }

    return lesson
}

export function parseLessonPersonalizationRequest(value: unknown) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("Invalid personalization request")
    }
    const input = value as Record<string, unknown>
    if (Object.keys(input).some((key) => key !== "slug" && key !== "regenerate")) {
        throw new Error("Invalid personalization request")
    }
    const lesson = getPersonalizableLesson(input.slug)
    if (!lesson || (input.regenerate !== undefined && typeof input.regenerate !== "boolean")) {
        throw new Error("Invalid personalization request")
    }
    return { lesson, regenerate: input.regenerate === true }
}
