import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 398
export const alt =
    'An equal-scale 2D cosine-similarity plot shows two existing seed directions: Arithmetic [1, 0] and Pagination [0, 1], each surrounded by a 34.9-degree exclusion cone (cosine > 0.82). Candidate A [0.99, 0.02] lands inside the Arithmetic cone (cos 0.9998) and is rejected. Candidate B [0.45, 0.40] sits between both cones (max cos 0.7474) and enters the pool. Candidate C [0.46, 0.41] then collides with newly added B (cos 0.999999) and is rejected.'

const cosCutoff = 0.82
const halfAngle = Math.acos(cosCutoff) // ~34.9 deg

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const cyan = fig.tone('cyan')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const muted = c.textSecondary

    // Left: Equal-scale 2D embedding quadrant (x, y in [0, 1.08])
    const size = 276
    const area = { x: 56, y: 46, width: size, height: size }
    const plot = fig.plot(area, { x: [0, 1.08], y: [0, 1.08] })

    const ox = plot.px(0)
    const oy = plot.py(0)
    const rPx = plot.px(1.0) - ox

    // Shaded exclusion cones (34.9 deg from x-axis and 34.9 deg from y-axis)
    const aEndX = ox + rPx * Math.cos(halfAngle)
    const aEndY = oy - rPx * Math.sin(halfAngle)
    fig.path(
        `M${ox} ${oy} L${ox + rPx} ${oy} A${rPx} ${rPx} 0 0 0 ${aEndX.toFixed(2)} ${aEndY.toFixed(2)} Z`,
        { fill: blue, fillOpacity: 0.1, color: cyan, width: 1.4, dash: '4 3' },
    )

    const pStartX = ox + rPx * Math.sin(halfAngle)
    const pStartY = oy - rPx * Math.cos(halfAngle)
    fig.path(
        `M${ox} ${oy} L${pStartX.toFixed(2)} ${pStartY.toFixed(2)} A${rPx} ${rPx} 0 0 0 ${ox} ${oy - rPx} Z`,
        { fill: purple, fillOpacity: 0.1, color: cyan, width: 1.4, dash: '4 3' },
    )

    plot.axes({
        xTicks: [0, 0.5, 1.0],
        yTicks: [0, 0.5, 1.0],
        xLabel: 'Dim 1 (Arithmetic)',
        yLabel: 'Dim 2 (Pagination)',
        grid: true,
        labelSize: 12,
        format: (v) => v.toFixed(1),
    })

    // Seed vectors [1,0] and [0,1]
    fig.arrow(ox, oy, plot.px(1), plot.py(0), { color: blue, width: 2.6, head: 7 })
    fig.arrow(ox, oy, plot.px(0), plot.py(1), { color: purple, width: 2.6, head: 7 })

    // Candidate vectors & points: A (reject), B (keep), C (reject by B)
    fig.line(ox, oy, plot.px(0.99), plot.py(0.02), { color: red, width: 1.5, opacity: 0.55 })
    fig.line(ox, oy, plot.px(0.45), plot.py(0.4), { color: green, width: 2.2 })
    fig.line(ox, oy, plot.px(0.46), plot.py(0.41), { color: red, width: 1.4, dash: '3 3', opacity: 0.7 })

    plot.point(0.99, 0.02, { color: red, r: 5.5 })
    plot.point(0.45, 0.4, { color: green, r: 6 })
    fig.circle(plot.px(0.46), plot.py(0.41), 9.5, { fill: 'none', stroke: red, width: 1.8 })

    // Crisp non-overlapping point labels
    fig.text(plot.px(0.99) - 2, plot.py(0.02) - 16, 'A (reject)', {
        size: 12,
        weight: 700,
        color: red,
        align: 'right',
    })
    fig.text(plot.px(0.45) - 10, plot.py(0.4) - 18, 'B (keep)', {
        size: 12,
        weight: 700,
        color: green,
        align: 'right',
    })
    fig.text(plot.px(0.46) + 14, plot.py(0.41) + 12, 'C (near B)', {
        size: 12,
        weight: 700,
        color: red,
    })

    // Cutoff angle label
    fig.text(ox + 96, oy - 30, '34.9°', { size: 12, mono: true, weight: 700, color: cyan })
    fig.text(area.x + size / 2, 382, 'Cutoff: arccos(0.82) = 34.9° cone', {
        size: 12,
        mono: true,
        color: muted,
        align: 'center',
    })

    // Vertical divider
    fig.line(372, 24, 372, 364, { color: c.borderSubtle, width: 1 })

    // Right: Sequential greedy admission trace (frameless clean rows)
    const rx = 396
    fig.text(rx, 26, 'Greedy sequential pool update', { size: 15, weight: 700 })
    fig.text(rx, 47, 'Each accepted candidate expands the exclusion set', {
        size: 12,
        color: muted,
    })

    // Existing seeds badges
    fig.rect(rx, 68, 152, 26, { fill: tint(blue, c.bg, 0.14), stroke: blue, strokeWidth: 1.2, radius: 5 })
    fig.text(rx + 76, 81, 'Seed 1: [1, 0]', { size: 12, mono: true, weight: 700, color: blue, align: 'center' })
    fig.rect(rx + 164, 68, 166, 26, { fill: tint(purple, c.bg, 0.14), stroke: purple, strokeWidth: 1.2, radius: 5 })
    fig.text(rx + 247, 81, 'Seed 2: [0, 1]', { size: 12, mono: true, weight: 700, color: purple, align: 'center' })

    const steps = [
        {
            id: 'A',
            title: 'Modular inverse  [0.99, 0.02]',
            score: 'cos(A, Seed 1) = 0.9998 > 0.82',
            verdict: 'REJECT',
            col: red,
            y: 124,
        },
        {
            id: 'B',
            title: 'API pagination  [0.45, 0.40]',
            score: 'max cos = 0.7474 < 0.82 → joins pool',
            verdict: 'KEEP',
            col: green,
            y: 204,
        },
        {
            id: 'C',
            title: 'Pagination dup  [0.46, 0.41]',
            score: 'cos(C, B) = 0.999999 > 0.82 → blocked by B',
            verdict: 'REJECT',
            col: red,
            y: 284,
        },
    ]

    steps.forEach((st) => {
        fig.rect(rx, st.y, 340, 64, {
            fill: tint(st.col, c.bg, 0.08),
            stroke: tint(st.col, c.bg, 0.4),
            strokeWidth: 1.3,
            radius: 8,
        })
        fig.circle(rx + 22, st.y + 32, 13, {
            fill: tint(st.col, c.bg, 0.25),
            stroke: st.col,
            width: 1.5,
        })
        fig.text(rx + 22, st.y + 32, st.id, {
            size: 13,
            weight: 700,
            color: st.col,
            align: 'center',
        })
        fig.text(rx + 46, st.y + 21, st.title, { size: 13, weight: 700, color: c.textPrimary })
        fig.text(rx + 46, st.y + 44, st.score, { size: 11, mono: true, color: muted })
        fig.text(rx + 328, st.y + 21, st.verdict, {
            size: 12,
            mono: true,
            weight: 700,
            color: st.col,
            align: 'right',
        })
    })

    return fig.render()
}

export default create('dark')
