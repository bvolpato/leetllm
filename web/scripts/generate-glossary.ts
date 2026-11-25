import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs"
import { basename, join } from "path"
import { loadContentBundle } from "../src/lib/content-bundle"
import { isVisibleToAudience } from "../src/lib/content-audience"
import { resolveGlossaryEntryMedia } from "../src/lib/content-utils"
import { parseGlossarySections } from "./glossary-sections"

type ParsedEntry = {
    id: string
    title: string
    aliases?: string[]
    kind?: "term" | "code"
    importance: number
    definition: string
    example: string
    relevance: string
    intuition?: string
    formula?: string
    decisionRule?: string
    pitfall?: string
    seeAlso?: string
    details?: {
        title: string
        content: string
    }[]
    usage?: {
        title: string
        url: string
        excerpt: string
    }[]
    related?: {
        id: string
        title: string
    }[]
    relatedIds?: string[]
    code?: {
        language: string
        title: string
        source: string
    }
}

const rootDir = process.cwd()
const glossaryDir = join(rootDir, "src", "content", "glossary")
const contentDir = join(rootDir, "src", "content")
const outputPath = join(rootDir, "src", "generated", "glossary.ts")
const dataOutputPath = join(rootDir, "src", "generated", "glossary-data.json")
const termIndexOutputPath = join(rootDir, "src", "generated", "glossary-term-index.ts")

function parseFrontmatter(raw: string, path: string) {
    const match = raw.match(/^---\n([\s\S]*?)\n---\n?/)
    if (!match) {
        throw new Error(`${path}: missing YAML frontmatter`)
    }

    const metadata: Record<string, string> = {}
    for (const line of match[1].split("\n")) {
        if (!line.trim()) continue
        const separator = line.indexOf(":")
        if (separator === -1) {
            throw new Error(`${path}: invalid frontmatter line: ${line}`)
        }
        const key = line.slice(0, separator).trim()
        const value = line.slice(separator + 1).trim().replace(/^"|"$/g, "")
        metadata[key] = value
    }

    return {
        metadata,
        body: raw.slice(match[0].length).trim(),
    }
}

function stripFirstCodeFence(text: string) {
    return text.replace(/\n?```[\s\S]*?```\s*$/, "").trim()
}

function parseCode(text: string): ParsedEntry["code"] | undefined {
    // Prefer real language samples; skip mermaid (teaching diagrams, not code examples).
    const fenceRe = /```([A-Za-z0-9_-]+)([^\n]*)\n([\s\S]*?)\n```/g
    let match: RegExpExecArray | null
    let textFallback: ParsedEntry["code"] | undefined
    while ((match = fenceRe.exec(text)) !== null) {
        const language = match[1].toLowerCase()
        if (language === "mermaid" || language === "checkpoint" || language === "mastery-quiz") {
            continue
        }
        const titleMatch = match[2].match(/\btitle=(?:"([^"]+)"|'([^']+)'|([^\s]+))/)
        const code = {
            language: match[1],
            title: titleMatch?.[1] ?? titleMatch?.[2] ?? titleMatch?.[3] ?? match[1],
            source: match[3].trimEnd() + "\n",
        }
        if (language === "text" || language === "plaintext") {
            textFallback ??= code
            continue
        }
        return code
    }
    return textFallback
}

function parseImportance(metadata: Record<string, string>, path: string) {
    const raw = metadata.importance
    if (!raw) {
        throw new Error(`${path}: missing required frontmatter importance score`)
    }

    const score = Number(raw)
    if (!Number.isInteger(score) || score < 0 || score > 100) {
        throw new Error(`${path}: importance must be an integer from 0 to 100`)
    }

    return score
}

function parseAliases(metadata: Record<string, string>, path: string) {
    const raw = metadata.aliases
    if (!raw) return []

    let aliases: unknown
    try {
        aliases = JSON.parse(raw)
    } catch {
        throw new Error(`${path}: aliases must be a JSON array of strings`)
    }

    if (!Array.isArray(aliases) || aliases.some((alias) => typeof alias !== "string" || !alias.trim())) {
        throw new Error(`${path}: aliases must be a JSON array of non-empty strings`)
    }

    const normalized = aliases.map((alias) => alias.trim())
    const unique = new Set(normalized.map((alias) => alias.toLocaleLowerCase("en-US")))
    if (unique.size !== normalized.length) {
        throw new Error(`${path}: aliases must be unique, ignoring case`)
    }

    const title = metadata.title?.toLocaleLowerCase("en-US")
    if (title && unique.has(title)) {
        throw new Error(`${path}: aliases must not repeat the canonical title`)
    }

    return normalized
}

