import { getQuestions, type Category, type Difficulty, type Question, type Section } from "./questions"

export interface LearnSearchResult {
    id: string
    title: string
    slug: string
    section: Section
    category: Category
    difficulty: Difficulty
    timeEstimate: number
    shortDescription: string
    snippet: string
    snippetSource: "shortDescription" | "content"
}

interface SearchDocument {
    question: Question
    order: number
    titleLower: string
    shortDescriptionLower: string
    metaLower: string
    plainContent: string
    plainContentLower: string
}

interface ScoredSearchResult extends LearnSearchResult {
    score: number
    order: number
}

const MIN_QUERY_LENGTH = 2
const DEFAULT_LIMIT = 8
const isDev = process.env.NODE_ENV === "development"

let searchDocsCache: SearchDocument[] | null = null

function normalizeText(text: string): string {
    return text
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
}

function stripMarkdownForSearch(markdown: string): string {
    return markdown
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/\$\$[\s\S]*?\$\$/g, " ")
        .replace(/(?<!\\)\$[^$\n]+(?<!\\)\$/g, " ")
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1 ")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1 ")
        .replace(/<[^>]+>/g, " ")
        .replace(/^>\s?/gm, " ")
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/[*_~|]/g, " ")
        .replace(/`([^`]*)`/g, "$1")
        .replace(/\\\$/g, "$")
        .replace(/\s+/g, " ")
        .trim()
}

function tokenizeQuery(query: string): string[] {
    return [...new Set(
        normalizeText(query)
            .split(/[^a-z0-9]+/)
            .map((term) => term.trim())
            .filter((term) => term.length >= MIN_QUERY_LENGTH)
    )]
}

function getSearchDocuments(): SearchDocument[] {
    if (isDev || !searchDocsCache) {
        searchDocsCache = getQuestions().map((question, order) => {
            const plainContent = stripMarkdownForSearch(question.content)
            const meta = [
                question.section,
                question.category,
                ...question.keyConceptsTested,
            ].join(" ")

            return {
                question,
                order,
                titleLower: normalizeText(question.title),
                shortDescriptionLower: normalizeText(question.shortDescription),
                metaLower: normalizeText(meta),
                plainContent,
                plainContentLower: normalizeText(plainContent),
            }
        })
    }

    return searchDocsCache
}

function getEarliestMatchIndex(text: string, phrase: string, terms: string[]): number {
    const phraseIndex = phrase ? text.indexOf(phrase) : -1
    if (phraseIndex !== -1) {
        return phraseIndex
    }

    let bestIndex = -1
    for (const term of terms) {
        const termIndex = text.indexOf(term)
        if (termIndex !== -1 && (bestIndex === -1 || termIndex < bestIndex)) {
            bestIndex = termIndex
        }
    }

    return bestIndex
}

function scoreField(text: string, phrase: string, terms: string[], phraseWeight: number, termWeight: number) {
    let score = 0
    let matchedTerms = 0
    const phraseIndex = getEarliestMatchIndex(text, phrase, [])

    if (phraseIndex !== -1) {
        score += Math.max(phraseWeight - Math.min(phraseIndex, 180), Math.floor(phraseWeight * 0.45))
    }

    for (const term of terms) {
        const termIndex = text.indexOf(term)
        if (termIndex === -1) {
            continue
        }
        matchedTerms += 1
        score += Math.max(termWeight - Math.floor(Math.min(termIndex, 200) / 8), Math.floor(termWeight * 0.4))
    }

    if (terms.length > 1 && matchedTerms === terms.length) {
        score += termWeight
    }

    return { score, phraseIndex, matchedTerms }
}

function buildSnippet(text: string, phrase: string, terms: string[]): string {
    const matchIndex = getEarliestMatchIndex(normalizeText(text), phrase, terms)
    if (matchIndex === -1) {
        return text.length <= 150 ? text : `${text.slice(0, 147).trimEnd()}...`
    }

    const windowStart = Math.max(0, matchIndex - 52)
    const windowEnd = Math.min(
        text.length,
        matchIndex + Math.max(phrase.length, terms[0]?.length ?? 0) + 92
    )
    const prefix = windowStart > 0 ? "..." : ""
    const suffix = windowEnd < text.length ? "..." : ""

    return `${prefix}${text.slice(windowStart, windowEnd).trim()}${suffix}`
}

function scoreDocument(doc: SearchDocument, phrase: string, terms: string[]): ScoredSearchResult | null {
    const titleMatch = scoreField(doc.titleLower, phrase, terms, 760, 140)
    const shortDescriptionMatch = scoreField(doc.shortDescriptionLower, phrase, terms, 290, 54)
    const metaMatch = scoreField(doc.metaLower, phrase, terms, 150, 24)
    const contentMatch = scoreField(doc.plainContentLower, phrase, terms, 105, 14)

    let score = titleMatch.score + shortDescriptionMatch.score + metaMatch.score + contentMatch.score

    if (doc.titleLower === phrase) {
        score += 420
    } else if (phrase && doc.titleLower.startsWith(phrase)) {
        score += 240
    }

    if (terms.length > 1 && terms.every((term) => doc.titleLower.includes(term))) {
        score += 180
    }

    if (score <= 0) {
        return null
    }

    const snippetSource =
        shortDescriptionMatch.phraseIndex !== -1 || shortDescriptionMatch.matchedTerms > 0
            ? "shortDescription"
            : "content"
    const snippet =
        snippetSource === "shortDescription"
            ? doc.question.shortDescription
            : buildSnippet(doc.plainContent, phrase, terms)

    return {
        id: doc.question.id,
        title: doc.question.title,
        slug: doc.question.slug,
        section: doc.question.section,
        category: doc.question.category,
        difficulty: doc.question.difficulty,
        timeEstimate: doc.question.timeEstimate,
        shortDescription: doc.question.shortDescription,
        snippet,
        snippetSource,
        score,
        order: doc.order,
    }
}

export function searchCurriculum(query: string, limit = DEFAULT_LIMIT): { total: number; results: LearnSearchResult[] } {
    const trimmedQuery = query.trim()
    const phrase = normalizeText(trimmedQuery)
    const terms = tokenizeQuery(trimmedQuery)

    if (phrase.length < MIN_QUERY_LENGTH || terms.length === 0) {
        return { total: 0, results: [] }
    }

    const results = getSearchDocuments()
        .map((doc) => scoreDocument(doc, phrase, terms))
        .filter((result): result is ScoredSearchResult => result !== null)
        .sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score
            }
            return a.order - b.order
        })

    return {
        total: results.length,
        results: results.slice(0, limit).map((result) => ({
            id: result.id,
            title: result.title,
            slug: result.slug,
            section: result.section,
            category: result.category,
            difficulty: result.difficulty,
            timeEstimate: result.timeEstimate,
            shortDescription: result.shortDescription,
            snippet: result.snippet,
            snippetSource: result.snippetSource,
        })),
    }
}
