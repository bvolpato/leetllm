import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 400
export const alt =
    'Reciprocal Rank Fusion at k = 60. Lexical BM25 ranks policy@2 first (1/61 = 0.01639) and exception@1 second (1/62 = 0.01613) while dropping an intra-list duplicate of policy@2. Dense vector search reverses the order. Stacked contribution bars on a 0 to 0.04 scale show both documents tying at exactly 0.03252, with identity ordering placing exception@1 first.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')

    const fill = (color: string, amt = 0.12) => tint(color, c.bg, amt)

    // Formula header using crisp MathJax SVG
    fig.math(
        420,
        28,
        '\\operatorname{RRF}(d) = \\sum_{j:\\, d \\in R_j} \\frac{1}{60 + \\operatorname{rank}_{R_j}(d)}',
        { size: 16, color: c.textPrimary, align: 'center' },
    )

    // Left panel: Two input rank lists (BM25 + Dense Vector)
    fig.text(32, 74, '1. Lexical BM25', { size: 13, color: blue, weight: 700 })
    const lexItems = [
        { y: 92, label: '#1  policy@2', term: '1/61 = 0.01639', dup: false },
        { y: 130, label: '#2  exception@1', term: '1/62 = 0.01613', dup: false },
        { y: 168, label: 'dup policy@2', term: 'deduped (0)', dup: true },
    ]
    for (const item of lexItems) {
        fig.rect(32, item.y, 266, 30, {
            fill: item.dup ? tint(c.textMuted, c.bg, 0.08) : fill(blue, 0.12),
            stroke: item.dup ? c.border : blue,
            strokeWidth: item.dup ? 1 : 1.2,
            radius: 6,
        })
        fig.text(44, item.y + 15, item.label, {
            size: 13,
            color: item.dup ? c.textMuted : c.textPrimary,
            weight: item.dup ? 500 : 600,
            mono: true,
        })
        fig.text(286, item.y + 15, item.term, {
            size: 12,
            color: item.dup ? warm : blue,
            align: 'right',
            weight: 600,
            mono: true,
        })
        if (item.dup) {
            fig.line(42, item.y + 15, 148, item.y + 15, { color: warm, width: 1.2, opacity: 0.85 })
        }
    }

    fig.text(32, 224, '2. Dense Vector', { size: 13, color: green, weight: 700 })
    const vecItems = [
        { y: 242, label: '#1  exception@1', term: '1/61 = 0.01639' },
        { y: 280, label: '#2  policy@2', term: '1/62 = 0.01613' },
    ]
    for (const item of vecItems) {
        fig.rect(32, item.y, 266, 30, {
            fill: fill(green, 0.12),
            stroke: green,
            strokeWidth: 1.2,
            radius: 6,
        })
        fig.text(44, item.y + 15, item.label, {
            size: 13,
            color: c.textPrimary,
            weight: 600,
            mono: true,
        })
        fig.text(286, item.y + 15, item.term, {
            size: 12,
            color: green,
            align: 'right',
            weight: 600,
            mono: true,
        })
    }

    // Subtle connector arrow from rank lists into RRF score plot
    fig.arrow(310, 198, 344, 198, { color: c.textMuted, width: 1.6, head: 6 })

    // Right panel: Calibrated stacked RRF score plot (0 to 0.04)
    const plot = fig.plot(
        { x: 470, y: 108, width: 332, height: 196 },
        { x: [0, 0.04], y: [0, 3] },
    )
    fig.text(470, 74, 'Fused RRF Score (k = 60)', { size: 14, color: c.textPrimary, weight: 700 })

    plot.axes({
        xTicks: [0, 0.01, 0.02, 0.03, 0.04],
        xFormat: (v) => (v === 0 ? '0' : v.toFixed(2)),
        xLabel: 'Combined RRF score',
        grid: true,
        labelSize: 12,
    })

    const t1 = 1 / 61
    const t2 = 1 / 62
    const total = t1 + t2
    const barH = 38

    // Row 1 (top, y=2.15): exception@1 (1st after deterministic identity tie-break)
    const yExc = plot.py(2.15) - barH / 2
    fig.text(458, yExc + barH / 2 - 8, '1. exception@1', {
        size: 13,
        color: c.textPrimary,
        align: 'right',
        weight: 700,
        mono: true,
    })
    fig.text(458, yExc + barH / 2 + 10, 'tie-break first', {
        size: 11.5,
        color: warm,
        align: 'right',
        weight: 600,
    })
    fig.rect(plot.px(0), yExc, plot.px(t2) - plot.px(0), barH, {
        fill: fill(blue, 0.24),
        stroke: blue,
        strokeWidth: 1.3,
        radius: 4,
    })
    fig.text((plot.px(0) + plot.px(t2)) / 2, yExc + barH / 2, '1/62', {
        size: 12.5,
        color: blue,
        align: 'center',
        weight: 700,
        mono: true,
    })
    fig.rect(plot.px(t2), yExc, plot.px(total) - plot.px(t2), barH, {
        fill: fill(green, 0.24),
        stroke: green,
        strokeWidth: 1.3,
        radius: 4,
    })
    fig.text((plot.px(t2) + plot.px(total)) / 2, yExc + barH / 2, '1/61', {
        size: 12.5,
        color: green,
        align: 'center',
        weight: 700,
        mono: true,
    })

    // Row 2 (bottom, y=0.95): policy@2
    const yPol = plot.py(0.95) - barH / 2
    fig.text(458, yPol + barH / 2 - 8, '2. policy@2', {
        size: 13,
        color: c.textPrimary,
        align: 'right',
        weight: 700,
        mono: true,
    })
    fig.text(458, yPol + barH / 2 + 10, 'same total', {
        size: 11.5,
        color: c.textSecondary,
        align: 'right',
    })
    fig.rect(plot.px(0), yPol, plot.px(t1) - plot.px(0), barH, {
        fill: fill(blue, 0.24),
        stroke: blue,
        strokeWidth: 1.3,
        radius: 4,
    })
    fig.text((plot.px(0) + plot.px(t1)) / 2, yPol + barH / 2, '1/61', {
        size: 12.5,
        color: blue,
        align: 'center',
        weight: 700,
        mono: true,
    })
    fig.rect(plot.px(t1), yPol, plot.px(total) - plot.px(t1), barH, {
        fill: fill(green, 0.24),
        stroke: green,
        strokeWidth: 1.3,
        radius: 4,
    })
    fig.text((plot.px(t1) + plot.px(total)) / 2, yPol + barH / 2, '1/62', {
        size: 12.5,
        color: green,
        align: 'center',
        weight: 700,
        mono: true,
    })

    // Exact tie vertical reference line
    plot.vline(total, 'Tie: 0.03252', {
        color: warm,
        width: 1.5,
        dash: '4 4',
        labelPosition: 'top',
        labelOffset: 10,
        labelSize: 13,
        weight: 700,
    })

    // Compact legend at bottom
    fig.rect(470, 362, 12, 12, { fill: fill(blue, 0.28), stroke: blue, strokeWidth: 1.2, radius: 2 })
    fig.text(488, 368, 'Lexical term', { size: 12.5, color: c.textSecondary })
    fig.rect(598, 362, 12, 12, {
        fill: fill(green, 0.28),
        stroke: green,
        strokeWidth: 1.2,
        radius: 2,
    })
    fig.text(616, 368, 'Vector term', { size: 12.5, color: c.textSecondary })

    return fig.render()
}

export default create()
