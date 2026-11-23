import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    SvgPoint,
    TextLabel,
    VectorArrow,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 720
export const height = 760
export const alt =
    'One shared scalar weight starts at minus 1.0000 and an SGD step with learning rate 0.1 moves it to minus 1.0269. With chosen feature 1 and rejected feature 2, both scores fall: minus 1.0000 to minus 1.0269 and minus 2.0000 to minus 2.0538. The rejected score moves twice as far, widening the margin from 1.0000 to 1.0269.'

const featureChosen = 1
const featureRejected = 2
const weightBefore = -1
const learningRate = 0.1
const gradient = 1 / (1 + Math.exp(1))
const weightAfter = weightBefore - learningRate * gradient
const scoresBefore = [weightBefore * featureChosen, weightBefore * featureRejected]
const scoresAfter = [weightAfter * featureChosen, weightAfter * featureRejected]
const scoreDeltas = scoresAfter.map((score, index) => score - scoresBefore[index])
const marginBefore = scoresBefore[0] - scoresBefore[1]
const marginAfter = scoresAfter[0] - scoresAfter[1]
if (
    Math.abs(weightAfter - -1.0268941421369995) > 1e-12 ||
    Math.abs(scoreDeltas[0] - -0.0268941421369995) > 1e-12 ||
    Math.abs(scoreDeltas[1] - -0.053788284273999) > 1e-12 ||
    Math.abs(marginAfter - 1.0268941421369995) > 1e-12
) {
    throw new Error('Shared-head parameter update does not match expected gradient step values')
}

type Colors = ReturnType<typeof getThemeColors>

function label(
    c: Colors,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fontSize: number,
    color = c.textPrimary,
    fontWeight = 600,
    align: 'left' | 'center' | 'right' = 'left',
    mono = false,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({ c, text, width: w, fontSize, color, fontWeight, align, mono }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const cyan = getReadableToneColor('cyan', c)
    const warm = getReadableToneColor('warm', c)
    const purple = getReadableToneColor('purple', c)
    const muted = c.textSecondary
    const xAtDelta = (delta: number) => 84 + ((delta + 0.06) / 0.06) * 550
    const rowY = [340, 520]
    const beforeX = scoreDeltas.map(() => xAtDelta(0))
    const afterX = scoreDeltas.map(xAtDelta)
    const shapes = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        SvgFrame({
            c,
            x: 28,
            y: 95,
            width: 664,
            height: 112,
            rx: 11,
            fill: `${purple}12`,
            stroke: purple,
            strokeWidth: 1.7,
        }),
        SvgFrame({
            c,
            x: 28,
            y: 228,
            width: 664,
            height: 170,
            rx: 11,
            fill: c.bgCard,
            stroke: c.border,
            strokeWidth: 1.2,
        }),
        SvgFrame({
            c,
            x: 28,
            y: 408,
            width: 664,
            height: 170,
            rx: 11,
            fill: c.bgCard,
            stroke: c.border,
            strokeWidth: 1.2,
        }),
        ...rowY
            .map((y, index) => [
                VectorArrow({
                    x1: beforeX[index],
                    y1: y,
                    x2: afterX[index],
                    y2: y,
                    color: index === 0 ? cyan : warm,
                    strokeWidth: 3,
                    arrowSize: 8,
                }),
                SvgPoint({
                    cx: beforeX[index],
                    cy: y,
                    r: 5.5,
                    fill: c.textSecondary,
                    stroke: c.bgSubtle,
                    strokeWidth: 1.4,
                }),
                SvgPoint({
                    cx: afterX[index],
                    cy: y,
                    r: 5.5,
                    fill: index === 0 ? cyan : warm,
                    stroke: c.bgSubtle,
                    strokeWidth: 1.4,
                }),
            ])
            .flat(),
        VectorArrow({
            x1: 84,
            y1: 592,
            x2: 634,
            y2: 592,
            color: muted,
            strokeWidth: 2.1,
            arrowSize: 7,
        }),
        ...[-0.06, -0.04, -0.02, 0].map((tick) => {
            const x = xAtDelta(tick)
            return VectorSegment({
                x1: x,
                y1: 586,
                x2: x,
                y2: 598,
                color: muted,
                strokeWidth: 1.4,
                showStartDot: false,
                showEndDot: false,
            })
        }),
        SvgFrame({
            c,
            x: 28,
            y: 638,
            width: 664,
            height: 88,
            rx: 10,
            fill: `${cyan}10`,
            stroke: c.border,
            strokeWidth: 1.1,
        }),
    )
    return Board({
        c,
        width,
        height,
        children: [
            CanvasItem({ x: 0, y: 0, width, height, children: shapes }),
            label(
                c,
                'One shared weight moves both scores',
                20,
                10,
                680,
                42,
                35,
                c.textPrimary,
                800,
            ),
            label(c, 'One shared Δr axis · before = 0', 22, 53, 676, 30, 26, muted, 600),
            label(c, 'ONE SHARED PARAMETER', 48, 100, 624, 31, 26, purple, 800, 'center'),
            label(
                c,
                'w: −1.0000 → −1.0269',
                48,
                133,
                624,
                34,
                28,
                c.textPrimary,
                750,
                'center',
                true,
            ),
            label(
                c,
                'SGD · lr 0.1 · ∂L/∂w = +0.2689',
                48,
                170,
                624,
                29,
                24,
                muted,
                600,
                'center',
                true,
            ),
            label(c, 'CHOSEN · h = 1', 78, 240, 250, 32, 26, cyan, 750),
            label(c, 'r: −1.0000 → −1.0269', 350, 240, 332, 32, 26, cyan, 700, 'right', true),
            label(
                c,
                `Δr = ${scoreDeltas[0].toFixed(6)}`,
                78,
                278,
                600,
                30,
                26,
                cyan,
                700,
                'center',
                true,
            ),
            label(c, 'REJECTED · h = 2', 78, 420, 250, 32, 26, warm, 750),
            label(c, 'r: −2.0000 → −2.0538', 350, 420, 332, 32, 26, warm, 700, 'right', true),
            label(
                c,
                `Δr = ${scoreDeltas[1].toFixed(6)}`,
                78,
                458,
                600,
                30,
                26,
                warm,
                700,
                'center',
                true,
            ),
            label(c, '−0.06', xAtDelta(-0.06) - 45, 601, 90, 28, 26, muted, 600, 'center', true),
            label(c, '−0.04', xAtDelta(-0.04) - 45, 601, 90, 28, 26, muted, 600, 'center', true),
            label(c, '−0.02', xAtDelta(-0.02) - 45, 601, 90, 28, 26, muted, 600, 'center', true),
            label(c, '0', xAtDelta(0) - 35, 601, 70, 28, 26, muted, 600, 'center', true),
            label(
                c,
                'Rejected score moves 2× as far.',
                42,
                646,
                636,
                30,
                26,
                c.textPrimary,
                750,
                'center',
            ),
            label(
                c,
                `Margin: ${marginBefore.toFixed(4)} → ${marginAfter.toFixed(4)}`,
                42,
                684,
                636,
                28,
                24,
                cyan,
                650,
                'center',
                true,
            ),
        ],
    })
}

export default create('dark')
