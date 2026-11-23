export type GlossaryImportanceLevel = {
    label: string
    className: string
}

const GLOSSARY_IMPORTANCE_LEVELS: GlossaryImportanceLevel[] = [
    {
        label: "Reference",
        className: "border-slate-500/25 bg-slate-500/10 text-slate-700 dark:text-slate-300",
    },
    {
        label: "Niche",
        className: "border-zinc-500/25 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
    },
    {
        label: "Optional",
        className: "border-stone-500/25 bg-stone-500/10 text-stone-700 dark:text-stone-300",
    },
    {
        label: "Context",
        className: "border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    },
    {
        label: "Background",
        className: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    },
    {
        label: "Supporting",
        className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    },
    {
        label: "Applied",
        className: "border-teal-500/25 bg-teal-500/10 text-teal-700 dark:text-teal-300",
    },
    {
        label: "Important",
        className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    },
    {
        label: "Core",
        className: "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    },
    {
        label: "Essential",
        className: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    },
]

export function getGlossaryImportanceLevel(importance: number): GlossaryImportanceLevel {
    const bucket = Math.max(0, Math.min(9, Math.floor(importance / 10)))
    return GLOSSARY_IMPORTANCE_LEVELS[bucket]
}
