import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 470
export const alt =
    'Four aligned views show ALiBi mechanics. At upper left, downward negative recency penalties across 8 heads at lag 16 span -8.0 in h1 to -0.06 in h8. At upper right, a 4x4 Head 1 causal bias matrix (m=1/2) shows past penalties 0 to -1.5 with a hatched -infinity mask for future keys j > i. At lower left, query i=2 logit arithmetic adds QK/sqrt(d) [2.0, 2.0, 2.0, 100] and Head 1 bias [-1.0, -0.5, 0.0, -infinity] to yield [1.0, 1.5, 2.0, -infinity]. At lower right, softmax weights equal [0.186, 0.307, 0.506, 0.000].'

const headPenalties = Array.from({ length: 8 }, (_, idx) => {
    const slope = 2 ** -(idx + 1)
    const val = -16 * slope
    const label = Math.abs(val) >= 1 ? val.toFixed(1) : val.toFixed(2)
    return { name: `h${idx + 1}`, val, label }
})

const biasMatrix = [
    [0, 0, 0, 0],
    [-0.5, 0, 0, 0],
    [-1.0, -0.5, 0, 0],
    [-1.5, -1.0, -0.5, 0],
]

const softmaxData = [
    { key: 'k0', val: 0.186, tone: 'blue' as const },
    { key: 'k1', val: 0.307, tone: 'blue' as const },
    { key: 'k2', val: 0.506, tone: 'green' as const },
    { key: 'k3', val: 0.0, tone: 'neutral' as const },
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const red = fig.tone('critical')
    const warm = fig.tone('warm')
    const blue = fig.tone('blue')
    const green = fig.tone('green')

    // ─── TOP-LEFT: Downward negative ALiBi penalties at lag Δ = 16 ───
    fig.text(64, 18, 'Penalty at Δ = 16  (−16 · mₕ)', {
        size: 14.5,
        color: c.textPrimary,
        weight: 700,
    })

    const penPlot = fig.plot({ x: 64, y: 52, width: 328, height: 158 }, { x: [0, 8], y: [-9.2, 0] })

    // Horizontal gridlines and y-ticks from 0 down to -8
    for (const y of [0, -2, -4, -6, -8]) {
        const py = penPlot.py(y)
        fig.line(penPlot.area.x, py, penPlot.right, py, {
            color: y === 0 ? c.textMuted : c.borderSubtle,
            width: y === 0 ? 1.25 : 1,
        })
        fig.text(penPlot.area.x - 8, py, y === 0 ? '0' : `−${Math.abs(y)}`, {
            size: 14,
            color: c.textSecondary,
            align: 'right',
            mono: true,
        })
    }
    fig.line(penPlot.area.x, penPlot.area.y, penPlot.area.x, penPlot.bottom, {
        color: c.textMuted,
        width: 1,
    })

    const yZero = penPlot.py(0)
    const slotW = penPlot.area.width / 8
    const barW = 24
    headPenalties.forEach((h, idx) => {
        const cx = penPlot.area.x + (idx + 0.5) * slotW
        const yTip = penPlot.py(h.val)
        const barH = Math.max(2, yTip - yZero)
        const col = idx === 0 ? red : idx < 4 ? warm : blue
        const fill = tint(col, c.bg, theme === 'dark' ? 0.42 : 0.28)

        // Head label above 0 baseline
        fig.text(cx, yZero - 15, h.name, {
            size: 14,
            color: idx === 0 ? red : c.textSecondary,
            align: 'center',
            mono: true,
            weight: idx === 0 ? 700 : 600,
        })

        // Downward bar from y=0
        fig.rect(cx - barW / 2, yZero, barW, barH, {
            fill,
            stroke: col,
            strokeWidth: 1.5,
            radius: 3,
        })

        // Value label below bar tip (stagger tiny right-hand bars cleanly)
        const extraY = idx === 5 ? 13 : idx === 6 ? 27 : idx === 7 ? 13 : 13
        const lbl = idx < 4 ? h.label : idx === 4 ? '−.5' : idx === 5 ? '−.25' : idx === 6 ? '−.13' : '−.06'
        fig.text(cx, yTip + extraY, lbl, {
            size: 14,
            color: col,
            align: 'center',
            mono: true,
            weight: idx < 2 ? 700 : 600,
        })
    })

    // ─── TOP-RIGHT: 4x4 Head 1 causal bias matrix (m = 1/2) ───
    fig.text(468, 18, 'Head 1 bias matrix (m = 1/2)', {
        size: 14.5,
        color: c.textPrimary,
        weight: 700,
    })

    fig.heatGrid(biasMatrix, { x: 472, y: 58, width: 244, height: 152 }, {
        scale: 'sequential',
        domain: [-1.8, 0],
        causal: true,
        rowLabels: ['q0', 'q1', 'q2', 'q3'],
        colLabels: ['k0', 'k1', 'k2', 'k3'],
        labelSize: 14,
        valueSize: 14,
        format: (v) => (v === 0 ? '0' : v === -0.5 ? '−0.5' : v === -1 ? '−1.0' : '−1.5'),
        highlightRow: 2,
        highlightColor: green,
        gap: 4,
        radius: 4,
        colLabelGap: 14,
        rowLabelGap: 10,
    })

    // Subtle divider between top overview and bottom i=2 worked trace
    fig.line(24, 232, width - 24, 232, { color: c.borderSubtle, width: 1 })

    // ─── BOTTOM-LEFT: Query i = 2 logit arithmetic ───
    fig.text(64, 254, 'Query i = 2 logits (Head 1, m = 1/2)', {
        size: 14.5,
        color: c.textPrimary,
        weight: 700,
    })

    const cols = ['k0', 'k1', 'k2', 'k3 (future)']
    const colXs = [142, 208, 274, 348]
    const cellWs = [58, 58, 58, 76]

    cols.forEach((colLabel, j) => {
        fig.text(colXs[j]!, 284, colLabel, {
            size: 14,
            color: j === 3 ? red : j === 2 ? green : c.textSecondary,
            align: 'center',
            mono: j < 3,
            weight: j >= 2 ? 700 : 600,
        })
    })

    const rows = [
        { name: 'QK/√d', vals: ['2.0', '2.0', '2.0', '100'], tone: 'blue' as const },
        { name: '+ Bias', vals: ['−1.0', '−0.5', '0.0', '−∞'], tone: 'warm' as const },
        { name: '= Logit', vals: ['1.0', '1.5', '2.0', '−∞'], tone: 'green' as const },
    ]
    const rowYs = [318, 360, 404]

    rows.forEach((row, rIdx) => {
        const ry = rowYs[rIdx]!
        const rowTone = fig.tone(row.tone)
        fig.text(104, ry, row.name, {
            size: 14,
            color: rIdx === 2 ? green : c.textPrimary,
            align: 'right',
            mono: true,
            weight: rIdx === 2 ? 700 : 600,
        })

        row.vals.forEach((v, j) => {
            const cw = cellWs[j]!
            const cx = colXs[j]!
            const isMasked = j === 3 && rIdx >= 1
            const isPeak = j === 2 && rIdx === 2
            const fill = isMasked
                ? tint(red, c.bg, theme === 'dark' ? 0.2 : 0.14)
                : isPeak
                  ? tint(green, c.bg, theme === 'dark' ? 0.28 : 0.2)
                  : tint(rowTone, c.bg, theme === 'dark' ? 0.12 : 0.08)
            const stroke = isMasked ? red : isPeak ? green : c.borderSubtle

            fig.rect(cx - cw / 2, ry - 16, cw, 32, {
                fill,
                stroke,
                strokeWidth: isPeak || isMasked ? 1.5 : 1,
                radius: 4,
            })
            fig.text(cx, ry, v, {
                size: 14,
                color: isMasked ? (theme === 'dark' ? '#ff9b9b' : red) : isPeak ? green : c.textPrimary,
                align: 'center',
                mono: true,
                weight: isPeak || isMasked || rIdx === 2 ? 700 : 500,
            })
        })

        if (rIdx === 1) {
            fig.line(112, 382, 386, 382, { color: c.textMuted, width: 1 })
        }
    })

    // Connector arrow from logits to softmax
    fig.arrow(394, 362, 434, 362, { color: c.textSecondary, width: 1.75, head: 6 })
    fig.text(414, 340, 'softmax', {
        size: 14,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })

    // ─── BOTTOM-RIGHT: Softmax weights bar chart with clean 0.0..0.6 ticks ───
    fig.text(486, 254, 'Softmax weights (i = 2)', {
        size: 14.5,
        color: c.textPrimary,
        weight: 700,
    })

    const smPlot = fig.plot({ x: 486, y: 286, width: 228, height: 140 }, { x: [0, 4], y: [0, 0.62] })

    for (const tick of [0, 0.2, 0.4, 0.6]) {
        const py = smPlot.py(tick)
        fig.line(smPlot.area.x, py, smPlot.right, py, {
            color: tick === 0 ? c.textMuted : c.borderSubtle,
            width: tick === 0 ? 1.2 : 1,
        })
        fig.text(smPlot.area.x - 8, py, tick.toFixed(1), {
            size: 14,
            color: c.textSecondary,
            align: 'right',
            mono: true,
        })
    }
    fig.line(smPlot.area.x, smPlot.area.y, smPlot.area.x, smPlot.bottom, {
        color: c.textMuted,
        width: 1,
    })

    const smSlot = smPlot.area.width / 4
    const smBarW = 36
    softmaxData.forEach((d, idx) => {
        const cx = smPlot.area.x + (idx + 0.5) * smSlot
        const yBase = smPlot.py(0)
        const yTop = smPlot.py(d.val)
        const col = d.tone === 'neutral' ? c.textMuted : fig.tone(d.tone)
        const fill = tint(col, c.bg, theme === 'dark' ? 0.36 : 0.25)

        if (d.val > 0) {
            fig.rect(cx - smBarW / 2, yTop, smBarW, yBase - yTop, {
                fill,
                stroke: col,
                strokeWidth: 1.6,
                radius: 4,
            })
        } else {
            fig.line(cx - smBarW / 2, yBase - 1, cx + smBarW / 2, yBase - 1, {
                color: red,
                width: 2,
            })
        }

        fig.text(cx, yTop - 14, d.val.toFixed(3), {
            size: 14,
            color: d.val === 0 ? red : col,
            align: 'center',
            mono: true,
            weight: 700,
        })
        fig.text(cx, smPlot.bottom + 16, d.key, {
            size: 14,
            color: d.val === 0 ? red : c.textPrimary,
            align: 'center',
            mono: true,
            weight: 600,
        })
    })

    return fig.render()
}

export default create('dark')
