import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 458
export const alt =
    'Six corpus records contribute three value, two result and one error after returns. Left side shows bigram counts collapsing all prior subjects into returns, giving 50% value, 33% result, and 17% error. Right side shows the neural 2-token context model concatenating two 6-dimensional embeddings for function and returns through a 12-by-8 linear map and softmax, concentrating 99.84% probability on value (logit 7.904) versus 0.07% result and 0.04% error.'

export const records = [
    ['function', 'value'],
    ['function', 'value'],
    ['method', 'result'],
    ['handler', 'value'],
    ['test', 'result'],
    ['test', 'error'],
]
export const contextEmbeddings = [
    [-1.278, 0.448, -1.201, -0.263, 0.007, -0.437],
    [0.052, -0.086, 0.646, -1.725, -0.311, 0.058],
]
export const vocabularyLogits = [
    { label: 'error', value: 0.03631166563996148 },
    { label: 'function', value: -1.3008928481847795 },
    { label: 'handler', value: -1.6362340267469784 },
    { label: 'method', value: -1.6061906603272291 },
    { label: 'result', value: 0.6780103227073978 },
    { label: 'returns', value: -1.5627833156599846 },
    { label: 'test', value: -0.9021095287783932 },
    { label: 'value', value: 7.904140496851712 },
]
const peak = Math.max(...vocabularyLogits.map((r) => r.value))
const normalizer = vocabularyLogits.reduce((s, r) => s + Math.exp(r.value - peak), 0)
export const valueProbability =
    Math.exp(vocabularyLogits.find((r) => r.label === 'value')!.value - peak) / normalizer

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const green = fig.tone('green')
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const amberMark = isLight ? '#d07a12' : '#f2b84b'
    const amberText = isLight ? '#9a5204' : '#f2b84b'

    // ── Left: Collapsed Bigram Tally (1-token context) ──────────────────────
    fig.text(20, 24, '1. Bigram counts (1-token context)', {
        size: 20,
        weight: 750,
        color: amberText,
    })
    fig.text(20, 52, 'Pools all 6 records after "returns", dropping subject', {
        size: 16,
        color: c.textSecondary,
    })

    // Visual collapse schematic: 4 distinct subjects -> single "returns" state
    const subjects = [
        { txt: 'function (×2)', y: 98, col: green },
        { txt: 'handler (×1)', y: 132, col: green },
        { txt: 'method (×1)', y: 166, col: blue },
        { txt: 'test (×2)', y: 200, col: amberText },
    ] as const

    const hubX = 248
    const hubY = 149
    for (const s of subjects) {
        fig.text(146, s.y, s.txt, {
            size: 16,
            mono: true,
            weight: 600,
            color: s.col,
            align: 'right',
        })
        fig.path(`M154 ${s.y} C192 ${s.y}, 202 ${hubY}, ${hubX - 4} ${hubY}`, {
            color: c.textMuted,
            width: 1.6,
            opacity: 0.75,
        })
    }
    // Single collapsed state pill
    fig.rect(hubX, hubY - 24, 134, 48, {
        fill: tint(amberMark, c.bg, isLight ? 0.14 : 0.2),
        stroke: amberMark,
        strokeWidth: 1.8,
        radius: 9,
    })
    fig.text(hubX + 67, hubY - 8, 'returns → ?', {
        size: 17,
        mono: true,
        weight: 750,
        color: amberText,
        align: 'center',
    })
    fig.text(hubX + 67, hubY + 12, 'n = 6 pooled', {
        size: 15,
        color: c.textSecondary,
        align: 'center',
    })

    // Bigram probability bars (shared 0..100% scale)
    const bigramBars = [
        { word: 'value', p: 0.5, label: '3/6 (50%)', col: green, ink: green },
        { word: 'result', p: 1 / 3, label: '2/6 (33%)', col: blue, ink: blue },
        { word: 'error', p: 1 / 6, label: '1/6 (17%)', col: amberMark, ink: amberText },
    ] as const

    const bLeft = 96
    const bMaxW = 186
    fig.text(20, 246, 'Bigram P(next | returns):', {
        size: 17,
        weight: 650,
        color: c.textPrimary,
    })
    bigramBars.forEach((b, i) => {
        const cy = 286 + i * 50
        fig.text(bLeft - 12, cy, b.word, {
            size: 18,
            mono: true,
            weight: 650,
            color: c.textPrimary,
            align: 'right',
        })
        fig.rect(bLeft, cy - 11, bMaxW, 22, { fill: c.bgSubtle, radius: 4 })
        fig.rect(bLeft, cy - 11, Math.round(b.p * bMaxW), 22, { fill: b.col, radius: 4 })
        fig.text(bLeft + bMaxW + 10, cy, b.label, {
            size: 17,
            mono: true,
            weight: 700,
            color: b.ink,
        })
    })

    // Vertical divider
    fig.line(406, 20, 406, height - 20, { color: c.borderSubtle, width: 1.25 })

    // ── Right: Neural 2-Token Context Model ─────────────────────────────────
    fig.text(428, 24, '2. Neural 2-token context model', {
        size: 20,
        weight: 750,
        color: purple,
    })
    fig.text(428, 52, 'Concatenates [e(function) ‖ e(returns)] ∈ ℝ¹²', {
        size: 16,
        color: c.textSecondary,
    })

    // Concatenated 12-dim embedding vector visual (6 cells + divider + 6 cells)
    const vecLeft = 434
    const vecY = 104
    const cellW = 28
    const cellG = 3
    const drawHalfVec = (x0: number, vals: readonly number[], title: string) => {
        fig.text(x0 + (6 * (cellW + cellG) - cellG) / 2, vecY - 18, title, {
            size: 16,
            mono: true,
            weight: 700,
            color: purple,
            align: 'center',
        })
        vals.forEach((v, j) => {
            const col = v >= 0 ? blue : amberMark
            const alpha = 0.25 + 0.65 * Math.min(1, Math.abs(v) / 1.75)
            fig.rect(x0 + j * (cellW + cellG), vecY, cellW, 26, {
                fill: tint(col, c.bg, alpha),
                stroke: col,
                strokeWidth: 1.2,
                radius: 4,
            })
        })
    }

    drawHalfVec(vecLeft, contextEmbeddings[0]!, 'e(function) [6]')
    // Small concat separator
    fig.line(vecLeft + 188, vecY - 4, vecLeft + 188, vecY + 30, {
        color: purple,
        width: 2.2,
    })
    drawHalfVec(vecLeft + 196, contextEmbeddings[1]!, 'e(returns) [6]')

    // Arrow down through Linear W(12x8) + b -> softmax
    const midRight = 626
    fig.arrow(midRight, 138, midRight, 168, { color: purple, width: 2.2, head: 6 })
    fig.rect(476, 170, 300, 36, {
        fill: tint(purple, c.bg, isLight ? 0.1 : 0.18),
        stroke: purple,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(midRight, 188, 'Linear W(12×8) + b → softmax', {
        size: 16,
        mono: true,
        weight: 700,
        color: purple,
        align: 'center',
    })
    fig.arrow(midRight, 208, midRight, 232, { color: green, width: 2.2, head: 6 })

    // Neural softmax probability bars (same 0..100% scale!)
    const neuralBars = [
        { word: 'value', p: 0.9984, label: '99.84% (z=7.90)', col: green, ink: green },
        { word: 'result', p: 0.0007, label: '0.07%  (z=0.68)', col: blue, ink: blue },
        { word: 'error', p: 0.0004, label: '0.04%  (z=0.04)', col: amberMark, ink: amberText },
    ] as const

    const nLeft = 504
    const nMaxW = 166
    fig.text(428, 246, 'Neural P(next | function, returns):', {
        size: 17,
        weight: 650,
        color: c.textPrimary,
    })
    neuralBars.forEach((b, i) => {
        const cy = 286 + i * 50
        fig.text(nLeft - 12, cy, b.word, {
            size: 18,
            mono: true,
            weight: i === 0 ? 750 : 600,
            color: i === 0 ? green : c.textPrimary,
            align: 'right',
        })
        fig.rect(nLeft, cy - 11, nMaxW, 22, { fill: c.bgSubtle, radius: 4 })
        fig.rect(nLeft, cy - 11, Math.max(5, Math.round(b.p * nMaxW)), 22, {
            fill: b.col,
            radius: 4,
        })
        fig.text(nLeft + nMaxW + 10, cy, b.label, {
            size: 16,
            mono: true,
            weight: i === 0 ? 750 : 600,
            color: b.ink,
        })
    })

    fig.text(428, 430, '200 updates · blue (+) / amber (−) embedding cells', {
        size: 15,
        color: c.textSecondary,
    })

    return fig.render()
}

export default create('dark')