function parseGlossaryLinks(text: string) {
    const links = Array.from(text.matchAll(/\[[^\]]+]\(glossary:(?:(?:\/\/)?)([a-z0-9-]+)\)/g)).map((match) => match[1])
    return Array.from(new Set(links))
}

function parseEntry(path: string): ParsedEntry {
    const id = basename(path, ".md")
    const { metadata, body } = parseFrontmatter(readFileSync(path, "utf8"), path)
    const { definition, sections } = parseGlossarySections(body)
    const resolve = (text: string) => resolveGlossaryEntryMedia(id, text)
    // Extract code from raw markdown before media resolution replaces fences with images.
    const exampleSection = Array.from(sections.entries()).find(
        ([heading]) => heading === "Example" || heading.startsWith("Example:"),
    )
    const exampleRaw = exampleSection?.[1] ?? ""
    const relevanceWithCode = sections.get("Why it matters here") ?? ""
    const intuitionRaw = sections.get("Intuition") ?? ""
    const formulaRaw = sections.get("Formula") ?? ""
    const decisionRuleRaw = sections.get("Decision rule") ?? ""
    const pitfallRaw = sections.get("Common mistake") ?? ""
    const seeAlsoRaw = sections.get("Related terms") ?? sections.get("See also") ?? ""
    const reservedSections = new Set([
        "Intuition",
        "Example",
        "Formula",
        "Decision rule",
        "Common mistake",
        "Why it matters here",
        "Related terms",
        "See also",
    ])
    const detailsRaw = Array.from(sections.entries())
        .filter(
            ([heading, content]) =>
                !reservedSections.has(heading) && heading !== exampleSection?.[0] && content.trim(),
        )
        .map(([title, content]) => ({ title, content }))
    // Prefer Example / detail sections for the canonical code field, then relevance.
    const code =
        parseCode(exampleRaw) ??
        detailsRaw.map((detail) => parseCode(detail.content)).find(Boolean) ??
        parseCode(formulaRaw) ??
        parseCode(intuitionRaw) ??
        parseCode(relevanceWithCode) ??
        parseCode(definition)
    // Strip only when the code was lifted from relevance so the dedicated
    // "Code example" panel does not duplicate a fence still rendered inline.
    const relevanceCode = parseCode(relevanceWithCode)
    const relevanceRaw =
        relevanceCode && code && relevanceCode.source === code.source
            ? stripFirstCodeFence(relevanceWithCode)
            : relevanceWithCode

    const definitionResolved = resolve(definition)
    const example = resolve(exampleRaw)
    const relevance = resolve(relevanceRaw)
    const intuition = intuitionRaw ? resolve(intuitionRaw) : ""
    const formula = formulaRaw ? resolve(formulaRaw) : ""
    const decisionRule = decisionRuleRaw ? resolve(decisionRuleRaw) : ""
    const pitfall = pitfallRaw ? resolve(pitfallRaw) : ""
    const seeAlso = seeAlsoRaw ? resolve(seeAlsoRaw) : ""
    const details = detailsRaw.map((detail) => ({
        title: detail.title,
        content: resolve(detail.content),
    }))

    const relatedIds = parseGlossaryLinks([
        definition,
        exampleRaw,
        relevanceRaw,
        intuitionRaw,
        formulaRaw,
        decisionRuleRaw,
        pitfallRaw,
        seeAlsoRaw,
        ...(detailsRaw.map((detail) => detail.content)),
    ].join("\n"))

    if (!metadata.title || !definition || !exampleRaw || !relevanceRaw) {
        throw new Error(
            `${path}: expected title plus definition, an Example or Example: ... section, and Why it matters here`,
        )
    }
    if (metadata.kind && metadata.kind !== "term" && metadata.kind !== "code") {
        throw new Error(`${path}: kind must be "term" or "code"`)
    }

    const aliases = parseAliases(metadata, path)

    return {
        id,
        title: metadata.title,
        ...(aliases.length ? { aliases } : {}),
        kind: metadata.kind as ParsedEntry["kind"] | undefined,
        importance: parseImportance(metadata, path),
        definition: definitionResolved,
        example,
        relevance,
        ...(intuition ? { intuition } : {}),
        ...(formula ? { formula } : {}),
        ...(decisionRule ? { decisionRule } : {}),
        ...(pitfall ? { pitfall } : {}),
        ...(seeAlso ? { seeAlso } : {}),
        ...(details.length ? { details } : {}),
        ...(relatedIds.length ? { relatedIds } : {}),
        ...(code ? { code } : {}),
    }
}

