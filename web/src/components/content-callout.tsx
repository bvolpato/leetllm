import { AlertTriangle, CheckCircle2, Info, Lightbulb, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

type CalloutVariant = "info" | "warning" | "tip" | "success"

const VARIANT_STYLES: Record<CalloutVariant, {
    container: string
    icon: string
    eyebrow: string
}> = {
    info: {
        container: "border-l-[3px] border-l-primary border [border-color:var(--reading-border)] bg-primary/[0.04]",
        icon: "text-primary",
        eyebrow: "text-primary",
    },
    warning: {
        container: "border-l-[3px] border-l-amber-500/85 border border-amber-500/25 bg-amber-500/[0.05]",
        icon: "text-amber-700 dark:text-amber-400",
        eyebrow: "text-amber-800 dark:text-amber-300",
    },
    tip: {
        container: "border-l-[3px] border-l-primary/70 border [border-color:var(--reading-border)] [background:var(--reading-panel)]",
        icon: "text-primary",
        eyebrow: "text-primary",
    },
    success: {
        container: "border-l-[3px] border-l-emerald-600/80 dark:border-l-emerald-500/80 border [border-color:var(--reading-border)] bg-emerald-500/[0.04]",
        icon: "text-emerald-700 dark:text-emerald-400",
        eyebrow: "text-emerald-700 dark:text-emerald-300",
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
