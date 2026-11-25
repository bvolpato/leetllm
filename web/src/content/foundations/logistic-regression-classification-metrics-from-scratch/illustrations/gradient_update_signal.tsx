import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 860
export const height = 420
export const alt =
    'Diverging signed-gradient heatmap for eight training responses at w = 0 (p = 0.5) beside column-mean gradient and first-step weight bars. Negative row terms (blue) pull weights up and positive terms (red) pull weights down. Averaging columns yields g = [0.000, -0.344, -0.375], and stepping by lr = 0.2 produces first weights w+ = [0.000, +0.069, +0.075].'

const ROWS = [
    { id: 'R1', x: [1, 1.0, 1], y: 0 },
    { id: 'R2', x: [1, 1.5, 2], y: 0 },
    { id: 'R3', x: [1, 2.0, 3], y: 1 },
    { id: 'R4', x: [1, 3.5, 6], y: 1 },
    { id: 'R5', x: [1, 4.0, 7], y: 1 },
    { id: 'R6', x: [1, 4.5, 5], y: 1 },
    { id: 'R7', x: [1, 2.8, 4], y: 0 },
    { id: 'R8', x: [1, 3.2, 8], y: 0 },
] as const

const GRID_DATA = ROWS.map((row) => {
    const err = 0.5 - row.y
    return [err, err * row.x[0], err * row.x[1], err * row.x[2]]
})

const MEANS = [0, 1, 2].map(
    (j) => GRID_DATA.reduce((s, r) => s + r[j + 1]!, 0) / GRID_DATA.length,
)
const WEIGHTS_NEXT = MEANS.map((g) => -0.2 * g)

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const red = fig.tone('critical')
    const green = fig.tone('green')
    const isLight = theme === 'light'

    // Left: Diverging signed-gradient heatGrid (8 rows x 4 cols)
    fig.text(64, 22, 'Row gradient contributions at w = 0 (p = 0.5)', {
        size: 15,
        weight: 700,
    })

    fig.heatGrid(
        GRID_DATA,
        { x: 66, y: 66, width: 392, height: 292 },
        {
            scale: 'diverging',
            domain: [-4.0, 4.0],
            center: 0,
            rowLabels: ROWS.map((r) => `${r.id} (y=${r.y})`),
            colLabels: ['p − y', '× 1 (w₀)', '× x₁ (w₁)', '× x₂ (w₂)'],
            labelSize: 12,
            valueSize: 13,
            showValues: true,
            format: (v) => (v > 0 ? `+${v.toFixed(2)}` : `−${Math.abs(v).toFixed(2)}`),
            gap: 4,
            radius: 5,
            highlightRow: 3, // R4 worked example in prose
            highlightColor: fig.tone('warm'),
        },
    )

    // Compact diverging color key under heatmap
    fig.rect(66, 376, 16, 12, { fill: isLight ? '#1f6fb2' : '#4fb4e8', radius: 3 })
    fig.text(88, 382, 'g < 0 (raises weight)', { size: 12, color: c.textSecondary })
    fig.rect(260, 376, 16, 12, { fill: isLight ? '#c62f2f' : '#e85d5d', radius: 3 })
    fig.text(282, 382, 'g > 0 (lowers weight)', { size: 12, color: c.textSecondary })

    // Divider
    fig.line(482, 28, 482, 392, { color: c.borderSubtle, width: 1 })

    // Right top: Column-mean gradient bars g = (1/8) X^T(p - y)
    const rx = 510
    fig.text(rx, 22, 'Column mean gradient g', { size: 15, weight: 700 })
    fig.math(834, 22, 'g = \\frac{1}{N} X^\\top (p - y)', {
        size: 13,
        color: c.textSecondary,
        align: 'right',
    })

    const gPlot = fig.plot(
        { x: 562, y: 56, width: 256, height: 128 },
        { x: [-0.5, 0.2], y: [0, 3] },
    )
    const x0G = gPlot.px(0)
    fig.line(x0G, 56, x0G, 184, { color: c.textMuted, width: 1.5 })
    for (const tick of [-0.4, -0.2, 0]) {
        const px = gPlot.px(tick)
        fig.line(px, 184, px, 189, { color: c.textMuted, width: 1 })
        fig.text(px, 200, tick === 0 ? '0' : tick.toFixed(1), {
            size: 11,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    const colNames = ['w₀ (1)', 'w₁ (x₁)', 'w₂ (x₂)']
    MEANS.forEach((val, idx) => {
        const y = 76 + idx * 38
        fig.text(552, y, colNames[idx]!, {
            size: 13,
            weight: 600,
            color: c.textSecondary,
            align: 'right',
            mono: true,
        })
        const pxVal = gPlot.px(val)
        const leftX = Math.min(pxVal, x0G)
        const bw = Math.max(2, Math.abs(pxVal - x0G))
        if (Math.abs(val) > 1e-4) {
            fig.rect(leftX, y - 10, bw, 20, {
                fill: tint(blue, c.bg, isLight ? 0.28 : 0.42),
                stroke: blue,
                strokeWidth: 1.5,
                radius: 4,
            })
        } else {
            fig.circle(x0G, y, 4.5, { fill: c.textMuted })
        }
        fig.text(val < 0 ? leftX - 8 : x0G + 10, y, val === 0 ? '0.000' : `−${Math.abs(val).toFixed(3)}`, {
            size: 12,
            weight: 700,
            color: val === 0 ? c.textMuted : blue,
            align: val < 0 ? 'right' : 'left',
            mono: true,
        })
    })

    // Right bottom: First weight update w+ = w - 0.2 * g
    fig.line(rx, 224, 836, 224, { color: c.borderSubtle, width: 1 })
    fig.text(rx, 246, 'First update (η = 0.2)', { size: 15, weight: 700 })
    fig.math(834, 246, 'w^{+} = w - 0.2\\,g', {
        size: 14,
        color: green,
        align: 'right',
    })

    const wPlot = fig.plot(
        { x: 562, y: 274, width: 256, height: 112 },
        { x: [-0.02, 0.11], y: [0, 3] },
    )
    const x0W = wPlot.px(0)
    fig.line(x0W, 274, x0W, 386, { color: c.textMuted, width: 1.5 })
    for (const tick of [0, 0.04, 0.08]) {
        const px = wPlot.px(tick)
        fig.line(px, 386, px, 391, { color: c.textMuted, width: 1 })
        fig.text(px, 402, tick === 0 ? '0' : `+${tick.toFixed(2)}`, {
            size: 11,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    WEIGHTS_NEXT.forEach((val, idx) => {
        const y = 294 + idx * 34
        fig.text(552, y, colNames[idx]!, {
            size: 13,
            weight: 600,
            color: c.textSecondary,
            align: 'right',
            mono: true,
        })
        const pxVal = wPlot.px(val)
        if (Math.abs(val) > 1e-4) {
            fig.rect(x0W, y - 9, pxVal - x0W, 18, {
                fill: tint(green, c.bg, isLight ? 0.26 : 0.38),
                stroke: green,
                strokeWidth: 1.5,
                radius: 4,
            })
        } else {
            fig.circle(x0W, y, 4.5, { fill: c.textMuted })
        }
        fig.text(pxVal + 8, y, val === 0 ? '0.000' : `+${val.toFixed(3)}`, {
            size: 12,
            weight: 700,
            color: val === 0 ? c.textMuted : green,
            mono: true,
        })
    })

    return fig.render()
}

export default create
