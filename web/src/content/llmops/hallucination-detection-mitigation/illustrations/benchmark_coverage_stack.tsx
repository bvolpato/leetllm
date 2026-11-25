import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 415
export const alt =
    'Bar chart on a 0 to 30 percent scale showing unsupported claim rates dropping cumulatively across layered mitigation stages: 28 percent on unverified RAG drafts, 21 percent with grounded prompting, 14 percent with SelfCheck consistency, 8 percent with atomic claim pruning, and 4 percent with corrective retrieval plus a calibrated verification gate.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const red = fig.tone('critical')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const blue = fig.tone('blue')
    const green = fig.tone('green')

    fig.text(64, 20, 'Unsupported-claim rate across defense layers', {
        size: 16.5,
        weight: 700,
        color: c.textPrimary,
    })

    const plot = fig.plot(
        { x: 64, y: 58, width: 650, height: 294 },
        { x: [0, 5], y: [0, 32] },
    )
    plot.axes({
        yTicks: [0, 10, 20, 30],
        yFormat: (v) => `${v}%`,
        yLabel: 'Unsupported claims (%)',
        grid: true,
        labelSize: 13.5,
    })

    const stages = [
        { cx: 0.5, label: 'Draft', sub: 'Unverified RAG', value: 28, color: red },
        { cx: 1.5, label: 'Prompt', sub: 'Grounded cite', value: 21, color: warm },
        { cx: 2.5, label: 'SelfCheck', sub: 'Consistency', value: 14, color: purple },
        { cx: 3.5, label: 'Prune', sub: 'Atomic NLI', value: 8, color: blue },
        { cx: 4.5, label: 'Retry + Gate', sub: 'Corrective', value: 4, color: green },
    ]

    const barW = 74
    for (const s of stages) {
        const x = plot.px(s.cx) - barW / 2
        const yTop = plot.py(s.value)
        const h = plot.bottom - yTop
        fig.rect(x, yTop, barW, h, {
            fill: tint(s.color, c.bg, 0.3),
            stroke: s.color,
            strokeWidth: 1.7,
            radius: 5,
        })
        fig.text(plot.px(s.cx), yTop - 14, `${s.value}%`, {
            size: 15,
            weight: 700,
            color: s.color,
            align: 'center',
            mono: true,
        })
        fig.text(plot.px(s.cx), plot.bottom + 18, s.label, {
            size: 13.5,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
        })
        fig.text(plot.px(s.cx), plot.bottom + 37, s.sub, {
            size: 12,
            color: c.textSecondary,
            align: 'center',
        })
    }

    // Crisp reduction trend callout in upper-right open whitespace
    fig.callout(
        [plot.px(4.5), plot.py(4) - 28],
        [plot.px(3.65), plot.py(26.5)],
        '-86% unsupported rate (28% -> 4%)',
        { color: green, size: 13.5, weight: 700, bend: -0.2, align: 'right' },
    )

    return fig.render()
}

export default create('dark')
