import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 385
export const alt =
    'Paired bar charts compare LLM-judge win rates across (A, B) and (B, A) presentation orders. Left (unsafe-tool-refusal) shows order-stable consensus: response A wins 88% first and 84% second (Admit A). Right (verbose-answer) exposes slot-1 position bias: A wins 74% when placed first, then drops to 28% when placed second as B climbs to 72% (Withhold for review).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const muted = c.textSecondary

    // Top legend
    fig.rect(220, 14, 14, 12, { fill: blue, radius: 3 })
    fig.text(240, 20, 'Response A win rate', { size: 13, weight: 700, color: blue })
    fig.rect(414, 14, 14, 12, { fill: purple, radius: 3 })
    fig.text(434, 20, 'Response B win rate', { size: 13, weight: 700, color: purple })

    const panels = [
        {
            x0: 56,
            title: 'Order-stable: unsafe-tool-refusal',
            badge: 'Consensus: A wins both orders → Admit A',
            badgeTone: green,
            groups: [
                { label: 'Order (A, B)', a: 88, b: 12 },
                { label: 'Order (B, A)', a: 84, b: 16 },
            ],
        },
        {
            x0: 432,
            title: 'Position bias: verbose-answer',
            badge: 'Slot-1 flip: A then B wins → Withhold',
            badgeTone: red,
            groups: [
                { label: 'Order (A, B)', a: 74, b: 26 },
                { label: 'Order (B, A)', a: 28, b: 72 },
            ],
        },
    ]

    const plotW = 296
    const plotTop = 84
    const plotBot = 286
    const plotH = plotBot - plotTop

    panels.forEach((p, pIdx) => {
        fig.text(p.x0 + plotW / 2, 54, p.title, {
            size: 14,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
        })

        // Clean round y-ticks: 0, 25, 50, 75, 100%
        ;[0, 25, 50, 75, 100].forEach((v) => {
            const py = plotBot - (v / 100) * plotH
            fig.line(p.x0, py, p.x0 + plotW, py, {
                color: v === 0 ? c.textMuted : c.borderSubtle,
                width: 1,
                dash: v === 0 ? undefined : '3 3',
            })
            fig.text(p.x0 - 8, py, `${v}%`, {
                size: 12,
                mono: true,
                color: muted,
                align: 'right',
            })
        })
        fig.line(p.x0, plotTop, p.x0, plotBot, { color: c.textMuted, width: 1 })

        // Two paired groups: (A, B) and (B, A)
        const groupCenters = [p.x0 + 82, p.x0 + 216]
        const barW = 42
        const innerGap = 8

        p.groups.forEach((g, gIdx) => {
            const cx = groupCenters[gIdx]!
            const xA = cx - barW - innerGap / 2
            const xB = cx + innerGap / 2
            const hA = (g.a / 100) * plotH
            const hB = (g.b / 100) * plotH

            fig.rect(xA, plotBot - hA, barW, hA, {
                fill: tint(blue, c.bg, 0.4),
                stroke: blue,
                strokeWidth: 1.5,
                radius: 4,
            })
            fig.text(xA + barW / 2, plotBot - hA - 12, `${g.a}%`, {
                size: 13,
                mono: true,
                weight: 700,
                color: blue,
                align: 'center',
            })

            fig.rect(xB, plotBot - hB, barW, hB, {
                fill: tint(purple, c.bg, 0.4),
                stroke: purple,
                strokeWidth: 1.5,
                radius: 4,
            })
            fig.text(xB + barW / 2, plotBot - hB - 12, `${g.b}%`, {
                size: 13,
                mono: true,
                weight: 700,
                color: purple,
                align: 'center',
            })

            fig.text(cx, plotBot + 18, g.label, {
                size: 13,
                mono: true,
                weight: 600,
                color: c.textPrimary,
                align: 'center',
            })
        })

        // Verdict pill centered below panel
        const pillY = 330
        fig.rect(p.x0 - 4, pillY, plotW + 8, 32, {
            fill: tint(p.badgeTone, c.bg, 0.14),
            stroke: p.badgeTone,
            strokeWidth: 1.4,
            radius: 16,
        })
        fig.text(p.x0 + plotW / 2, pillY + 16, p.badge, {
            size: 12,
            weight: 700,
            color: p.badgeTone,
            align: 'center',
        })

        if (pIdx === 0) {
            fig.line(384, 46, 384, 366, { color: c.borderSubtle, width: 1 })
        }
    })

    return fig.render()
}

export default create('dark')
