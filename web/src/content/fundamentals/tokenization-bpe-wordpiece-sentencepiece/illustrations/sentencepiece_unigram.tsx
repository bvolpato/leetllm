import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 435
export const alt =
    'Top: Unigram Viterbi segmentation DAG over the 5-character metaspace sequence ▁rain with boundary nodes 0 to 5. Three complete paths connect node 0 to node 5: the top green arc [▁rain] (P=0.30, cost 1.204), the blue 2-piece path [▁] (1.897) + [rain] (2.303) totaling 4.200, and the red 3-piece path [▁] (1.897) + [ra] (3.912) + [in] (3.507) totaling 9.316. Bottom: horizontal total-cost bars on a shared 0 to 10 scale confirm Viterbi selects [▁rain] at cost 1.204.'

const chars = ['▁', 'r', 'a', 'i', 'n']

function quadArc(x1: number, y1: number, x2: number, y2: number, lift: number): string {
    const mx = (x1 + x2) / 2
    const cy = (y1 + y2) / 2 + lift
    return `M${x1.toFixed(1)} ${y1.toFixed(1)}Q${mx.toFixed(1)} ${cy.toFixed(1)},${x2.toFixed(1)} ${y2.toFixed(1)}`
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const blue = fig.tone('blue')
    const red = fig.tone('critical')
    const isDark = theme === 'dark'

    // ─── TOP: Unigram Viterbi DAG on "▁ r a i n" ───
    const baseY = 148
    const nodeX = (i: number) => 96 + i * 110

    // Character tiles centered between boundary nodes i and i+1
    chars.forEach((ch, i) => {
        const cx = (nodeX(i) + nodeX(i + 1)) / 2
        const isMeta = i === 0
        fig.rect(cx - 22, baseY - 19, 44, 38, {
            fill: isMeta
                ? tint(blue, c.bg, isDark ? 0.24 : 0.16)
                : tint(c.textPrimary, c.bg, isDark ? 0.08 : 0.05),
            stroke: isMeta ? blue : c.borderLight,
            strokeWidth: 1.4,
            radius: 6,
        })
        fig.text(cx, baseY, ch, {
            size: 18,
            color: isMeta ? blue : c.textPrimary,
            align: 'center',
            mono: true,
            weight: 700,
        })
    })

    // Path 1 (top winning arc, 0 -> 5): "▁rain", P=0.30, -ln P = 1.204
    fig.path(quadArc(nodeX(0), baseY - 14, nodeX(5), baseY - 14, -172), {
        color: green,
        width: 3.2,
    })
    fig.text((nodeX(0) + nodeX(5)) / 2, 26, '▁rain   (P = 0.30 · −ln P = 1.204)  ★ Viterbi', {
        size: 14,
        color: green,
        align: 'center',
        mono: true,
        weight: 700,
    })

    // Path 2 (upper-mid blue arcs: 0 -> 1 "▁" + 1 -> 5 "rain")
    fig.path(quadArc(nodeX(0), baseY - 12, nodeX(1), baseY - 12, -74), {
        color: blue,
        width: 2.2,
    })
    fig.text((nodeX(0) + nodeX(1)) / 2 - 6, 84, '▁ (1.897)', {
        size: 12.5,
        color: blue,
        align: 'center',
        mono: true,
        weight: 700,
    })

    fig.path(quadArc(nodeX(1), baseY - 12, nodeX(5), baseY - 12, -118), {
        color: blue,
        width: 2.2,
    })
    fig.text((nodeX(1) + nodeX(5)) / 2, 106, 'rain (P=0.10 · 2.303)', {
        size: 13,
        color: blue,
        align: 'center',
        mono: true,
        weight: 700,
    })

    // Path 3 (bottom red arcs: 0 -> 1 shared "▁" + 1 -> 3 "ra" + 3 -> 5 "in")
    fig.path(quadArc(nodeX(0), baseY + 12, nodeX(1), baseY + 12, 74), {
        color: red,
        width: 1.85,
        dash: '5 3',
    })
    fig.text((nodeX(0) + nodeX(1)) / 2, 214, '▁ (1.897)', {
        size: 12.5,
        color: red,
        align: 'center',
        mono: true,
        weight: 600,
    })

    fig.path(quadArc(nodeX(1), baseY + 12, nodeX(3), baseY + 12, 92), {
        color: red,
        width: 1.85,
        dash: '5 3',
    })
    fig.text((nodeX(1) + nodeX(3)) / 2, 226, 'ra  (P = 0.02 · 3.912)', {
        size: 13,
        color: red,
        align: 'center',
        mono: true,
        weight: 600,
    })

    fig.path(quadArc(nodeX(3), baseY + 12, nodeX(5), baseY + 12, 92), {
        color: red,
        width: 1.85,
        dash: '5 3',
    })
    fig.text((nodeX(3) + nodeX(5)) / 2, 226, 'in  (P = 0.03 · 3.507)', {
        size: 13,
        color: red,
        align: 'center',
        mono: true,
        weight: 600,
    })

    // Lattice boundary nodes 0..5 drawn on top of arc endpoints
    for (let i = 0; i <= 5; i++) {
        const nx = nodeX(i)
        const isEnd = i === 0 || i === 5
        fig.circle(nx, baseY, isEnd ? 11 : 9, {
            fill: isEnd ? tint(green, c.bg, isDark ? 0.45 : 0.28) : c.bg,
            stroke: isEnd ? green : c.textSecondary,
            width: isEnd ? 2.2 : 1.6,
        })
        fig.text(nx, baseY, String(i), {
            size: 13,
            color: isEnd ? (isDark ? '#ffffff' : green) : c.textPrimary,
            align: 'center',
            mono: true,
            weight: 700,
        })
    }

    // Subtle divider
    fig.line(24, 248, width - 24, 248, { color: c.borderSubtle, width: 1 })

    // ─── BOTTOM: Total path cost bars (-ln P, shortest wins) ───
    const bx = 176
    const bw = 420
    const costPlot = fig.plot({ x: bx, y: 278, width: bw, height: 108 }, { x: [0, 10.5], y: [0, 3] })

    fig.text(bx, 264, 'Summed path cost  −∑ ln P(piece)   (lower wins)', {
        size: 14,
        color: c.textPrimary,
        weight: 700,
    })

    for (const tick of [0, 2, 4, 6, 8, 10]) {
        const tx = costPlot.px(tick)
        fig.line(tx, costPlot.area.y, tx, costPlot.bottom, { color: c.borderSubtle, width: 1 })
        fig.text(tx, costPlot.bottom + 15, String(tick), {
            size: 13,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }
    fig.line(bx, costPlot.area.y, bx, costPlot.bottom, { color: c.textMuted, width: 1 })
    fig.line(bx, costPlot.bottom, bx + bw, costPlot.bottom, { color: c.textMuted, width: 1 })

    const pathBars = [
        { label: "['▁rain']", cost: 1.204, prob: 'P = 0.30', col: green, row: 2.5 },
        { label: "['▁', 'rain']", cost: 4.2, prob: 'P = 0.015', col: blue, row: 1.5 },
        { label: "['▁', 'ra', 'in']", cost: 9.316, prob: 'P = 9×10⁻⁵', col: red, row: 0.5 },
    ]

    for (const b of pathBars) {
        const cy = costPlot.py(b.row)
        const barW = Math.max(8, costPlot.px(b.cost) - bx)
        fig.text(bx - 12, cy, b.label, {
            size: 13.5,
            color: b.col,
            align: 'right',
            mono: true,
            weight: 700,
        })
        fig.rect(bx, cy - 11, barW, 22, {
            fill: tint(b.col, c.bg, isDark ? 0.42 : 0.28),
            stroke: b.col,
            strokeWidth: 1.6,
            radius: 4,
        })
        fig.text(bx + barW + 10, cy, `${b.cost.toFixed(3)}  (${b.prob})`, {
            size: 13,
            color: b.col,
            mono: true,
            weight: 700,
        })
    }

    return fig.render()
}

export default create('dark')
