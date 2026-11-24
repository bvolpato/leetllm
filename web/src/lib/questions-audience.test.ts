import { join } from "path"
import { NextRequest } from "next/server"
import { afterEach, describe, expect, test, vi } from "vitest"
import { filterContentForAudience, type ContentAudience, type ContentEdition } from "./content-audience"
import { estimateReadingTime } from "./content-utils"

const slug = "numpy-and-tensor-shapes"
const articleDir = join(process.cwd(), "src", "content", "foundations", slug)
const sourceBody = [
    "Shared introduction.",
    "<!-- leetllm: audience:website:start -->",
    "Website walkthrough.[^hofmann2024Dialect]",
    "## Before you continue",
    "- Website skill.",
    "## Common pitfalls",
    "- Website pitfall.",
    "```checkpoint",
    "Website question?",
    "---",
    "Website answer.",
    "```",
    "<!-- leetllm: audience:website:end -->",
    "<!-- leetllm: audience:book:start -->",
    "Book derivation.[^kusner2017Counterfactual]",
    "Detailed mathematical explanation. ".repeat(1_000),
    "## Before you continue",
    "- Book skill.",
    "## Common pitfalls",
    "- Book pitfall.",
    "```checkpoint",
    "Book question?",
    "---",
    "Book answer.",
    "```",
    "<!-- leetllm: audience:book:end -->",
].join("\n")

afterEach(() => {
    vi.doUnmock("./content-bundle")
    vi.resetModules()
})

async function mockAudienceBundle(metadata: Record<string, unknown> = {}, source = sourceBody) {
    const original = await vi.importActual<typeof import("./content-bundle")>("./content-bundle")
    const loadContentBundle = vi.fn((directory: string, audience?: ContentAudience, edition?: ContentEdition) => {
        const bundle = original.loadContentBundle(directory, audience, edition)
        if (!bundle || directory !== articleDir) return bundle
        return {
            ...bundle,
            metadata: { ...bundle.metadata, coverImage: undefined, ...metadata },
            sourceBody: source,
            body: audience ? filterContentForAudience(source, audience, "fixture.md", edition) : source,
        }
    })
    vi.doMock("./content-bundle", () => ({ ...original, loadContentBundle }))
    return loadContentBundle
}

describe("question audiences", () => {
    test("isolates reader and reference caches while defaulting website to reader edition", async () => {
        const source = "<!-- leetllm: edition:reference:start -->Complete derivation.[^hofmann2024Dialect]<!-- leetllm: edition:reference:end -->\n<!-- leetllm: edition:reader:start -->Focused example.[^kusner2017Counterfactual]<!-- leetllm: edition:reader:end -->"
        await mockAudienceBundle({}, source)
        const { getQuestions } = await import("./questions")
        const reader = getQuestions("book", "reader").find(question => question.slug === slug)!
        const reference = getQuestions("book", "reference").find(question => question.slug === slug)!
        expect(reader.content).toContain("Focused example.")
        expect(reader.content).not.toContain("Complete derivation.")
        expect(Object.keys(reader.references)).toEqual(["kusner2017Counterfactual"])
        expect(reference.content).toContain("Complete derivation.")
        expect(reference.content).not.toContain("Focused example.")
        expect(Object.keys(reference.references)).toEqual(["hofmann2024Dialect"])
        expect(getQuestions("book", "reader").find(question => question.slug === slug)).toEqual(reader)
        expect(getQuestions().find(question => question.slug === slug)?.content).toContain("Focused example.")
        expect(getQuestions("website", "reference").find(question => question.slug === slug)?.content).toContain("Complete derivation.")
    })
    test("keeps separate text, references, reading time, and learning sections for each output", async () => {
        const loadContentBundle = await mockAudienceBundle()
        const { getQuestions, getQuestionForUser } = await import("./questions")
        const website = getQuestionForUser(slug, false)!
        expect(loadContentBundle).toHaveBeenCalledWith(articleDir, "website")
        expect(website.content).toContain("Website walkthrough.")
        expect(website.content).not.toContain("Book derivation.")
        expect(Object.keys(website.references)).toEqual(["hofmann2024Dialect"])
        expect(website.rubricPoints).toEqual(["Website skill."])
        expect(website.commonPitfalls).toEqual(["Website pitfall."])
        expect(website.followUpQuestions).toEqual([{ question: "Website question?", answer: "Website answer." }])
        expect(website.timeEstimate).toBe(estimateReadingTime(filterContentForAudience(sourceBody, "website"), website.difficulty))

        const book = getQuestions("book").find(question => question.slug === slug)!
        expect(book.content).toContain("Book derivation.")
        expect(book.content).not.toContain("Website walkthrough.")
        expect(Object.keys(book.references)).toEqual(["kusner2017Counterfactual"])
        expect(book.rubricPoints).toEqual(["Book skill."])
        expect(book.commonPitfalls).toEqual(["Book pitfall."])
        expect(book.followUpQuestions).toEqual([{ question: "Book question?", answer: "Book answer." }])
        expect(book.timeEstimate).toBeGreaterThan(website.timeEstimate)
        expect(getQuestionForUser(slug, true)).toBe(website)
        expect(getQuestions().find(question => question.slug === slug)).toEqual(website)

        const { GET } = await import("@/app/api/md/[slug]/route")
        const response = await GET(new NextRequest(`http://localhost/api/md/${slug}`), { params: Promise.resolve({ slug }) })
        const markdown = await response.text()
        expect(response.status).toBe(200)
        expect(markdown).toContain("Website walkthrough.")
        expect(markdown).not.toContain("Book derivation.")
        expect(markdown).not.toContain("sourceBody")
        expect(markdown).not.toContain("leetllm: audience")
    })

    test("a book-only canonical chapter is excluded from cold and warm website lookup without breaking roadmap validation", async () => {
        await mockAudienceBundle({ visibility: { website: false, book: true } })
        const { getQuestions, getQuestionForUser } = await import("./questions")

        expect(getQuestions("book").some(question => question.slug === slug)).toBe(true)
        expect(getQuestionForUser(slug, false)).toBeUndefined()
        expect(getQuestions().some(question => question.slug === slug)).toBe(false)
        expect(getQuestionForUser(slug, false)).toBeUndefined()
    })

    test("website-only metadata does not remove the lesson from the website", async () => {
        await mockAudienceBundle({ visibility: { book: false } })
        const { getQuestions, getQuestionForUser } = await import("./questions")

        expect(getQuestions("book").some(question => question.slug === slug)).toBe(false)
        expect(getQuestionForUser(slug, false)?.slug).toBe(slug)
        expect(getQuestions().some(question => question.slug === slug)).toBe(true)
    })

    test("allows a new book-only chapter outside the website roadmap", async () => {
        await mockAudienceBundle({ slug: "book-only-chapter", aliases: [], visibility: { website: false } })
        const { getQuestions } = await import("./questions")
        expect(getQuestions("book").some(question => question.slug === "book-only-chapter")).toBe(true)
    })
})
