import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 492
export const alt =
    'A compact decoder processes the prompt function returns the. Three token IDs map to a 3 by 4 matrix of positioned vectors, pass through repeated causal decoder blocks while keeping shape 3 by 4, and multiply by a vocabulary head to yield 3 by 6 logits. The last row converts to next-token probabilities: result 35.3 percent, value 27.3, None 17.6, the 10.4, returns 6.9, and function 2.5.'

const probs = [
    { token: 'result', pct: 35.3, hot: true },
    { token: 'value', pct: 27.3, hot: false },
    { token: 'None', pct: 17.6, hot: false },
    { token: 'the', pct: 10.4, hot: false },
    { token: 'returns', pct: 6.9, hot: false },
    { token: 'function', pct: 2.5, hot: false },
] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const amberText = isLight ? '#9a5204' : '#f2b84b'
    const amberBar = isLight ? '#d97706' : '#f2b84b'
    const blueFill = tint(blue, c.bg, isLight ? 0.12 : 0.2)
    const purpleFill = tint(purple, c.bg, isLight ? 0.1 : 0.18)
    const amberFill = tint(amberBar, c.bg, isLight ? 0.18 : 0.26)

    // ── Section 1: Forward tensor shape trace ───────────────────────────────
    fig.text(20, 22, '1. Forward shape trace:', { size: 21, weight: 750, color: c.textPrimary })
    fig.text(262, 22, '"function returns the"', {
        size: 19,
        mono: true,
        color: blue,
        weight: 650,
    })

    const drawMatrix = (
        x0: number,
        y0: number,
        rows: number,
        cols: number,
        cell: number,
        stroke: string,
        fill: string,
        hotLastRow = false,
    ) => {
        const gap = 3
        const step = cell + gap
        for (let r = 0; r < rows; r++) {
            for (let k = 0; k < cols; k++) {
                const hot = hotLastRow && r === rows - 1
                fig.rect(x0 + k * step, y0 + r * step, cell, cell, {
                    fill: hot ? amberFill : fill,
                    stroke: hot ? amberBar : stroke,
                    strokeWidth: hot ? 1.8 : 1.3,
                    radius: 3,
                })
            }
        }
    }

    // Stage 1: Embed + Pos [3, 4]
    fig.text(134, 62, 'Embed + Pos', { size: 18, weight: 700, color: blue, align: 'center' })
    const rowTokens = ['function', 'returns', 'the']
    rowTokens.forEach((tok, i) => {
        fig.text(84, 84 + i * 21 + 9, tok, {
            size: 16,
            mono: true,
            color: i === 2 ? amberText : c.textSecondary,
            align: 'right',
            weight: i === 2 ? 700 : 500,
        })
    })
    drawMatrix(92, 84, 3, 4, 18, blue, blueFill)
    fig.text(134, 166, '[3, 4]', {
        size: 18,
        mono: true,
        color: blue,
        align: 'center',
        weight: 700,
    })

    // Arrow 1 -> 2
    fig.arrow(182, 114, 214, 114, { color: blue, width: 2.2, head: 6.5 })

    // Stage 2: Stacked Decoder Blocks (keeps [3, 4])
    // Subtle stacked depth rects behind main block
    fig.rect(230, 74, 162, 68, {
        fill: tint(purple, c.bg, isLight ? 0.05 : 0.08),
        stroke: purple,
        strokeWidth: 1.1,
        opacity: 0.55,
        radius: 8,
    })
    fig.rect(225, 80, 162, 68, {
        fill: tint(purple, c.bg, isLight ? 0.08 : 0.12),
        stroke: purple,
        strokeWidth: 1.2,
        opacity: 0.75,
        radius: 8,
    })
    fig.rect(220, 86, 162, 68, {
        fill: purpleFill,
        stroke: purple,
        strokeWidth: 1.8,
        radius: 8,
    })
    fig.text(301, 108, 'Decoder Blocks', {
        size: 18,
        weight: 700,
        color: purple,
        align: 'center',
    })
    fig.text(301, 134, 'Causal Attn + FFN', {
        size: 16,
        color: c.textSecondary,
        align: 'center',
        weight: 550,
    })
    fig.text(301, 174, 'keeps [3, 4]', {
        size: 18,
        mono: true,
        color: purple,
        align: 'center',
        weight: 700,
    })

    // Arrow 2 -> 3
    fig.arrow(390, 114, 422, 114, { color: purple, width: 2.2, head: 6.5 })

    // Stage 3: Norm + LM Head -> [3, 6] logits (row 2 highlighted)
    fig.text(492, 62, 'Norm + LM Head', { size: 18, weight: 700, color: amberText, align: 'center' })
    drawMatrix(434, 84, 3, 6, 17, blue, blueFill, true)
    fig.text(492, 166, '[3, 6] · row 2', {
        size: 18,
        mono: true,
        color: amberText,
        align: 'center',
        weight: 700,
    })

    // Arrow 3 -> 4 (from row 2 right edge)
    fig.arrow(560, 132, 608, 132, { color: amberBar, width: 2.4, head: 7 })

    // Stage 4: Greedy top token callout
    fig.rect(614, 72, 164, 102, {
        fill: amberFill,
        stroke: amberBar,
        strokeWidth: 1.9,
        radius: 9,
    })
    fig.text(696, 92, 'Greedy top', { size: 16, color: amberText, align: 'center', weight: 650 })
    fig.text(696, 124, 'result', {
        size: 20,
        mono: true,
        color: c.textPrimary,
        align: 'center',
        weight: 800,
    })
    fig.text(696, 155, 'logit 1.382', {
        size: 16,
        mono: true,
        color: amberText,
        align: 'center',
        weight: 650,
    })

    // ── Direct visual connector from [3, 6] row 2 down to softmax bars ──────
    fig.path('M492 182 C492 204, 224 194, 224 226', {
        color: amberBar,
        width: 2.2,
    })
    fig.path('M224 233 L219 224 L229 224 Z', { fill: amberBar })
    fig.text(448, 220, 'softmax(row 2)', {
        size: 17,
        mono: true,
        color: amberText,
        align: 'center',
        weight: 650,
    })

    // ── Section 2: Last-row next-token probabilities ────────────────────────
    fig.text(20, 248, '2. Last-row probabilities (6-word vocab)', {
        size: 20,
        weight: 750,
        color: c.textPrimary,
    })

    const barLeft = 132
    const barMaxW = 556
    const maxPct = 40
    const yStart = 286
    const rowStep = 33

    // Subtle vertical gridlines at 0%, 10%, 20%, 30%, 40%
    for (const tick of [0, 10, 20, 30, 40]) {
        const gx = barLeft + (tick / maxPct) * barMaxW
        fig.line(gx, yStart - 12, gx, yStart + 5 * rowStep + 14, {
            color: tick === 0 ? c.textMuted : c.borderSubtle,
            width: tick === 0 ? 1.4 : 1,
        })
        fig.text(gx, yStart + 5 * rowStep + 26, `${tick}%`, {
            size: 16,
            mono: true,
            color: c.textSecondary,
            align: 'center',
        })
    }

    probs.forEach((item, i) => {
        const cy = yStart + i * rowStep
        const barW = Math.max(8, (item.pct / maxPct) * barMaxW)
        const fill = item.hot ? amberBar : blue
        const ink = item.hot ? amberText : c.textPrimary

        fig.text(barLeft - 12, cy, item.token, {
            size: 18,
            mono: true,
            weight: item.hot ? 750 : 600,
            color: ink,
            align: 'right',
        })
        fig.rect(barLeft, cy - 10, barW, 20, {
            fill,
            radius: 4,
        })
        fig.text(barLeft + barW + 10, cy, `${item.pct.toFixed(1)}%`, {
            size: 18,
            mono: true,
            weight: item.hot ? 750 : 600,
            color: item.hot ? amberText : c.textSecondary,
        })
    })

    return fig.render()
}

export default create('dark')
