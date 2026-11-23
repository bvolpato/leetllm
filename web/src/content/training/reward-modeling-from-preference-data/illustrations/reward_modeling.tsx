import type { ThemeMode } from 'vizmatic'
import { WEB, makeKit, type Layout } from './_kit'

export const width = 672
export const height = 640
export const alt =
    'The same scalar reward head scores a chosen completion at 1.80 and a rejected completion at 0.70. Their 1.10 margin lands at 0.7503 on the sigmoid curve, giving pair loss 0.2873.'

const chosenScore = 1.8
const rejectedScore = 0.7
const delta = chosenScore - rejectedScore
const probability = 1 / (1 + Math.exp(-delta))

export const layoutHeight = (L: Layout) => (L.print ? 210 : 640)

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    const { c } = k
    const purple = k.ink('purple')
    const red = k.ink('critical')
    const green = k.ink('green')

    // Scores on one reward scale.
    const panelW = L.print ? 310 : L.W - 12
    const ax0 = 20
    const ax1 = 6 + panelW - 20
    const scoreX = (score: number) => ax0 + (score / 2) * (ax1 - ax0)
    const axisY = L.print ? 40 : 52
    k.line(ax0, axisY, ax1, axisY, { stroke: c.textMuted })
    ;[0, 0.5, 1, 1.5, 2].forEach((tick) => {
        k.line(scoreX(tick), axisY, scoreX(tick), axisY + 5, { stroke: c.textMuted })
        k.t(scoreX(tick) - 24, axisY + 6, 48, tick.toFixed(1), {
            size: L.S,
            align: 'center',
            color: c.textSecondary,
        })
    })
    const r = L.print ? 6 : 8
    k.dot(scoreX(rejectedScore), axisY, r, { fill: red })
    k.dot(scoreX(chosenScore), axisY, r, { fill: green })
    k.t(scoreX(rejectedScore) - 80, axisY - L.S * 2, 160, 'rejected 0.70', {
        size: L.S,
        align: 'center',
        tone: 'critical',
        weight: 600,
    })
    k.t(scoreX(chosenScore) - 90, axisY - L.S * 2, 130, 'chosen 1.80', {
        size: L.S,
        align: 'center',
        tone: 'green',
        weight: 600,
    })
    const bracketY = axisY + L.S * 2
    k.line(scoreX(rejectedScore), bracketY, scoreX(chosenScore), bracketY, {
        stroke: purple,
        strokeWidth: 1.75,
    })
    k.line(scoreX(rejectedScore), bracketY - 5, scoreX(rejectedScore), bracketY + 5, {
        stroke: purple,
        strokeWidth: 1.5,
    })
    k.line(scoreX(chosenScore), bracketY - 5, scoreX(chosenScore), bracketY + 5, {
        stroke: purple,
        strokeWidth: 1.5,
    })
    k.t(
        scoreX(rejectedScore),
        bracketY + 5,
        scoreX(chosenScore) - scoreX(rejectedScore),
        'margin 1.10',
        { size: L.S, align: 'center', tone: 'purple', weight: 600 },
    )

    const texY = L.print ? bracketY + 40 : 490
    k.tex(L.print ? 14 : 14, texY, 'P(y_w\\succ y_l)=\\sigma(1.10)=0.7503', {
        size: L.print ? 18 : 24,
    })
    k.tex(L.print ? 14 : 14, texY + (L.print ? 34 : 50), '-\\log\\sigma(1.10)=0.2873', {
        size: L.print ? 18 : 24,
    })

    // The sigmoid link.
    const px0 = L.print ? 6 + panelW + 62 : 60
    const px1 = L.W - 26
    const py0 = L.print ? 16 : bracketY + 50
    const py1 = L.print ? 176 : 440
    const plotX = (m: number) => px0 + ((m + 3) / 6) * (px1 - px0)
    const plotY = (p: number) => py1 - p * (py1 - py0)
    ;[0, 0.5, 1].forEach((p) => {
        k.line(px0, plotY(p), px1, plotY(p), {
            opacity: p === 0 ? 1 : 0.4,
            stroke: p === 0 ? c.textMuted : c.border,
        })
        k.t(px0 - 54, plotY(p) - L.S * 0.7, 40, p.toFixed(1), {
            size: L.S,
            align: 'right',
            color: c.textSecondary,
        })
    })
    ;[-3, -2, -1, 0, 1, 2, 3].forEach((m) => {
        k.line(plotX(m), py1, plotX(m), py1 + 5, { stroke: c.textMuted })
        k.t(plotX(m) - 16, py1 + 6, 32, String(m), {
            size: L.S,
            align: 'center',
            color: c.textSecondary,
        })
    })
    const curve = Array.from({ length: 61 }, (_, i) => {
        const m = -3 + i * 0.1
        return `${i === 0 ? 'M' : 'L'}${plotX(m).toFixed(1)} ${plotY(1 / (1 + Math.exp(-m))).toFixed(1)}`
    }).join('')
    k.path(curve, { stroke: k.ink('blue'), strokeWidth: 2 })
    k.line(plotX(delta), plotY(probability), plotX(delta), py1, {
        stroke: purple,
        strokeWidth: 1.25,
    })
    k.line(px0, plotY(probability), plotX(delta), plotY(probability), {
        stroke: purple,
        strokeWidth: 1.25,
        dash: '4 3',
    })
    k.dot(plotX(delta), plotY(probability), r, { fill: purple })
    k.t(plotX(delta) - 98, plotY(probability) - L.S * 1.6, 90, '0.7503', {
        size: L.S,
        align: 'right',
        weight: 600,
        tone: 'purple',
    })
    return k.frame(layoutHeight(L))
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, WEB)
}

export default create('dark')
