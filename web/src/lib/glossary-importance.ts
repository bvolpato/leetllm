export type GlossaryImportanceLevel = {
    label: string
    className: string
}

const NEUTRAL_TIER_CLASS = "border-border/70 bg-muted/40 text-muted-foreground"
const STANDARD_TIER_CLASS = "border-border bg-secondary/70 text-foreground/85"
const CORE_TIER_CLASS = "border-primary/30 bg-primary/10 text-primary"

const GLOSSARY_IMPORTANCE_LEVELS: GlossaryImportanceLevel[] = [
    { label: "Reference", className: NEUTRAL_TIER_CLASS },
    { label: "Niche", className: NEUTRAL_TIER_CLASS },
    { label: "Optional", className: NEUTRAL_TIER_CLASS },
    { label: "Context", className: NEUTRAL_TIER_CLASS },
    { label: "Background", className: NEUTRAL_TIER_CLASS },
    { label: "Supporting", className: STANDARD_TIER_CLASS },
    { label: "Applied", className: STANDARD_TIER_CLASS },
    { label: "Important", className: STANDARD_TIER_CLASS },
    { label: "Core", className: CORE_TIER_CLASS },
    { label: "Essential", className: CORE_TIER_CLASS },
]

export function getGlossaryImportanceLevel(importance: number): GlossaryImportanceLevel {
    const bucket = Math.max(0, Math.min(9, Math.floor(importance / 10)))
    return GLOSSARY_IMPORTANCE_LEVELS[bucket]
}
