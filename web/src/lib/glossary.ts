export type {
    GlossaryEntry,
    GlossaryEntryId,
    GlossaryEntryWithId,
} from "@/generated/glossary"

import type { GlossaryEntryWithId } from "@/generated/glossary"

export type GlossarySummary = Pick<GlossaryEntryWithId, "id" | "title" | "aliases" | "kind" | "importance">