function tsString(value: string) {
    return JSON.stringify(value)
}

function stripHtml(text: string) {
    return text
        .replace(/<span\s+[^>]*data-glossary="([^"]+)"[^>]*>([\s\S]*?)<\/span>/g, "$2")
        .replace(/<[^>]+>/g, " ")
        .replace(/\[\^.+?]/g, "")
        .replace(/\s+/g, " ")
        .trim()
}

function trimExcerpt(text: string, limit = 240) {
    if (text.length <= limit) return text
    return `${text.slice(0, limit).replace(/\s+\S*$/, "").trim()}...`
}

type UsageSourceMetadata = {
    title?: string
    slug?: string
    private?: boolean
    draft?: boolean
    redirectTo?: string
}

function isPublicUsageSource(metadata: UsageSourceMetadata) {
    return metadata.private !== true &&
        metadata.draft !== true &&
        isVisibleToAudience(metadata, "website") &&
        !metadata.redirectTo
}

function buildUsageMap() {
    const usageMap = new Map<string, { title: string; url: string; excerpt: string }[]>()
    const glossarySpanRe = /<span\s+[^>]*data-glossary="([^"]+)"[^>]*>[\s\S]*?<\/span>/g

    function visit(dir: string) {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            if (!entry.isDirectory()) continue
            if (dir === contentDir && entry.name === "glossary") continue

            const childDir = join(dir, entry.name)
            const bundle = loadContentBundle(childDir, "website")
            if (bundle) {
                const metadata = bundle.metadata as UsageSourceMetadata
                if (!isPublicUsageSource(metadata)) continue

                const title = metadata.title
                const slug = metadata.slug ?? entry.name
                if (!title) continue

                const isBlog = childDir.startsWith(join(contentDir, "blog"))
                const url = isBlog ? `/blog/${slug}` : `/learn/${slug}`
                const paragraphs = bundle.body.split(/\n\s*\n/)

                for (const paragraph of paragraphs) {
                    if (!paragraph.includes('data-glossary="')) continue
                    const excerpt = trimExcerpt(stripHtml(paragraph))
                    if (!excerpt) continue

                    const seenInParagraph = new Set<string>()
                    for (const match of paragraph.matchAll(glossarySpanRe)) {
                        const glossaryId = match[1]
                        if (seenInParagraph.has(glossaryId)) continue
                        seenInParagraph.add(glossaryId)

                        const current = usageMap.get(glossaryId) ?? []
                        if (current.some((item) => item.url === url && item.excerpt === excerpt)) {
                            continue
                        }
                        if (current.length >= 3) {
                            continue
                        }
                        current.push({ title, url, excerpt })
                        usageMap.set(glossaryId, current)
                    }
                }
                continue
            }

            visit(childDir)
        }
    }

    visit(contentDir)
    return usageMap
}

const usageMap = buildUsageMap()

const entries = readdirSync(glossaryDir)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => {
        const entry = parseEntry(join(glossaryDir, name))
        const usage = usageMap.get(entry.id)
        return usage?.length ? { ...entry, usage } : entry
    })

const phraseOwners = new Map<string, { id: string; phrase: string }>()
for (const entry of entries) {
    for (const phrase of [entry.title, ...(entry.aliases ?? [])]) {
        const normalized = phrase.toLocaleLowerCase("en-US")
        const existing = phraseOwners.get(normalized)
        if (existing && existing.id !== entry.id) {
            throw new Error(
                `${entry.id}: glossary phrase ${JSON.stringify(phrase)} conflicts with ${existing.id} (${JSON.stringify(existing.phrase)})`,
            )
        }
        phraseOwners.set(normalized, { id: entry.id, phrase })
    }
}

const titlesById = new Map(entries.map((entry) => [entry.id, entry.title]))
const enrichedEntries = entries.map((entry) => {
    const related = entry.relatedIds?.map((id) => {
        const title = titlesById.get(id)
        if (!title) {
            throw new Error(`${entry.id}: See also references missing glossary entry ${id}`)
        }
        return { id, title }
    })
    return related?.length ? { ...entry, related } : entry
})

function writeIfChanged(path: string, content: string): boolean {
    try {
        if (readFileSync(path, "utf8") === content) return false
    } catch {
        // File does not exist yet
    }
    writeFileSync(path, content)
    return true
}

