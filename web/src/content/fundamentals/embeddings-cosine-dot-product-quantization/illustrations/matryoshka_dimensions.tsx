import type { ThemeMode, ToneName } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 405
export const alt =
    'Three-stage visual of Matryoshka 4d-to-2d prefix truncation. Left: four 4d vectors split into Head [d0, d1] and Tail [d2, d3] show query q [1,0|0,1], flash-attn [1,0|0,1], and sparse-attn [1,0|1,0] share identical heads while rope-enc is [0,1|0,1]. Center: 2d prefix space (d0, d1) collapses flash-attn and sparse-attn onto ray (1, 0) at cosine 1.00. Right: paired 2d vs 4d cosine bars show full 4d rescoring separates flash-attn (1.00) from sparse-attn (0.50).'

const vectors: Array<{
    name: string
    head: [number, number]
    tail: [number, number]
    cos2d: number
    cos4d: number
    tone: ToneName
}> = [
    { name: 'query q', head: [1, 0], tail: [0, 1], cos2d: 1.0, cos4d: 1.0, tone: 'cyan' },
    { name: 'flash-attn', head: [1, 0], tail: [0, 1], cos2d: 1.0, cos4d: 1.0, tone: 'green' },
    { name: 'sparse-attn', head: [1, 0], tail: [1, 0], cos2d: 1.0, cos4d: 0.5, tone: 'warm' },
    { name: 'rope-enc', head: [0, 1], tail: [0, 1], cos2d: 0.0, cos4d: 0.5, tone: 'blue' },
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const cyan = fig.tone('cyan')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const blue = fig.tone('blue')
    const isDark = theme === 'dark'

    // ─── LEFT: 4D vectors partitioned into Head [d0,d1] | Tail [d2,d3] ───
    fig.text(128, 22, '1. 4D vectors  (head | tail)', {
        size: 14,
        color: c.textPrimary,
        align: 'center',
        weight: 700,
    })

    const vecX = 112
    const cellW = 26
    const cellH = 30
    const cellGap = 4
    const tailGap = 12

    // Column labels d0, d1 | d2, d3
    const colPos = [
        vecX,
        vecX + cellW + cellGap,
        vecX + 2 * (cellW + cellGap) + tailGap,
        vecX + 3 * (cellW + cellGap) + tailGap,
    ]
    ;['d₀', 'd₁', 'd₂', 'd₃'].forEach((d, j) => {
        fig.text(colPos[j]! + cellW / 2, 54, d, {
            size: 14,
            color: j < 2 ? c.textPrimary : c.textSecondary,
            align: 'center',
            mono: true,
            weight: j < 2 ? 700 : 500,
        })
    })

    // Vertical prefix-cut dashed line between d1 and d2
    const cutX = vecX + 2 * cellW + cellGap + tailGap / 2
    fig.line(cutX, 46, cutX, 322, { color: warm, width: 1.5, dash: '4 4' })

    vectors.forEach((v, idx) => {
        const ry = 92 + idx * 62
        const col = fig.tone(v.tone)
        fig.text(vecX - 10, ry, v.name, {
            size: 14,
            color: col,
            align: 'right',
            mono: true,
            weight: 700,
        })
        const coords = [...v.head, ...v.tail]
        coords.forEach((val, j) => {
            const x = colPos[j]!
            const isTail = j >= 2
            fig.rect(x, ry - cellH / 2, cellW, cellH, {
                fill:
                    val === 1
                        ? tint(col, c.bg, isTail ? (isDark ? 0.22 : 0.14) : isDark ? 0.38 : 0.26)
                        : tint(c.textMuted, c.bg, 0.08),
                stroke: val === 1 ? col : c.borderSubtle,
                strokeWidth: val === 1 ? (isTail ? 1.2 : 1.6) : 1,
                radius: 4,
                opacity: isTail ? 0.85 : 1,
            })
            fig.text(x + cellW / 2, ry, String(val), {
                size: 14,
                color: val === 1 ? c.textPrimary : c.textMuted,
                align: 'center',
                mono: true,
                weight: val === 1 ? 700 : 400,
            })
        })
    })

    fig.brace(colPos[0]!, 328, colPos[1]! + cellW, 328, '2D kept', {
        side: 1,
        depth: 8,
        color: green,
        labelColor: green,
        labelSize: 14,
        weight: 700,
    })
    fig.brace(colPos[2]!, 328, colPos[3]! + cellW, 328, 'Tail', {
        side: 1,
        depth: 8,
        color: c.textMuted,
        labelColor: c.textSecondary,
        labelSize: 14,
    })

    // ─── CENTER: 2D prefix space (d0, d1) showing collision onto (1, 0) ───
    fig.text(376, 22, '2. 2D prefix collision', {
        size: 14,
        color: c.textPrimary,
        align: 'center',
        weight: 700,
    })

    const geo = fig.plot({ x: 294, y: 74, width: 170, height: 170 }, { x: [-0.18, 1.28], y: [-0.18, 1.28] })
    geo.axes({
        xTicks: [0, 1],
        yTicks: [0, 1],
        xLabel: 'd₀',
        yLabel: 'd₁',
        labelSize: 14,
        grid: true,
    })

    // Unit quarter circle arc
    const arcPts: [number, number][] = []
    for (let i = 0; i <= 48; i++) {
        const theta = (i / 48) * (Math.PI / 2)
        arcPts.push([Math.cos(theta), Math.sin(theta)])
    }
    geo.curve(arcPts, { color: c.borderLight, width: 1.25, dash: '4 4' })

    const ox = geo.px(0)
    const oy = geo.py(0)

    // rope-enc vector -> (0, 1)
    fig.arrow(ox, oy, geo.px(0), geo.py(1), { color: blue, width: 2.6, head: 7 })
    fig.circle(geo.px(0), geo.py(1), 5, { fill: blue, stroke: c.bg, width: 1.6 })
    fig.text(geo.px(0.08), geo.py(1.06), 'rope (0, 1)', {
        size: 14,
        color: blue,
        weight: 700,
    })

    // Colliding vectors -> (1, 0): draw slightly separated parallel rays or stacked strokes to show overlap clearly!
    fig.arrow(ox, oy + 2.5, geo.px(1), geo.py(0) + 2.5, { color: warm, width: 3.2, head: 7 })
    fig.arrow(ox, oy - 2.5, geo.px(1), geo.py(0) - 2.5, { color: green, width: 2.6, head: 7 })
    fig.circle(geo.px(1), geo.py(0), 6.5, { fill: cyan, stroke: c.bg, width: 2 })

    // Collision callout box-free above (1, 0)
    fig.text(geo.px(0.74), geo.py(0.34), 'q, flash & sparse', {
        size: 14,
        color: warm,
        align: 'center',
        weight: 700,
    })
    fig.text(geo.px(0.74), geo.py(0.18), 'all collapse to (1, 0)', {
        size: 14,
        color: c.textSecondary,
        align: 'center',
    })

    fig.text(378, 326, 'cos₂d = 1.00 tie!', {
        size: 14,
        color: warm,
        align: 'center',
        mono: true,
        weight: 700,
    })

    // ─── RIGHT: Cosine separation (2D prefix vs Full 4D rescore) ───
    const rx = 504
    const rw = 216
    fig.text(rx + rw / 2, 22, '3. 2D prefix vs 4D rescore', {
        size: 14,
        color: c.textPrimary,
        align: 'center',
        weight: 700,
    })

    // Mini legend
    fig.rect(rx + 4, 46, 12, 12, { fill: tint(c.textMuted, c.bg, 0.25), stroke: c.textSecondary, strokeWidth: 1.2, radius: 2 })
    fig.text(rx + 22, 52, '2D prefix', { size: 14, color: c.textSecondary, weight: 600 })
    fig.rect(rx + 120, 46, 12, 12, { fill: tint(green, c.bg, isDark ? 0.42 : 0.28), stroke: green, strokeWidth: 1.5, radius: 2 })
    fig.text(rx + 138, 52, 'Full 4D', { size: 14, color: green, weight: 700 })

    const barPlot = fig.plot({ x: rx, y: 74, width: rw, height: 224 }, { x: [0, 1.66], y: [0, 3] })
    for (const tick of [0, 0.5, 1.0]) {
        const tx = barPlot.px(tick)
        fig.line(tx, barPlot.area.y, tx, barPlot.bottom, { color: c.borderSubtle, width: 1 })
        fig.text(tx, barPlot.bottom + 15, tick.toFixed(1), {
            size: 14,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }
    fig.line(rx, barPlot.area.y, rx, barPlot.bottom, { color: c.textMuted, width: 1 })
    fig.line(rx, barPlot.bottom, rx + rw, barPlot.bottom, { color: c.textMuted, width: 1 })
    fig.text(rx + rw / 2, barPlot.bottom + 38, 'Cosine similarity to q', {
        size: 14,
        color: c.textSecondary,
        align: 'center',
    })

    const candidates = vectors.slice(1)
    candidates.forEach((cand, idx) => {
        const col = fig.tone(cand.tone)
        const baseRowY = 108 + idx * 72

        fig.text(rx + 2, baseRowY - 22, cand.name, {
            size: 14,
            color: col,
            mono: true,
            weight: 700,
        })

        // 2D prefix bar (top thin)
        const w2 = Math.max(4, barPlot.px(cand.cos2d) - rx)
        fig.rect(rx, baseRowY - 10, w2, 14, {
            fill: tint(col, c.bg, 0.16),
            stroke: c.textSecondary,
            strokeWidth: 1.1,
            radius: 3,
        })
        fig.text(rx + w2 + 6, baseRowY - 3, `2d: ${cand.cos2d.toFixed(2)}`, {
            size: 14,
            color: c.textSecondary,
            mono: true,
        })

        // Full 4D bar (bottom bold)
        const w4 = Math.max(4, barPlot.px(cand.cos4d) - rx)
        fig.rect(rx, baseRowY + 8, w4, 16, {
            fill: tint(col, c.bg, isDark ? 0.42 : 0.28),
            stroke: col,
            strokeWidth: 1.6,
            radius: 3,
        })
        fig.text(rx + w4 + 6, baseRowY + 16, `4d: ${cand.cos4d.toFixed(2)}`, {
            size: 14,
            color: col,
            mono: true,
            weight: 700,
        })
    })

    return fig.render()
}

export default create('dark')
