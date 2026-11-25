import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 360
export const alt =
    'A five-stage pretraining filtration funnel tracks 100 raw documents: Extraction retains 82 (-18 failures), Quality filtering retains 42 (-40 low-quality), Near-deduplication retains 31 (-11 duplicates), and Benchmark decontamination retains 29 (-2 flagged), yielding 29% net retained training documents.'

export const stages = [
    { id: 'raw', label: 'Raw crawl', kept: 100, removed: 0, reason: '100 starting docs' },
    {
        id: 'extraction',
        label: 'Extraction',
        kept: 82,
        removed: 18,
        reason: '−18 HTML / PDF failures',
    },
    {
        id: 'quality',
        label: 'Quality filter',
        kept: 42,
        removed: 40,
        reason: '−40 low-quality / perplexity',
    },
    {
        id: 'dedup',
        label: 'Near-dedup',
        kept: 31,
        removed: 11,
        reason: '−11 MinHash duplicates',
    },
    {
        id: 'decontam',
        label: 'Decontamination',
        kept: 29,
        removed: 2,
        reason: '−2 benchmark matches',
    },
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const cyan = fig.tone('cyan')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const muted = c.textSecondary

    // Legend at top
    fig.rect(168, 16, 14, 12, { fill: cyan, radius: 3 })
    fig.text(188, 22, 'Retained documents', { size: 13, weight: 600, color: cyan })
    fig.rect(344, 16, 14, 12, { fill: warm, radius: 3 })
    fig.text(364, 22, 'Removed at this stage', { size: 13, weight: 600, color: warm })

    const barX = 168
    const barW = 360
    const startY = 58
    const rowStep = 54

    // Subtle vertical gridlines at 0, 25, 50, 75, 100
    ;[0, 25, 50, 75, 100].forEach((v) => {
        const gx = barX + (v / 100) * barW
        fig.line(gx, startY - 8, gx, startY + 5 * rowStep - 14, {
            color: v === 0 ? c.textMuted : c.borderSubtle,
            width: 1,
            dash: v === 0 ? undefined : '3 3',
        })
        fig.text(gx, startY + 5 * rowStep + 2, `${v}`, {
            size: 12,
            mono: true,
            color: muted,
            align: 'center',
        })
    })
    fig.text(barX + barW / 2, startY + 5 * rowStep + 22, 'Documents (out of 100)', {
        size: 12,
        color: muted,
        align: 'center',
    })

    stages.forEach((st, i) => {
        const y = startY + i * rowStep
        const isFinal = i === stages.length - 1
        const keptW = (st.kept / 100) * barW
        const remW = (st.removed / 100) * barW

        // Stage name
        fig.text(barX - 14, y + 15, st.label, {
            size: 14,
            weight: 700,
            color: isFinal ? green : c.textPrimary,
            align: 'right',
        })

        // Full 100 track
        fig.rect(barX, y, barW, 30, {
            fill: tint(c.textMuted, c.bg, 0.06),
            radius: 4,
        })

        // Kept portion
        const keepCol = isFinal ? green : cyan
        fig.rect(barX, y, keptW, 30, {
            fill: tint(keepCol, c.bg, 0.38),
            stroke: keepCol,
            strokeWidth: 1.5,
            radius: 4,
        })
        fig.text(barX + keptW / 2, y + 15, String(st.kept), {
            size: 14,
            mono: true,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
        })

        // Removed-at-stage portion right next to kept
        if (st.removed > 0) {
            fig.rect(barX + keptW + 1, y, Math.max(4, remW - 1), 30, {
                fill: tint(warm, c.bg, 0.34),
                stroke: warm,
                strokeWidth: 1.4,
                radius: 4,
            })
            if (remW >= 26) {
                fig.text(barX + keptW + remW / 2, y + 15, `−${st.removed}`, {
                    size: 12,
                    mono: true,
                    weight: 700,
                    color: warm,
                    align: 'center',
                })
            }
        }

        // Right inline drop annotation
        fig.text(barX + barW + 14, y + 15, st.reason, {
            size: 13,
            weight: i === 2 ? 700 : 500,
            color: i === 2 ? warm : isFinal ? green : muted,
        })
    })

    // Final callout badge at bottom right
    fig.text(barX + barW + 14, startY + 5 * rowStep + 10, 'Net yield: 29% retained', {
        size: 14,
        weight: 700,
        color: green,
    })

    return fig.render()
}

export default create('dark')
