import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 468
export const alt =
    'Four observed input tokens bos, function, returns and value align with shifted labels function, returns, value and eos. A four-by-four additive causal mask has key positions j across columns and query positions i down rows: zero on and below the diagonal and minus infinity above. The four target probabilities and losses align below. Generation instead selects function, returns, value and eos sequentially, feeding each selected token back into the next context.'

export const inputTokens = ['<bos>', 'function', 'returns', 'value']
export const targetTokens = ['function', 'returns', 'value', '<eos>']
export const logits = [
    [0, 3, 0.5, -1, -2],
    [-1, 0.1, 2.5, 0, -2],
    [-1, 0, 0.2, 2, -1.5],
    [-2, 0, -1, -0.5, 2.4],
]
export const trueProbabilities = logits.map((row, i) => {
    const m = Math.max(...row)
    const e = row.map((v) => Math.exp(v - m))
    return e[i + 1]! / e.reduce((s, v) => s + v, 0)
})
export const losses = trueProbabilities.map((p) => -Math.log(p))

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const amberMark = isLight ? '#d07a12' : '#f2b84b'
    const amberText = isLight ? '#9a5204' : '#f2b84b'

    const shortIn = ['<bos>', 'func', 'ret', 'val']
    const shortOut = ['func', 'ret', 'val', '<eos>']

    // ── Left half: Teacher forcing (1 parallel pass) ────────────────────────
    fig.text(20, 24, 'Teacher forcing (1 parallel pass)', {
        size: 21,
        weight: 750,
        color: blue,
    })
    fig.text(20, 52, 'Ground-truth inputs score all 4 targets at once', {
        size: 16,
        color: c.textSecondary,
    })

    // Parallel shifted token columns with real downward Vizmatic arrows
    const colXs = [64, 166, 268, 370] as const
    const yIn = 96
    const yOut = 158
    const boxW = 86
    const boxH = 34

    colXs.forEach((cx, i) => {
        // Input token pill
        fig.rect(cx - boxW / 2, yIn - boxH / 2, boxW, boxH, {
            fill: tint(blue, c.bg, isLight ? 0.1 : 0.16),
            stroke: blue,
            strokeWidth: 1.5,
            radius: 7,
        })
        fig.text(cx, yIn, shortIn[i]!, {
            size: 17,
            mono: true,
            weight: 700,
            color: blue,
            align: 'center',
            width: boxW - 4,
        })

        // Real downward arrow (never a literal 'v' glyph!)
        fig.arrow(cx, yIn + boxH / 2 + 2, cx, yOut - boxH / 2 - 3, {
            color: blue,
            width: 2.2,
            head: 6,
        })

        // Shifted target pill
        fig.rect(cx - boxW / 2, yOut - boxH / 2, boxW, boxH, {
            fill: tint(green, c.bg, isLight ? 0.12 : 0.2),
            stroke: green,
            strokeWidth: 1.6,
            radius: 7,
        })
        fig.text(cx, yOut, shortOut[i]!, {
            size: 17,
            mono: true,
            weight: 750,
            color: green,
            align: 'center',
            width: boxW - 4,
        })
    })

    // Causal mask heatGrid (4x4 lower triangular)
    fig.text(20, 206, 'Causal mask M[i, j]:  0 allowed · −∞ masked', {
        size: 17,
        weight: 650,
        color: c.textPrimary,
    })

    const maskData = [
        [0.85, 0, 0, 0],
        [0.85, 0.85, 0, 0],
        [0.85, 0.85, 0.85, 0],
        [0.85, 0.85, 0.85, 0.85],
    ]
    fig.heatGrid(maskData, { x: 96, y: 248, width: 316, height: 132 }, {
        causal: true,
        domain: [0, 1],
        rowLabels: shortIn,
        colLabels: ['j=0', 'j=1', 'j=2', 'j=3'],
        labelSize: 15,
        showValues: true,
        format: () => '0',
        valueSize: 16,
        gap: 4,
        radius: 5,
    })

    // Bottom aligned target probabilities & mean loss
    fig.text(20, 412, 'Target p:  0.84   0.77   0.72   0.82', {
        size: 16,
        mono: true,
        color: c.textSecondary,
        weight: 600,
    })
    fig.text(20, 440, 'Mean loss = 0.209 nats', {
        size: 18,
        mono: true,
        weight: 750,
        color: purple,
    })

    // Center vertical divider
    fig.line(444, 20, 444, height - 20, { color: c.borderSubtle, width: 1.25 })

    // ── Right half: Autoregressive Generation (4 serial steps + feedback) ───
    fig.text(466, 24, 'Generation (4 serial steps)', {
        size: 21,
        weight: 750,
        color: amberText,
    })
    fig.text(466, 52, 'Each chosen token loops back into step t+1', {
        size: 16,
        color: c.textSecondary,
    })

    const genRows = [
        { step: '1', ctx: '<bos>', pick: 'func', ctxW: 78, pickCol: green, pickText: green },
        { step: '2', ctx: '<bos> func', pick: 'ret', ctxW: 126, pickCol: green, pickText: green },
        { step: '3', ctx: '… func ret', pick: 'val', ctxW: 132, pickCol: green, pickText: green },
        { step: '4', ctx: '… ret val', pick: '<eos>', ctxW: 126, pickCol: amberMark, pickText: amberText },
    ] as const

    const ctxLeft = 514
    const pickLeft = 720
    const pickW = 94

    genRows.forEach((row, i) => {
        const cy = 112 + i * 82

        // Step index badge
        fig.circle(484, cy, 14, {
            fill: tint(amberMark, c.bg, isLight ? 0.14 : 0.2),
            stroke: amberMark,
            width: 1.5,
        })
        fig.text(484, cy, row.step, {
            size: 16,
            mono: true,
            weight: 750,
            color: amberText,
            align: 'center',
            width: 24,
        })

        // Growing context pill
        fig.rect(ctxLeft, cy - 18, row.ctxW, 36, {
            fill: c.bgSubtle,
            stroke: c.border,
            strokeWidth: 1.4,
            radius: 7,
        })
        fig.text(ctxLeft + row.ctxW / 2, cy, row.ctx, {
            size: 16,
            mono: true,
            weight: 600,
            color: c.textPrimary,
            align: 'center',
            width: row.ctxW - 6,
        })

        // Forward prediction arrow to sampled token
        fig.arrow(ctxLeft + row.ctxW + 6, cy, pickLeft - 6, cy, {
            color: c.textSecondary,
            width: 2.1,
            head: 6,
        })

        // Picked token pill
        fig.rect(pickLeft, cy - 18, pickW, 36, {
            fill: tint(row.pickCol, c.bg, isLight ? 0.16 : 0.24),
            stroke: row.pickCol,
            strokeWidth: 1.8,
            radius: 7,
        })
        fig.text(pickLeft + pickW / 2, cy, row.pick, {
            size: 17,
            mono: true,
            weight: 750,
            color: row.pickText,
            align: 'center',
            width: pickW - 6,
        })

        // Curved autoregressive feedback loop into the next step's context box!
        if (i < genRows.length - 1) {
            const nextY = 112 + (i + 1) * 82
            const nextCtxRight = ctxLeft + genRows[i + 1]!.ctxW - 18
            const startX = pickLeft + pickW / 2
            const startY = cy + 19
            const midY = (cy + nextY) / 2
            fig.path(
                `M${startX} ${startY} C${startX} ${midY + 8}, ${nextCtxRight} ${midY - 8}, ${nextCtxRight} ${nextY - 24}`,
                { color: green, width: 2.1, dash: '5 3' },
            )
            fig.path(
                `M${nextCtxRight} ${nextY - 18} L${nextCtxRight - 4.5} ${nextY - 26} L${nextCtxRight + 4.5} ${nextY - 26} Z`,
                { fill: green },
            )
            if (i === 0) {
                fig.text(722, midY + 4, 'append', {
                    size: 15,
                    color: green,
                    weight: 650,
                })
            }
        }
    })

    fig.text(466, 426, 'Must finish step t before computing step t+1.', {
        size: 17,
        weight: 650,
        color: amberText,
    })

    return fig.render()
}

export default create('dark')
