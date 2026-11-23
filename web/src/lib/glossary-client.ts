"use client"

import { useEffect, useState } from "react"
import { GLOSSARY_TERM_LINKS } from "@/generated/glossary-term-index"
import type { GlossaryEntryWithId, GlossarySummary } from "@/lib/glossary"

const summaries: GlossarySummary[] = GLOSSARY_TERM_LINKS
    .map((entry) => ({
        ...entry,
        aliases: "aliases" in entry ? [...entry.aliases] : undefined,
    }))
    .sort((left, right) => left.title.localeCompare(right.title, "en"))
const summariesById = new Map<string, GlossarySummary>(summaries.map((entry) => [entry.id, entry]))
const entries = new Map<string, GlossaryEntryWithId>()
const requests = new Map<string, Promise<GlossaryEntryWithId>>()
const MAX_CACHED_ENTRIES = 100

export function getGlossarySummaries(): readonly GlossarySummary[] {
    return summaries
}

export function getGlossarySummary(id: string): GlossarySummary | undefined {
    return summariesById.get(id)
}

function cacheEntry(entry: GlossaryEntryWithId) {
    entries.delete(entry.id)
    entries.set(entry.id, entry)
    if (entries.size > MAX_CACHED_ENTRIES) entries.delete(entries.keys().next().value!)
    return entry
}

export function loadGlossaryEntry(id: string): Promise<GlossaryEntryWithId> {
    const cached = entries.get(id)
    if (cached) return Promise.resolve(cacheEntry(cached))
    const pending = requests.get(id)
    if (pending) return pending

    const request = fetch(`/api/glossary/${encodeURIComponent(id)}`, {
        headers: { Accept: "application/json" },
    }).then(async (response) => {
        if (!response.ok) throw new Error("Could not load this definition.")
        const entry: GlossaryEntryWithId = await response.json()
        return cacheEntry(entry)
    }).finally(() => requests.delete(id))
    requests.set(id, request)
    return request
}

export function useGlossaryEntry(id: string, enabled: boolean, initialEntry?: GlossaryEntryWithId) {
    const [result, setResult] = useState<{
        id: string
        entry?: GlossaryEntryWithId
        error?: string
    }>(() => ({ id, entry: initialEntry?.id === id ? initialEntry : entries.get(id) }))
    const [attempt, setAttempt] = useState(0)
    const entry = result.id === id ? result.entry ?? entries.get(id) : entries.get(id)
    const error = result.id === id ? result.error : undefined

    useEffect(() => {
        if (initialEntry) cacheEntry(initialEntry)
        if (!enabled || !id) return
        let current = true
        loadGlossaryEntry(id).then(
            (loaded) => { if (current) setResult({ id, entry: loaded }) },
            () => { if (current) setResult({ id, error: "Could not load this definition." }) },
        )
        return () => { current = false }
    }, [id, enabled, initialEntry, attempt])

    return { entry, error, retry: () => setAttempt((value) => value + 1) }
}
