import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 455
export const alt =
    'Attention KV sharing comparison where eight query heads stay fixed while stored key-value groups fall from eight in MHA, to two in GQA, to one in MQA, with relative cache bars of eight, two, and one.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig

    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')

    // Column headers
    fig.text(28, 22, 'Attention mode', { size: 13, weight: 600, color: c.textSecondary })
    fig.text(365, 22, '8 Query heads mapped to stored KV heads', {
        size: 13,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })
    fig.text(684, 22, 'Relative KV cache', {
        size: 13,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })

    const modes = [
        { name: 'MHA', sub: '8 Q : 8 KV', kv: 8, color: blue },
        { name: 'GQA', sub: '8 Q : 2 KV', kv: 2, color: green },
        { name: 'MQA', sub: '8 Q : 1 KV', kv: 1, color: warm },
    ] as const

    const qStartX = 196
    const qStep = 48
    const barX = 602
    const barMaxW = 166

    modes.forEach((m, rowIdx) => {
        const y0 = 56 + rowIdx * 134
        const qY = y0 + 26
        const kvY = y0 + 82

        // Subtle horizontal divider between rows
        if (rowIdx > 0) {
            fig.line(24, y0 - 16, width - 24, y0 - 16, {
                color: c.borderSubtle,
                width: 1,
            })
        }

        // Mode label + ratio
        fig.text(28, y0 + 36, m.name, {
            size: 18,
            weight: 700,
            color: m.color,
        })
        fig.text(28, y0 + 60, m.sub, {
            size: 13,
            color: c.textSecondary,
            mono: true,
        })

        // Tiny Q / KV row markers
        fig.text(162, qY, 'Q', {
            size: 12.5,
            weight: 700,
            color: c.textSecondary,
            align: 'right',
            mono: true,
        })
        fig.text(162, kvY, 'KV', {
            size: 12.5,
            weight: 700,
            color: m.color,
            align: 'right',
            mono: true,
        })

        // Compute centered KV head positions for each group of (8 / kv) query heads
        const groupSize = 8 / m.kv
        const kvPositions: number[] = []
        for (let g = 0; g < m.kv; g++) {
            const firstQ = qStartX + g * groupSize * qStep
            const lastQ = qStartX + ((g + 1) * groupSize - 1) * qStep
            kvPositions.push((firstQ + lastQ) / 2)
        }

        // Draw subtle grouping pills around shared Q heads in GQA / MQA
        if (m.kv < 8) {
            for (let g = 0; g < m.kv; g++) {
                const xL = qStartX + g * groupSize * qStep - 18
                const xR = qStartX + ((g + 1) * groupSize - 1) * qStep + 18
                fig.rect(xL, qY - 17, xR - xL, 34, {
                    fill: tint(m.color, c.bg, theme === 'light' ? 0.08 : 0.12),
                    stroke: tint(m.color, c.bg, 0.35),
                    strokeWidth: 1,
                    radius: 17,
                })
            }
        }

        // Fan-in lines connecting every Q head to its assigned KV head
        for (let q = 0; q < 8; q++) {
            const qx = qStartX + q * qStep
            const g = Math.floor(q / groupSize)
            const kvx = kvPositions[g]!
            fig.line(qx, qY + 11, kvx, kvY - 12, {
                color: m.color,
                width: 1.5,
                opacity: 0.65,
            })
        }

        // Draw Query head circles (outlined)
        for (let q = 0; q < 8; q++) {
            const qx = qStartX + q * qStep
            fig.circle(qx, qY, 10, {
                fill: c.bg,
                stroke: m.color,
                width: 2,
            })
        }

        // Draw KV head circles (solid filled)
        for (const kvx of kvPositions) {
            fig.circle(kvx, kvY, 11.5, {
                fill: m.color,
            })
        }

        // Right-aligned proportional KV cache bar (8x, 2x, 1x)
        const barY = y0 + 44
        const barH = 22
        fig.rect(barX, barY, barMaxW, barH, {
            fill: tint(c.textMuted, c.bg, 0.14),
            radius: 5,
        })
        fig.rect(barX, barY, (barMaxW * m.kv) / 8, barH, {
            fill: m.color,
            radius: 5,
        })
        fig.text(barX + barMaxW / 2, barY - 15, `${m.kv}× cache`, {
            size: 14.5,
            weight: 700,
            color: m.color,
            align: 'center',
            mono: true,
        })
        fig.text(
            barX + barMaxW / 2,
            barY + barH + 17,
            m.kv === 8 ? 'Baseline' : `${8 / m.kv}× smaller vs. MHA`,
            {
                size: 12,
                color: c.textSecondary,
                align: 'center',
            },
        )
    })

    return fig.render()
}

export default create('dark')
