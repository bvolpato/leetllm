import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 370
export const alt =
    'Across 10 recursive training generations (n=80, mean over 400 trials), left variance trajectories show real-plus-synthetic accumulation holding steady near 0.988 while 100% synthetic replacement collapses from 0.990 to 0.911. Right stacked bars show Round 2 training pool composition: replacement uses 100% synthetic R2 (0% real anchors), whereas accumulation retains 43% real anchors alongside 29% R1 and 29% R2.'

const accPoints = [0.9898, 0.9871, 0.9891, 0.988, 0.9875, 0.987, 0.9878, 0.9867, 0.9869, 0.9878]
const repPoints = [0.9898, 0.9776, 0.9757, 0.964, 0.9502, 0.9371, 0.9317, 0.9149, 0.9058, 0.9112]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const blue = fig.tone('blue')
    const cyan = fig.tone('cyan')
    const purple = fig.tone('purple')
    const muted = c.textSecondary

    // Left: Distribution Variance Across Generations
    fig.text(24, 22, '1. Learned variance across 10 recursive rounds', { size: 14, weight: 700 })
    const area = { x: 64, y: 66, width: 356, height: 236 }
    const plot = fig.plot(area, { x: [1, 10], y: [0.88, 1.02] })

    plot.axes({
        xTicks: [1, 2, 4, 6, 8, 10],
        yTicks: [0.9, 0.95, 1.0],
        xLabel: 'Recursive generation',
        yLabel: 'Variance (true = 1.00)',
        grid: true,
        labelSize: 12,
        xFormat: (v) => `G${v}`,
        yFormat: (v) => v.toFixed(2),
    })

    const accPairs = accPoints.map((y, i) => [i + 1, y] as const)
    const repPairs = repPoints.map((y, i) => [i + 1, y] as const)

    // Shaded collapse gap between accumulation and replacement
    plot.band(repPairs, accPairs, { fill: red, fillOpacity: 0.12 })

    plot.smoothCurve(accPairs, { color: green, width: 2.8 })
    plot.smoothCurve(repPairs, { color: red, width: 2.8 })

    accPairs.forEach(([x, y]) => plot.point(x, y, { color: green, r: 3.8 }))
    repPairs.forEach(([x, y]) => plot.point(x, y, { color: red, r: 3.8 }))

    // Direct right-end labels
    fig.text(plot.px(10) - 4, plot.py(0.9878) - 16, 'Accumulate (0.988)', {
        size: 12,
        weight: 700,
        color: green,
        align: 'right',
    })
    fig.text(plot.px(8.5), plot.py(0.955), '100% replace (0.911)', {
        size: 12,
        weight: 700,
        color: red,
        align: 'center',
    })

    // Vertical divider
    fig.line(446, 22, 446, 348, { color: c.borderSubtle, width: 1 })

    // Right: Round 2 Pool Composition (frameless stacked bars)
    const rx = 470
    const bw = 284
    fig.text(rx, 22, '2. Round 2 training pool mix', { size: 14, weight: 700 })
    fig.text(rx, 43, 'Real anchors prevent tail collapse', { size: 12, color: muted })

    // Bar 1: Replacement (2 rows = 100% Synth R2)
    const b1Y = 88
    fig.text(rx, b1Y, 'Replacement (2 rows)', { size: 14, weight: 700, color: c.textPrimary })
    fig.text(rx + bw, b1Y, '0% real anchors', {
        size: 12,
        mono: true,
        weight: 700,
        color: red,
        align: 'right',
    })
    fig.rect(rx, b1Y + 18, bw, 34, {
        fill: tint(red, c.bg, 0.34),
        stroke: red,
        strokeWidth: 1.5,
        radius: 5,
    })
    fig.text(rx + bw / 2, b1Y + 35, '100% Synth R2 (2 rows)', {
        size: 13,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(rx, b1Y + 68, 'Tail events (p=0.1): 59% missed in 5 draws.', {
        size: 12,
        color: red,
    })

    // Bar 2: Accumulation (7 rows = 3 Real + 2 R1 + 2 R2)
    const b2Y = 204
    fig.text(rx, b2Y, 'Accumulation (7 rows)', { size: 14, weight: 700, color: c.textPrimary })
    fig.text(rx + bw, b2Y, '43% real retained', {
        size: 12,
        mono: true,
        weight: 700,
        color: green,
        align: 'right',
    })

    const segs = [
        { label: 'Real (3)', frac: 3 / 7, col: blue },
        { label: 'R1 (2)', frac: 2 / 7, col: cyan },
        { label: 'R2 (2)', frac: 2 / 7, col: purple },
    ]
    let sx = rx
    segs.forEach((sg) => {
        const w = sg.frac * bw
        fig.rect(sx, b2Y + 18, w - 2, 34, {
            fill: tint(sg.col, c.bg, 0.34),
            stroke: sg.col,
            strokeWidth: 1.5,
            radius: 5,
        })
        fig.text(sx + w / 2, b2Y + 35, sg.label, {
            size: 12,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
        })
        sx += w
    })
    fig.text(rx, b2Y + 68, 'Real data anchors variance near 0.988 across rounds.', {
        size: 12,
        color: green,
    })

    // Compact legend at bottom right
    const legY = 324
    const legItems = [
        { name: 'Real anchors', col: blue, x: rx },
        { name: 'Synth R1', col: cyan, x: rx + 114 },
        { name: 'Synth R2', col: purple, x: rx + 206 },
    ]
    legItems.forEach((it) => {
        fig.rect(it.x, legY - 6, 12, 12, { fill: it.col, radius: 3 })
        fig.text(it.x + 18, legY, it.name, { size: 12, weight: 600, color: it.col })
    })

    return fig.render()
}

export default create('dark')
