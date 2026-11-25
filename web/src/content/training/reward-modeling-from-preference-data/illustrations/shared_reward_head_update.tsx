import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 720
export const height = 370
export const alt =
    'One shared scalar weight moves from -1.0000 to -1.0269 after one SGD step (lr = 0.1, gradient +0.2689). With chosen feature h = 1 and rejected feature h = 2, both scores fall (-1.0000 to -1.0269 and -2.0000 to -2.0538), yet the rejected score moves twice as far (-0.0538 vs -0.0269), widening the pairwise margin from 1.0000 to 1.0269.'

const featureChosen = 1
const featureRejected = 2
const weightBefore = -1
const learningRate = 0.1
const gradient = 1 / (1 + Math.exp(1))
const weightAfter = weightBefore - learningRate * gradient
const scoresBefore = [weightBefore * featureChosen, weightBefore * featureRejected] as const
const scoresAfter = [weightAfter * featureChosen, weightAfter * featureRejected] as const
const scoreDeltas = [scoresAfter[0] - scoresBefore[0], scoresAfter[1] - scoresBefore[1]] as const
const marginBefore = scoresBefore[0] - scoresBefore[1]
const marginAfter = scoresAfter[0] - scoresAfter[1]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const cyan = fig.tone('cyan')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const muted = c.textSecondary

    fig.rect(20, 14, width - 40, 56, {
        fill: tint(purple, c.bg, 0.1),
        stroke: tint(purple, c.bg, 0.4),
        strokeWidth: 1.3,
        radius: 8,
    })
    fig.text(36, 42, 'Shared weight', { size: 15, weight: 700, color: purple })
    fig.math(
        438,
        42,
        String.raw`w:\; -1.0000 \;\xrightarrow{\;\eta=0.1,\;\partial L/\partial w = +0.2689\;}\; -1.0269`,
        { size: 16, color: c.textPrimary, align: 'center' },
    )

    const axL = 196
    const axR = 668
    const axW = axR - axL
    const mapX = (d: number) => axL + ((d + 0.06) / 0.06) * axW

    const y1 = 144
    const y2 = 228
    const axY = 278

    ;[-0.06, -0.04, -0.02, 0].forEach((t) => {
        const x = mapX(t)
        fig.line(x, 100, x, axY, {
            color: t === 0 ? c.textMuted : c.borderSubtle,
            width: t === 0 ? 1.5 : 1,
            dash: t === 0 ? undefined : '3 3',
        })
        fig.line(x, axY, x, axY + 5, { color: c.textMuted, width: 1.2 })
        fig.text(x, axY + 20, t === 0 ? '0 (before)' : `−${Math.abs(t).toFixed(2)}`, {
            size: 14,
            mono: true,
            color: muted,
            align: 'center',
        })
    })
    fig.line(axL, axY, axR, axY, { color: c.textMuted, width: 1.2 })

    const xBefore = mapX(0)
    const xChosen = mapX(scoreDeltas[0])
    fig.text(180, y1 - 10, 'Chosen (h = 1)', {
        size: 15,
        weight: 700,
        color: cyan,
        align: 'right',
    })
    fig.text(180, y1 + 14, '−1.000 → −1.027', {
        size: 14,
        mono: true,
        color: muted,
        align: 'right',
    })
    fig.arrow(xBefore, y1, xChosen, y1, { color: cyan, width: 3.2, head: 9 })
    fig.circle(xBefore, y1, 5, { fill: c.textSecondary })
    fig.circle(xChosen, y1, 5.5, { fill: cyan })
    fig.text((xBefore + xChosen) / 2, y1 - 20, `Δr = ${scoreDeltas[0].toFixed(4)}`, {
        size: 14,
        mono: true,
        weight: 700,
        color: cyan,
        align: 'center',
    })

    const xRej = mapX(scoreDeltas[1])
    fig.text(180, y2 - 10, 'Rejected (h = 2)', {
        size: 15,
        weight: 700,
        color: warm,
        align: 'right',
    })
    fig.text(180, y2 + 14, '−2.000 → −2.054', {
        size: 14,
        mono: true,
        color: muted,
        align: 'right',
    })
    fig.arrow(xBefore, y2, xRej, y2, { color: warm, width: 3.2, head: 9 })
    fig.circle(xBefore, y2, 5, { fill: c.textSecondary })
    fig.circle(xRej, y2, 5.5, { fill: warm })
    fig.text((xBefore + xRej) / 2, y2 - 20, `Δr = ${scoreDeltas[1].toFixed(4)}  (2× farther)`, {
        size: 14,
        mono: true,
        weight: 700,
        color: warm,
        align: 'center',
    })

    fig.line(20, 322, width - 20, 322, { color: c.borderSubtle, width: 1 })
    fig.text(
        width / 2,
        346,
        `Margin widens: ${marginBefore.toFixed(4)} → ${marginAfter.toFixed(4)} (+${(marginAfter - marginBefore).toFixed(4)})`,
        { size: 14, mono: true, weight: 700, color: cyan, align: 'center' },
    )

    return fig.render()
}

export default create('dark')
