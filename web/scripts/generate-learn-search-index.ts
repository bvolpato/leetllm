import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { getQuestions, type Category, type Difficulty, type Section } from "../src/lib/questions"

export interface PrebuiltLearnSearchDoc {
    id: string
    title: string
    slug: string
    section: Section
    category: Category
    difficulty: Difficulty
    timeEstimate: number
    shortDescription: string
    order: number
    titleLower: string
    shortDescriptionLower: string
    metaLower: string
    plainContent: string
}

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

function writeIfChanged(outputPath: string, nextContent: string, label: string) {
    mkdirSync(dirname(outputPath), { recursive: true })
    if (existsSync(outputPath) && readFileSync(outputPath, "utf8") === nextContent) {
        console.log(`Unchanged ${outputPath} (${label})`)
        return
    }
    writeFileSync(outputPath, nextContent)
    console.log(`Wrote ${outputPath} (${label}, ${(nextContent.length / 1024).toFixed(1)} KiB)`)
}

function main() {
    const searchOutputPath = join(process.cwd(), "src", "generated", "learn-search-index.json")
    const catalogOutputPath = join(process.cwd(), "src", "generated", "learn-catalog.json")
    const questions = getQuestions()
    const docs: PrebuiltLearnSearchDoc[] = questions.map((question, order) => {
        const plainContent = stripMarkdownForSearch(question.content)
        const meta = [
            question.section,
            question.category,
            ...question.keyConceptsTested,
        ].join(" ")

        return {
            id: question.id,
            title: question.title,
            slug: question.slug,
            section: question.section,
            category: question.category,
            difficulty: question.difficulty,
            timeEstimate: question.timeEstimate,
            shortDescription: question.shortDescription,
            order,
            titleLower: normalizeText(question.title),
            shortDescriptionLower: normalizeText(question.shortDescription),
            metaLower: normalizeText(meta),
            plainContent,
        }
    })
    const catalog = questions.map((question) => ({
        id: question.id,
        title: question.title,
        slug: question.slug,
        section: question.section,
        category: question.category,
        difficulty: question.difficulty,
        timeEstimate: question.timeEstimate,
        shortDescription: question.shortDescription,
    }))

    writeIfChanged(searchOutputPath, JSON.stringify(docs), `${docs.length} lessons`)
    writeIfChanged(catalogOutputPath, JSON.stringify(catalog) + "\n", `${catalog.length} lessons`)
}

main()