mkdirSync(join(rootDir, "src", "generated"), { recursive: true })
const glossaryData: Record<string, Omit<ParsedEntry, "id" | "relatedIds">> = {}
for (const entry of enrichedEntries) {
    const { id, relatedIds: _relatedIds, ...rest } = entry
    void _relatedIds
    glossaryData[id] = rest
}
const glossaryDataContent = JSON.stringify(glossaryData) + "\n"

const glossaryIdUnion = enrichedEntries
    .map((entry) => `    | ${tsString(entry.id)}`)
    .join("\n")

const glossaryContent = [
        "// Generated by web/scripts/generate-glossary.ts. Do not edit by hand.",
        'import { readFileSync } from "fs"',
        'import { join } from "path"',
        "",
        "export type GlossaryEntry = {",
        "    title: string",
        "    aliases?: string[]",
        '    kind?: "term" | "code"',
        "    importance: number",
        "    definition: string",
        "    example: string",
        "    relevance: string",
        "    intuition?: string",
        "    formula?: string",
        "    decisionRule?: string",
        "    pitfall?: string",
        "    seeAlso?: string",
        "    details?: {",
        "        title: string",
        "        content: string",
        "    }[]",
        "    usage?: {",
        "        title: string",
        "        url: string",
        "        excerpt: string",
        "    }[]",
        "    related?: {",
        "        id: string",
        "        title: string",
        "    }[]",
        "    code?: {",
        "        language: string",
        "        title: string",
        "        source: string",
        "    }",
        "}",
        "",
        "export type GlossaryEntryId =",
        glossaryIdUnion,
        "",
        "export type GlossaryEntryWithId = GlossaryEntry & { id: GlossaryEntryId }",
        "",
        "let cachedGlossaryEntries: Record<GlossaryEntryId, GlossaryEntry> | null = null",
        "",
        "export function loadGlossaryEntries(): Record<GlossaryEntryId, GlossaryEntry> {",
        "    if (!cachedGlossaryEntries) {",
        '        const dataPath = join(/* turbopackIgnore: true */ process.cwd(), "src", "generated", "glossary-data.json")',
        '        cachedGlossaryEntries = JSON.parse(readFileSync(/* turbopackIgnore: true */ dataPath, "utf8")) as Record<GlossaryEntryId, GlossaryEntry>',
        "    }",
        "    return cachedGlossaryEntries",
        "}",
        "",
        "export const GLOSSARY_ENTRIES: Record<GlossaryEntryId, GlossaryEntry> = loadGlossaryEntries()",
        "",
        "export const GLOSSARY_ENTRIES_BY_IMPORTANCE: GlossaryEntryWithId[] = Object.entries(GLOSSARY_ENTRIES)",
        "    .map(([id, entry]) => ({ id: id as GlossaryEntryId, ...entry }))",
        "    .sort((left, right) => right.importance - left.importance || left.title.localeCompare(right.title))",
        "",
        "export function getGlossaryEntry(id: string): GlossaryEntry | undefined {",
        "    const entries = loadGlossaryEntries()",
        "    return Object.hasOwn(entries, id) ? entries[id as GlossaryEntryId] : undefined",
        "}",
        "",
    ].join("\n")

const termIndexContent = [
        "// Generated by web/scripts/generate-glossary.ts. Do not edit by hand.",
        "",
        "export const GLOSSARY_TERM_LINKS = [",
        entries
            .map((entry) => [
                `    { id: ${tsString(entry.id)}, title: ${tsString(entry.title)}`,
                entry.aliases?.length ? `, aliases: ${JSON.stringify(entry.aliases)}` : "",
                `, importance: ${entry.importance}`,
                entry.kind ? `, kind: ${tsString(entry.kind)}` : "",
                " },",
            ].join(""))
            .join("\n"),
        "] as const",
        "",
    ].join("\n")

const glossaryDataWritten = writeIfChanged(dataOutputPath, glossaryDataContent)
const glossaryWritten = writeIfChanged(outputPath, glossaryContent)
const termIndexWritten = writeIfChanged(termIndexOutputPath, termIndexContent)

console.log(`${glossaryDataWritten ? "Wrote" : "Unchanged"} ${dataOutputPath} with ${entries.length} glossary entries (${(glossaryDataContent.length / 1024).toFixed(1)} KiB)`)
console.log(`${glossaryWritten ? "Wrote" : "Unchanged"} ${outputPath} with ${entries.length} glossary entries`)
console.log(`${termIndexWritten ? "Wrote" : "Unchanged"} ${termIndexOutputPath} with ${entries.length} glossary terms`)
