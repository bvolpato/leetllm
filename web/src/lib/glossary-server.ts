import "server-only"

import { GLOSSARY_ENTRIES } from "@/generated/glossary"
import type { GlossaryEntryId, GlossaryEntryWithId, GlossarySummary } from "@/lib/glossary"

export { GLOSSARY_ENTRIES, GLOSSARY_ENTRIES_BY_IMPORTANCE } from "@/generated/glossary"

export const GLOSSARY_SUMMARIES: GlossarySummary[] = Object.entries(GLOSSARY_ENTRIES)
    .map(([id, entry]) => ({
        id: id as GlossaryEntryId,
        title: entry.title,
        aliases: "aliases" in entry ? [...entry.aliases] : undefined,
        kind: "kind" in entry ? entry.kind : undefined,
        importance: entry.importance,
    }))
    .sort((left, right) => left.title.localeCompare(right.title, "en"))

export function getGlossaryEntry(id: string): GlossaryEntryWithId | undefined {
    if (!Object.hasOwn(GLOSSARY_ENTRIES, id)) return undefined
    return { id: id as GlossaryEntryId, ...GLOSSARY_ENTRIES[id as GlossaryEntryId] }
}

const searchEntries = Object.entries(GLOSSARY_ENTRIES).map(([id, value]) => {
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

export function searchGlossary(query: string): string[] {
    const normalized = query.toLowerCase().trim()
    return searchEntries.filter((entry) => entry.text.includes(normalized)).map((entry) => entry.id)
}
