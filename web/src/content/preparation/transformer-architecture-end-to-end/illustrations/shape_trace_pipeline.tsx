import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 468
export const alt =
    'One causal attention read for query the with vector 0.2, 1.2. On the left, dot scores 0.20, 1.28, and 0.96 scale by square root of 2 to 0.14, 0.91, and 0.68, producing softmax weights 0.21, 0.44, and 0.35 while future token result is masked to zero. On the right, a 2D plot places the three value vertices function [1, 0], returns [0.3, 1], and the [0, 0.6] on the convex hull triangle and marks the weighted output [0.34, 0.65] inside.'

const keyRows = [
    { token: 'function', dot: '0.20', scaled: '0.14', weight: 0.21, vx: 1.0, vy: 0.0 },
    { token: 'returns', dot: '1.28', scaled: '0.91', weight: 0.44, vx: 0.3, vy: 1.0 },
    { token: 'the', dot: '0.96', scaled: '0.68', weight: 0.35, vx: 0.0, vy: 0.6 },
] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const red = fig.tone('critical')
    const amberText = isLight ? '#9a5204' : '#f2b84b'
    const amberMark = isLight ? '#d07a12' : '#f2b84b'

    // ── Left side: Scaled scores & softmax weights for query 'the' ──────────
    fig.text(20, 26, "Query 'the'", { size: 22, weight: 750, color: blue })
    fig.text(154, 26, 'q = [0.2, 1.2]', { size: 19, mono: true, color: c.textSecondary, weight: 600 })

    // Table headers
    const yHead = 74
    fig.text(20, yHead, 'Key', { size: 17, color: c.textSecondary, weight: 650 })
    fig.text(168, yHead, 'q·k', { size: 17, color: c.textSecondary, align: 'right', weight: 650 })
    fig.text(228, yHead, '/√2', { size: 17, color: c.textSecondary, align: 'right', weight: 650 })
    fig.text(248, yHead, 'Weight α', { size: 17, color: c.textSecondary, weight: 650 })
    fig.line(20, yHead + 18, 412, yHead + 18, { color: c.border, width: 1.25 })

    const barX = 248
    const barMaxW = 104

    keyRows.forEach((row, i) => {
        const y = 128 + i * 64
        const isTop = row.token === 'returns'
        const barW = Math.round((row.weight / 0.5) * barMaxW)

        fig.text(20, y, row.token, {
            size: 19,
            weight: isTop ? 750 : 650,
            color: isTop ? blue : c.textPrimary,
            width: 96,
        })
        fig.text(168, y, row.dot, {
            size: 18,
            mono: true,
            align: 'right',
            color: c.textSecondary,
        })
        fig.text(228, y, row.scaled, {
            size: 18,
            mono: true,
            align: 'right',
            color: c.textSecondary,
        })

        // Bar track + fill
        fig.rect(barX, y - 9, barMaxW, 18, {
            fill: c.bgSubtle,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            radius: 4,
        })
        fig.rect(barX, y - 9, barW, 18, {
            fill: isTop ? blue : tint(blue, c.bg, 0.72),
            radius: 4,
        })
        fig.text(412, y, row.weight.toFixed(2), {
            size: 19,
            mono: true,
            align: 'right',
            weight: 700,
            color: blue,
        })
        fig.line(20, y + 32, 412, y + 32, { color: c.borderSubtle, width: 1 })
    })

    // Future masked row: result
    const yMask = 326
    fig.rect(18, yMask - 22, 396, 44, {
        fill: tint(red, c.bg, isLight ? 0.08 : 0.14),
        stroke: red,
        strokeWidth: 1.4,
        radius: 6,
    })
    fig.text(28, yMask, 'result (future)', { size: 18, weight: 700, color: red, width: 150 })
    fig.text(228, yMask, '−∞', { size: 19, mono: true, align: 'right', color: red, weight: 700 })
    fig.text(404, yMask, '0.00 masked', {
        size: 18,
        mono: true,
        align: 'right',
        color: red,
        weight: 650,
    })

    // Weighted blend summary
    fig.text(20, 396, 'Weighted value blend:', { size: 17, color: c.textSecondary, weight: 600 })
    fig.text(20, 428, 'Σ αᵢ vᵢ = [0.34, 0.65]', {
        size: 20,
        mono: true,
        color: amberText,
        weight: 750,
    })

    // Vertical divider
    fig.line(432, 20, 432, height - 20, { color: c.borderSubtle, width: 1.25 })

    // ── Right side: 2D Convex Hull Plot of Value Vectors ────────────────────
    fig.text(452, 26, 'Value mixture in 2D hull', { size: 22, weight: 750, color: amberText })

    const plot = fig.plot(
        { x: 496, y: 84, width: 274, height: 290 },
        { x: [-0.12, 1.18], y: [-0.14, 1.22] },
    )
    plot.axes({
        xTicks: [0, 0.5, 1],
        yTicks: [0, 0.5, 1],
        grid: true,
        labelSize: 17,
        yLabel: 'Value dim 2',
    })
    fig.text(plot.area.x + plot.area.width / 2, plot.bottom + 46, 'Value dim 1', {
        size: 17,
        color: c.textSecondary,
        align: 'center',
    })

    // Convex hull triangle polygon
    const triPts = keyRows.map((r) => [plot.px(r.vx), plot.py(r.vy)] as const)
    const triD =
        `M${triPts[0]![0].toFixed(1)} ${triPts[0]![1].toFixed(1)}` +
        `L${triPts[1]![0].toFixed(1)} ${triPts[1]![1].toFixed(1)}` +
        `L${triPts[2]![0].toFixed(1)} ${triPts[2]![1].toFixed(1)}Z`
    fig.path(triD, {
        fill: tint(blue, c.bg, isLight ? 0.14 : 0.2),
        color: blue,
        width: 2.2,
    })

    // Dashed pull segments from each vertex to weighted read (0.34, 0.65)
    const rx = plot.px(0.34)
    const ry = plot.py(0.65)
    for (const row of keyRows) {
        fig.line(plot.px(row.vx), plot.py(row.vy), rx, ry, {
            color: amberMark,
            width: 1.6,
            dash: '5 4',
            opacity: 0.85,
        })
        plot.point(row.vx, row.vy, { color: blue, r: 6 })
    }

    // Weighted output point
    fig.circle(rx, ry, 8.5, {
        fill: amberMark,
        stroke: c.bg,
        width: 2.5,
    })

    // Direct vertex labels (cleanly positioned outside triangle edges with zero overlap)
    // returns [0.3, 1] at top right of vertex
    fig.text(plot.px(0.3) + 12, plot.py(1.0) - 8, 'returns [0.3, 1]', {
        size: 17,
        color: blue,
        weight: 650,
        width: 160,
    })
    // the [0, 0.6] clearly below the bottom-left triangle edge
    fig.text(plot.px(0.02), plot.py(0.14), 'the [0, 0.6]', {
        size: 16,
        color: blue,
        weight: 650,
        width: 115,
    })
    fig.line(plot.px(0.0) + 1, plot.py(0.55), plot.px(0.06), plot.py(0.22), {
        color: blue,
        width: 1.3,
        opacity: 0.7,
    })
    // function [1, 0] clearly below-left of (1, 0) clear of triangle hypotenuse
    fig.text(plot.px(0.92), plot.py(-0.08), 'function [1, 0]', {
        size: 17,
        color: blue,
        align: 'right',
        weight: 650,
        width: 145,
    })

    // Callout for weighted output [0.34, 0.65] cleanly in open upper-right space clear of right edge
    fig.callout([rx + 9, ry - 2], [plot.px(0.68), plot.py(0.76)], 'Read', {
        color: amberMark,
        labelColor: amberText,
        size: 16,
        weight: 750,
        bend: -0.14,
        align: 'left',
        head: 5.5,
    })
    fig.text(plot.px(0.68) + 6, plot.py(0.76) + 22, '[0.34, 0.65]', {
        size: 16,
        mono: true,
        color: amberText,
        weight: 750,
        width: 132,
    })

    return fig.render()
}

export default create('dark')
