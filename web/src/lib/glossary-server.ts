import "server-only"

import { readFileSync } from "fs"
import { join } from "path"
import { GLOSSARY_TERM_LINKS } from "@/generated/glossary-term-index"
import type { GlossaryEntry, GlossaryEntryId, GlossaryEntryWithId, GlossarySummary } from "@/lib/glossary"

let entriesCache: Record<GlossaryEntryId, GlossaryEntry> | null = null

function getGlossaryEntries(): Record<GlossaryEntryId, GlossaryEntry> {
    if (!entriesCache) {
        const dataPath = join(/* turbopackIgnore: true */ process.cwd(), "src", "generated", "glossary-data.json")
        entriesCache = JSON.parse(readFileSync(/* turbopackIgnore: true */ dataPath, "utf8")) as Record<GlossaryEntryId, GlossaryEntry>
    }
    return entriesCache
}

export const GLOSSARY_SUMMARIES: GlossarySummary[] = GLOSSARY_TERM_LINKS
    .map((entry) => ({
        id: entry.id as GlossaryEntryId,
        title: entry.title,
        aliases: "aliases" in entry ? [...entry.aliases] : undefined,
        kind: "kind" in entry ? entry.kind : undefined,
        importance: entry.importance,
    }))
    .sort((left, right) => left.title.localeCompare(right.title, "en"))

export function getGlossaryEntry(id: string): GlossaryEntryWithId | undefined {
    const entries = getGlossaryEntries()
    if (!Object.hasOwn(entries, id)) return undefined
    return { id: id as GlossaryEntryId, ...entries[id as GlossaryEntryId] }
}

let searchEntries: Array<{ id: string; text: string }> | null = null

function getSearchEntries(): Array<{ id: string; text: string }> {
    if (!searchEntries) {
        searchEntries = Object.entries(getGlossaryEntries()).map(([id, value]) => {
            const entry: GlossaryEntryWithId = { id: id as GlossaryEntryId, ...value }
            const text = [
                entry.title,
                entry.aliases?.join(" "),
                entry.definition,
                entry.example,
                entry.relevance,
                entry.intuition,
                entry.formula,
                entry.decisionRule,
                entry.pitfall,
                entry.details?.map((detail) => `${detail.title} ${detail.content}`).join(" "),
                entry.related?.map((related) => related.title).join(" "),
            ].filter(Boolean).join(" ").toLowerCase()
            return { id, text }
        })
    }
    return searchEntries
}

export function searchGlossary(query: string): string[] {
    const normalized = query.toLowerCase().trim()
    return getSearchEntries().filter((entry) => entry.text.includes(normalized)).map((entry) => entry.id)
}
