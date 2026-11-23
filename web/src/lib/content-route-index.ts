import contentRouteIndex from "@/generated/content-route-index.json"

export interface QuestionRouteEntry {
    directory: string
    canonicalSlug: string
    hidden: boolean
}

export interface BlogRouteEntry {
    directory: string
    canonicalSlug: string
    aliases: string[]
    draft: boolean
    private: boolean
    hidden?: boolean
    redirectTo?: string
}

type ContentRouteIndex = {
    questions: Record<string, QuestionRouteEntry>
    blogs: Record<string, BlogRouteEntry>
    glossary: string[]
}

const index = contentRouteIndex as ContentRouteIndex
const glossaryRoutes = new Set(index.glossary)

export function getQuestionRoute(slug: string): QuestionRouteEntry | undefined {
    return Object.hasOwn(index.questions, slug) ? index.questions[slug] : undefined
}

export function getBlogRoute(slug: string): BlogRouteEntry | undefined {
    return Object.hasOwn(index.blogs, slug) ? index.blogs[slug] : undefined
}

export function hasGlossaryRoute(slug: string): boolean {
    return glossaryRoutes.has(slug)
}
