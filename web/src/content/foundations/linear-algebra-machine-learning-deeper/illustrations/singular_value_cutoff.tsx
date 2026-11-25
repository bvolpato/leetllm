import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const alt =
    'Rank-one truncation collapses distinct token vectors kernel [1, 0] and essay [0, 1] onto the shared diagonal [0.5, 0.5] while keeping notebook [1, 1] exact. Side-by-side matrices and a stacked bar show 75 percent of squared energy retained and 25 percent dropped.'

export const width = 740
export const height = 470

const A_ORIG = [
    [1.0, 0.0],
    [0.0, 1.0],
    [1.0, 1.0],
] as const

const A_RANK1 = [
    [0.5, 0.5],
    [0.5, 0.5],
    [1.0, 1.0],
] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const purple = fig.tone('purple')
    const blue = fig.tone('blue')
    const cyan = fig.tone('cyan')
    const green = fig.tone('green')
    const warm = fig.tone('warm')

    // Left: Equal-scale 2D orthogonal projection plot
    fig.text(192, 24, 'Orthogonal projection onto rank-1 span', {
        size: 16,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
    })

    const plot = fig.plot(
        { x: 52, y: 56, width: 276, height: 276 },
        { x: [-0.2, 1.25], y: [-0.2, 1.25] },
    )
    plot.axes({
        xTicks: [0, 0.5, 1],
        yTicks: [0, 0.5, 1],
        xLabel: 'code',
        yLabel: 'prose',
        grid: true,
        labelSize: 15,
    })

    // Rank-1 diagonal line
    fig.line(plot.px(-0.12), plot.py(-0.12), plot.px(1.18), plot.py(1.18), {
        color: purple,
        width: 2.75,
    })
    fig.text(plot.px(1.15), plot.py(1.2), 'rank-1 span', {
        size: 15,
        weight: 600,
        color: purple,
        align: 'right',
    })

    // Orthogonal drop arrows from kernel [1,0] and essay [0,1] -> [0.5, 0.5]
    fig.arrow(plot.px(0.96), plot.py(0.04), plot.px(0.55), plot.py(0.45), {
        color: blue,
        width: 2,
        dash: '4 3',
        head: 7,
    })
    fig.arrow(plot.px(0.04), plot.py(0.96), plot.px(0.45), plot.py(0.55), {
        color: cyan,
        width: 2,
        dash: '4 3',
        head: 7,
    })

    // Right-angle marker at (0.5, 0.5)
    const d = 0.08
    fig.polyline(
        [
            [plot.px(0.5 + d), plot.py(0.5 + d)],
            [plot.px(0.5 + 2 * d), plot.py(0.5)],
            [plot.px(0.5 + d), plot.py(0.5 - d)],
        ],
        { color: c.textMuted, width: 1.1 },
    )

    // Points
    plot.point(1, 0, { color: blue, r: 6.5 })
    plot.point(0, 1, { color: cyan, r: 6.5 })
    plot.point(1, 1, { color: green, r: 6.5 })
    plot.point(0.5, 0.5, { color: warm, r: 7.5 })

    // Direct clean labels
    fig.text(plot.px(1), plot.py(0) + 18, 'kernel [1, 0]', {
        size: 15,
        weight: 600,
        color: blue,
        align: 'center',
    })
    fig.text(plot.px(0) + 8, plot.py(1) - 18, 'essay [0, 1]', {
        size: 15,
        weight: 600,
        color: cyan,
        align: 'left',
    })
    fig.text(plot.px(1) - 22, plot.py(1) + 4, 'note [1, 1]', {
        size: 15,
        weight: 600,
        color: green,
        align: 'right',
    })
    fig.callout([plot.px(0.53), plot.py(0.47)], [plot.px(0.76), plot.py(0.32)], 'collapsed [0.5, 0.5]', {
        color: warm,
        size: 15,
        weight: 600,
        bend: 0.2,
        align: 'left',
    })

    // Right: Original A -> Rank-1 A1 matrices (unified sequential palette)
    const mX = 458
    fig.text(mX + 66, 24, 'Original A', {
        size: 15.5,
        weight: 600,
        color: c.textPrimary,
        align: 'center',
    })
    fig.heatGrid(
        A_ORIG,
        { x: mX, y: 62, width: 136, height: 112 },
        {
            scale: 'sequential',
            domain: [0, 1],
            rowLabels: ['kernel', 'essay', 'note'],
            colLabels: ['code', 'prose'],
            labelSize: 15,
            valueSize: 15,
            format: (v) => v.toFixed(2),
            gap: 4,
            radius: 5,
        },
    )

    // Downward arrow between Original A and Rank-1 A1
    fig.arrow(mX + 68, 182, mX + 68, 210, { color: warm, width: 2.2, head: 7 })
    fig.text(mX + 82, 196, 'drop σ₂', { size: 15, weight: 600, color: warm, align: 'left' })

    fig.text(mX + 66, 224, 'Rank-1 A₁', {
        size: 15.5,
        weight: 600,
        color: warm,
        align: 'center',
    })
    fig.heatGrid(
        A_RANK1,
        { x: mX, y: 242, width: 136, height: 112 },
        {
            scale: 'sequential',
            domain: [0, 1],
            rowLabels: ['kernel', 'essay', 'note'],
            labelSize: 15,
            valueSize: 15,
            format: (v) => v.toFixed(2),
            gap: 4,
            radius: 5,
            highlightColor: warm,
        },
    )

    // Brace highlighting the two identical collapsed rows in A1
    fig.brace(mX + 144, 244, mX + 144, 314, 'identical rows', {
        side: -1,
        depth: 8,
        color: warm,
        labelColor: warm,
        labelSize: 15,
        labelGap: 10,
    })

    // Bottom: Clean frameless Frobenius energy bar
    const barX = 52
    const barY = 408
    const barW = width - 104
    fig.text(barX, barY - 18, 'Squared Frobenius energy split', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })
    fig.math(barX + barW, barY - 18, String.raw`\sigma_1^2 = 3,\;\; \sigma_2^2 = 1`, {
        size: 15,
        color: c.textSecondary,
        align: 'right',
    })

    const keptW = barW * 0.75
    const dropW = barW * 0.25 - 4
    fig.rect(barX, barY, keptW, 28, { fill: purple, radius: 6 })
    fig.rect(barX + keptW + 4, barY, dropW, 28, {
        fill: tint(warm, c.bg, theme === 'dark' ? 0.65 : 0.78),
        radius: 6,
    })
    fig.text(barX + keptW / 2, barY + 14, 'Kept rank-1 · 75%', {
        size: 15,
        weight: 700,
        color: theme === 'dark' ? '#0b0c10' : '#ffffff',
        align: 'center',
    })
    fig.text(barX + keptW + 4 + dropW / 2, barY + 14, 'Dropped · 25%', {
        size: 15,
        weight: 700,
        color: theme === 'dark' ? '#0b0c10' : '#ffffff',
        align: 'center',
    })

    return fig.render()
}

export default create()
