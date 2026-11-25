import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 430
export const alt =
    'Left: total training-plus-serving FLOPs (in 10^23 units) versus served tokens for equal-quality 70B/1.4T (5.88 + 1.40T) and overtrained 30B/4.0T (7.20 + 0.60T) models. The lines cross at 1.65T served tokens and 8.19x10^23 FLOPs; above 1.65T the 30B model has lower total compute. Right: stacked bars at the 1.65T crossing decompose the identical 8.19x10^23 total into 5.88 training + 2.31 serving for 70B versus 7.20 training + 0.99 serving for 30B.'

const f70 = (t: number) => 5.88 + 1.4 * t
const f30 = (t: number) => 7.2 + 0.6 * t
const breakT = 1.65
const breakTotal = 8.19

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const warm = fig.tone('warm')
    const blue = fig.tone('blue')
    const green = fig.tone('green')

    // Left plot: Total FLOPs vs Served Tokens
    const plot = fig.plot(
        { x: 64, y: 42, width: 396, height: 316 },
        { x: [0, 3], y: [5, 10.5] },
    )

    plot.axes({
        xTicks: [0, 1, 3],
        yTicks: [5, 6, 7, 8, 9, 10],
        xFormat: (v) => (v === 0 ? '0' : `${v}T`),
        yFormat: (v) => `${v}`,
        xLabel: 'Served tokens (trillions)',
        yLabel: 'Total FLOPs (×10²³)',
        labelSize: 14,
        grid: true,
    })

    // Shade regime advantage bands
    plot.band(f70, f30, { range: [0, breakT], fill: warm, fillOpacity: 0.13, samples: 40 })
    plot.band(f30, f70, { range: [breakT, 3], fill: blue, fillOpacity: 0.13, samples: 40 })

    // Regime annotations placed cleanly in open space below curves
    fig.text(plot.px(0.68), plot.py(5.88), '70B cheaper', {
        size: 13.5,
        color: warm,
        align: 'center',
        weight: 600,
    })
    fig.text(plot.px(2.38), plot.py(7.45), '30B cheaper', {
        size: 13.5,
        color: blue,
        align: 'center',
        weight: 600,
    })

    // Vertical reference at break-even 1.65T
    plot.vline(breakT, undefined, { color: green, width: 1.5, dash: '4 4' })
    fig.text(plot.px(breakT), plot.bottom + 15, '1.65T', {
        size: 13,
        color: green,
        align: 'center',
        mono: true,
        weight: 700,
    })

    // Lines
    plot.curve(
        [
            [0, f70(0)],
            [3, f70(3)],
        ],
        { color: warm, width: 2.75 },
    )
    plot.curve(
        [
            [0, f30(0)],
            [3, f30(3)],
        ],
        { color: blue, width: 2.75 },
    )

    // Start markers (training cost only at 0 served tokens)
    fig.circle(plot.px(0), plot.py(5.88), 5, { fill: warm, stroke: c.bg, width: 1.8 })
    fig.circle(plot.px(0), plot.py(7.2), 5, { fill: blue, stroke: c.bg, width: 1.8 })

    // Crossing point (callout placed cleanly left of dashed line, leader from right edge of text)
    fig.circle(plot.px(breakT), plot.py(breakTotal), 7, { fill: green, stroke: c.bg, width: 2.2 })
    fig.text(plot.px(1.52), plot.py(9.85), 'Tie: 1.65T · 8.19×10²³', {
        size: 13.5,
        color: green,
        align: 'right',
        weight: 700,
    })
    fig.callout(
        [plot.px(breakT) - 6, plot.py(breakTotal) - 8],
        [plot.px(1.22), plot.py(9.55)],
        '',
        { color: green, bend: -0.18 },
    )

    // Direct curve labels near right edge (zero line crossing)
    fig.text(plot.px(2.94), plot.py(f70(2.94)) - 18, '70B/1.4T', {
        size: 14,
        color: warm,
        align: 'right',
        weight: 700,
    })
    fig.text(plot.px(2.94), plot.py(f30(2.94)) + 34, '30B/4.0T', {
        size: 14,
        color: blue,
        align: 'right',
        weight: 700,
    })

    // Right panel: Stacked composition bars at the 1.65T crossing (shared 0..9 scale)
    const bx = 508
    const bw = 210
    const barPlot = fig.plot({ x: bx, y: 74, width: bw, height: 284 }, { x: [0, 2], y: [0, 9.2] })

    fig.text(bx + bw / 2, 26, 'At crossing (1.65T)', {
        size: 15,
        color: c.textPrimary,
        align: 'center',
        weight: 700,
    })
    fig.text(bx + bw / 2, 46, '8.19×10²³ FLOPs each', {
        size: 13.5,
        color: green,
        align: 'center',
        mono: true,
        weight: 600,
    })

    // Shared baseline and total line at 8.19
    fig.line(bx, barPlot.bottom, bx + bw, barPlot.bottom, { color: c.textMuted, width: 1 })
    fig.line(bx, barPlot.py(breakTotal), bx + bw, barPlot.py(breakTotal), {
        color: green,
        width: 1.25,
        dash: '4 4',
    })

    const barCols = [
        { cx: bx + 56, name: '70B', train: 5.88, serve: 2.31, accent: warm },
        { cx: bx + 154, name: '30B', train: 7.2, serve: 0.99, accent: blue },
    ]
    const colW = 66
    const trainFill = tint(blue, c.bg, theme === 'dark' ? 0.34 : 0.24)
    const serveFill = tint(warm, c.bg, theme === 'dark' ? 0.38 : 0.28)

    for (const b of barCols) {
        const y0 = barPlot.py(0)
        const yTrain = barPlot.py(b.train)
        const yTop = barPlot.py(b.train + b.serve)

        // Training segment
        fig.rect(b.cx - colW / 2, yTrain, colW, y0 - yTrain, {
            fill: trainFill,
            stroke: blue,
            strokeWidth: 1.5,
            radius: 3,
        })
        fig.text(b.cx, (y0 + yTrain) / 2, b.train.toFixed(2), {
            size: 14,
            color: c.textPrimary,
            align: 'center',
            mono: true,
            weight: 700,
        })

        // Serving segment
        fig.rect(b.cx - colW / 2, yTop, colW, yTrain - yTop - 1, {
            fill: serveFill,
            stroke: warm,
            strokeWidth: 1.5,
            radius: 3,
        })
        fig.text(b.cx, (yTrain + yTop) / 2, b.serve.toFixed(2), {
            size: 13.5,
            color: c.textPrimary,
            align: 'center',
            mono: true,
            weight: 700,
        })

        // Column name under bar
        fig.text(b.cx, barPlot.bottom + 18, b.name, {
            size: 14.5,
            color: b.accent,
            align: 'center',
            weight: 700,
        })
    }

    // Compact legend below stacked bars
    const legY = barPlot.bottom + 46
    fig.rect(bx + 12, legY - 6, 12, 12, { fill: trainFill, stroke: blue, strokeWidth: 1.5, radius: 2 })
    fig.text(bx + 30, legY, 'Training', { size: 13.5, color: c.textSecondary, weight: 600 })
    fig.rect(bx + 114, legY - 6, 12, 12, { fill: serveFill, stroke: warm, strokeWidth: 1.5, radius: 2 })
    fig.text(bx + 132, legY, 'Serving', { size: 13.5, color: c.textSecondary, weight: 600 })

    return fig.render()
}

export default create('dark')
