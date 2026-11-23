import { AlertTriangle, CheckCircle2, Info, Lightbulb, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

type CalloutVariant = "info" | "warning" | "tip" | "success"

const VARIANT_STYLES: Record<CalloutVariant, {
    container: string
    icon: string
    eyebrow: string
}> = {
    info: {
        container: "border-primary/20 bg-primary/[0.055]",
        icon: "text-primary",
        eyebrow: "text-primary/80",
    },
    warning: {
        container: "border-amber-500/30 bg-amber-500/10",
        icon: "text-amber-500",
        eyebrow: "text-amber-600 dark:text-amber-400",
    },
    tip: {
        container: "border-cyan-500/25 bg-cyan-500/10",
        icon: "text-cyan-600 dark:text-cyan-400",
        eyebrow: "text-cyan-700 dark:text-cyan-400",
    },
    success: {
        container: "border-emerald-500/25 bg-emerald-500/10",
        icon: "text-emerald-600 dark:text-emerald-400",
        eyebrow: "text-emerald-700 dark:text-emerald-400",
    },
}

const VARIANT_ICONS: Record<CalloutVariant, LucideIcon> = {
    info: Info,
    warning: AlertTriangle,
    tip: Lightbulb,
    success: CheckCircle2,
}

interface ContentCalloutProps {
    variant?: CalloutVariant
    title?: string
    children: ReactNode
}

export function ContentCallout({
    variant = "info",
    title,
    children,
}: ContentCalloutProps) {
    const styles = VARIANT_STYLES[variant]
    const Icon = VARIANT_ICONS[variant]

    return (
        <div
            className={`my-7 rounded-xl border px-4 py-3 shadow-sm shadow-black/5 ${styles.container}`}
            data-callout-variant={variant}
        >
            {title && (
                <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 shrink-0 ${styles.icon}`} />
                    <div className={`text-[11px] font-semibold uppercase tracking-wide ${styles.eyebrow}`}>
                        {title}
                    </div>
                </div>
            )}
            <div className="mt-2 text-sm leading-7 [color:var(--reading-ink)] [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul:last-child]:mb-0 [&_ol:last-child]:mb-0">
                {children}
            </div>
        </div>
    )
}
