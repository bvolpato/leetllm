import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 395
export const alt =
    'MTEB task-group distribution across 58 datasets alongside an STS Spearman rank-agreement schematic. Left horizontal bar chart ranks the eight MTEB categories: Retrieval 15, Classification 12, Clustering 11, STS 10, Reranking 4, Pair classification 3, Bitext mining 2, and Summarization 1. Right panel illustrates STS Spearman correlation aligning human similarity ratings (4.5/5 high, 1.2/5 low) with cosine similarity rank order.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const cyan = fig.tone('cyan')
    const red = fig.tone('critical')

    // --- Left: Focused MTEB 8 Task-Group Bar Chart (58 datasets) ---
    fig.text(28, 20, 'MTEB benchmark · 58 datasets across 8 task groups', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    const groups = [
        { label: 'Retrieval', count: 15, color: green },
        { label: 'Classification', count: 12, color: purple },
        { label: 'Clustering', count: 11, color: blue },
        { label: 'STS', count: 10, color: warm },
        { label: 'Reranking', count: 4, color: cyan },
        { label: 'Pair classification', count: 3, color: purple },
        { label: 'Bitext mining', count: 2, color: red },
        { label: 'Summarization', count: 1, color: c.textMuted },
    ]

    const barLeft = 158
    const barMaxW = 266
    const maxCount = 15
    const xOf = (n: number) => barLeft + (n / maxCount) * barMaxW
    const axisTop = 52
    const axisBot = 336

    for (const tick of [0, 5, 10, 15]) {
        const tx = xOf(tick)
        fig.line(tx, axisTop, tx, axisBot, {
            color: tick === 0 ? c.textMuted : c.borderSubtle,
            width: tick === 0 ? 1.5 : 1,
            dash: tick === 0 ? undefined : '3 3',
        })
        fig.text(tx, axisBot + 16, String(tick), {
            size: 12,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }
    fig.text(barLeft + barMaxW / 2, axisBot + 36, 'Datasets per task group (total = 58)', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    groups.forEach((g, idx) => {
        const cy = 70 + idx * 35
        const w = Math.max(10, xOf(g.count) - barLeft)
        fig.text(barLeft - 10, cy, g.label, {
            size: 13,
            weight: idx < 4 ? 700 : 500,
            color: idx === 3 ? warm : c.textPrimary,
            align: 'right',
        })
        fig.rect(barLeft, cy - 10, w, 20, {
            fill: tint(g.color, c.bg, theme === 'light' ? 0.78 : 0.85),
            stroke: g.color,
            strokeWidth: 1.25,
            radius: 4,
        })
        fig.text(barLeft + w + 8, cy, String(g.count), {
            size: 13,
            weight: 700,
            color: g.color,
            mono: true,
        })
    })

    // Vertical divider
    fig.line(476, 22, 476, 372, { color: c.borderSubtle, width: 1 })

    // --- Right: STS Spearman Rank-Correlation Mini Plot ---
    fig.text(500, 20, 'STS · Spearman rank agreement', {
        size: 15,
        weight: 600,
        color: warm,
    })
    fig.text(500, 42, 'Human rating vs cosine rank', {
        size: 12,
        color: c.textSecondary,
    })

    const plot = fig.plot({ x: 534, y: 78, width: 192, height: 184 }, { x: [0, 5], y: [0, 1] })
    plot.axes({
        xTicks: [0, 2.5, 5],
        yTicks: [0, 0.5, 1.0],
        xLabel: 'Human rating (0–5)',
        yLabel: 'Cosine',
        grid: true,
        labelSize: 12,
    })

    // Monotonic rank diagonal
    plot.curve(
        [
            [0.3, 0.08],
            [4.8, 0.94],
        ],
        { color: warm, width: 2, dash: '5 4', opacity: 0.8 },
    )

    // Two teaching pairs plotted directly
    plot.point(4.5, 0.89, { color: green, r: 6 })
    plot.point(1.2, 0.22, { color: blue, r: 6 })

    fig.callout([plot.px(4.5), plot.py(0.89)], [plot.px(2.4), plot.py(0.92)], '4.5 / 5 (high)', {
        color: green,
        size: 12,
        weight: 700,
        align: 'right',
        bend: -0.15,
    })
    fig.callout([plot.px(1.2), plot.py(0.22)], [plot.px(2.6), plot.py(0.18)], '1.2 / 5 (low)', {
        color: blue,
        size: 12,
        weight: 700,
        align: 'left',
        bend: 0.15,
    })

    // Concrete sentence-pair legend chips underneath
    fig.circle(506, 330, 4.5, { fill: green })
    fig.text(518, 330, '"CI build failed" ↔ "test run failed"', {
        size: 12,
        color: c.textPrimary,
    })
    fig.circle(506, 356, 4.5, { fill: blue })
    fig.text(518, 356, '"CI build failed" ↔ "attention mask"', {
        size: 12,
        color: c.textSecondary,
    })

    return fig.render()
}

export default create
