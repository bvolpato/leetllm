import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    SvgPoint,
    TextLabel,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 720
export const height = 776
export const alt =
    'Four fixed A/B votes are A, A, A, B, so the observed sample share for A is 0.75. Predictions 0.75 and 0.99 both choose A for 3-of-4 accuracy. The per-vote squared errors average to Brier scores 0.1875 and 0.2451; one-bin ECE is 0 and 0.24.'

const votes = [1, 1, 1, 0] as const
const predictions = [0.75, 0.99] as const
const accuracy = predictions.map(
    (p) => votes.filter((vote) => (p > 0.5 ? 1 : 0) === vote).length / votes.length,
)
const squaredErrors = predictions.map((p) => votes.map((vote) => (p - vote) ** 2))
const brier = squaredErrors.map((row) => row.reduce((sum, value) => sum + value, 0) / votes.length)
const observedShare = votes.reduce<number>((sum, vote) => sum + vote, 0) / votes.length
const oneBinEce = predictions.map((p) => Math.abs(p - observedShare))
if (
    accuracy.some((value) => value !== 0.75) ||
    Math.abs(brier[0] - 0.1875) > 1e-12 ||
    Math.abs(brier[1] - 0.2451) > 1e-12 ||
    oneBinEce[0] !== 0 ||
    Math.abs(oneBinEce[1] - 0.24) > 1e-12
) {
    throw new Error('Calibration illustration does not match expected vote calculations')
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
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const purple = getReadableToneColor('purple', c)
    const muted = c.textSecondary
    const probabilityX = (p: number) => 138 + p * 470
    const columnX = [146, 250, 354, 458]
    const columnW = 92
    const residualBarWidth = (squaredError: number) => squaredError * 78
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
            x: 24,
            y: 92,
            width: 672,
            height: 144,
            rx: 11,
            fill: c.bgCard,
            stroke: c.border,
            strokeWidth: 1.2,
        }),
        ...columnX.map((x, i) =>
            SvgFrame({
                c,
                x,
                y: 132,
                width: columnW,
                height: 58,
                rx: 9,
                fill: votes[i] ? `${green}18` : `${warm}18`,
                stroke: votes[i] ? green : warm,
                strokeWidth: 1.5,
            }),
        ),
        VectorSegment({
            x1: probabilityX(0),
            y1: 300,
            x2: probabilityX(1),
            y2: 300,
            color: c.borderLight,
            strokeWidth: 3,
            showStartDot: false,
            showEndDot: false,
        }),
        ...[0, 0.5, 1].map((tick) =>
            VectorSegment({
                x1: probabilityX(tick),
                y1: 292,
                x2: probabilityX(tick),
                y2: 308,
                color: muted,
                strokeWidth: 1.4,
                showStartDot: false,
                showEndDot: false,
            }),
        ),
        VectorSegment({
            x1: probabilityX(observedShare),
            y1: 286,
            x2: probabilityX(observedShare),
            y2: 318,
            color: warm,
            strokeWidth: 2.1,
            showStartDot: false,
            showEndDot: false,
        }),
        SvgPoint({
            cx: probabilityX(observedShare),
            cy: 286,
            r: 8.5,
            fill: warm,
            stroke: c.bgSubtle,
            strokeWidth: 2,
        }),
        SvgPoint({
            cx: probabilityX(predictions[0]),
            cy: 318,
            r: 8.5,
            fill: cyan,
            stroke: c.bgSubtle,
            strokeWidth: 2,
        }),
        SvgPoint({
            cx: probabilityX(predictions[1]),
            cy: 318,
            r: 8.5,
            fill: purple,
            stroke: c.bgSubtle,
            strokeWidth: 2,
        }),
        SvgFrame({
            c,
            x: 24,
            y: 418,
            width: 672,
            height: 132,
            rx: 10,
            fill: c.bgCard,
            stroke: c.border,
            strokeWidth: 1.2,
        }),
        SvgFrame({
            c,
            x: 24,
            y: 560,
            width: 672,
            height: 132,
            rx: 10,
            fill: c.bgCard,
            stroke: c.border,
            strokeWidth: 1.2,
        }),
        ...[0, 1].flatMap((row) =>
            columnX.map((x, col) => {
                const y = row === 0 ? 447 : 589
                const error = squaredErrors[row][col]
                return [
                    SvgFrame({
                        c,
                        x,
                        y,
                        width: columnW,
                        height: 66,
                        rx: 8,
                        fill: c.bgSubtle,
                        stroke: c.borderSubtle,
                        strokeWidth: 1,
                    }),
                    SvgFrame({
                        c,
                        x: x + 7,
                        y: y + 41,
                        width: Math.max(residualBarWidth(error), error > 0 ? 0.8 : 0),
                        height: 10,
                        rx: 4,
                        fill: row === 0 ? cyan : purple,
                        stroke: 'none',
                        strokeWidth: 0,
                    }),
                ]
            }),
        ),
    )
    return Board({
        c,
        width,
        height,
        children: [
            CanvasItem({ x: 0, y: 0, width, height, children: shapes }),
            label(
                c,
                'Same accuracy, different confidence',
                20,
                10,
                680,
                42,
                34,
                c.textPrimary,
                800,
            ),
            label(
                c,
                'Four fixed votes compare p(A)=0.75 and 0.99.',
                22,
                52,
                676,
                30,
                24,
                muted,
                550,
            ),
            label(
                c,
                'FIXED A/B VOTES · ORDER HELD CONSTANT',
                32,
                99,
                656,
                30,
                24,
                c.textPrimary,
                750,
            ),
            ...votes.map((vote, index) =>
                label(
                    c,
                    vote ? 'A' : 'B',
                    columnX[index],
                    140,
                    columnW,
                    39,
                    32,
                    vote ? green : warm,
                    850,
                    'center',
                    true,
                ),
            ),
            label(c, 'Observed A share = 3/4 = 0.75', 32, 199, 656, 28, 24, muted, 600, 'center'),
            label(c, 'Observed vs model p(A)', 32, 248, 355, 29, 25, c.textPrimary, 700),
            label(c, 'sample share = 0.75', 395, 248, 293, 29, 24, warm, 750, 'right', true),
            label(c, 'p=.75', 432, 325, 110, 27, 25, cyan, 750, 'center', true),
            label(c, 'p=.99', 550, 325, 110, 27, 25, purple, 750, 'center', true),
            ...[0, 0.5, 1].map((tick) =>
                label(
                    c,
                    tick.toFixed(1),
                    probabilityX(tick) - 25,
                    352,
                    50,
                    26,
                    24,
                    muted,
                    600,
                    'center',
                    true,
                ),
            ),
            label(
                c,
                'Brier · each bar is one squared error',
                32,
                384,
                656,
                29,
                25,
                c.textPrimary,
                750,
            ),
            label(c, 'p=.75', 32, 466, 104, 29, 25, cyan, 750, 'left', true),
            label(c, '0.1875', 566, 466, 112, 29, 26, cyan, 800, 'center', true),
            label(c, 'p=.99', 32, 608, 104, 29, 25, purple, 750, 'left', true),
            label(c, '0.2451', 566, 608, 112, 29, 26, purple, 800, 'center', true),
            ...votes.flatMap((vote, i) => [
                label(
                    c,
                    vote ? 'A' : 'B',
                    columnX[i],
                    421,
                    columnW,
                    25,
                    24,
                    vote ? green : warm,
                    750,
                    'center',
                    true,
                ),
                label(
                    c,
                    squaredErrors[0][i].toFixed(4),
                    columnX[i],
                    449,
                    columnW,
                    27,
                    24,
                    c.textPrimary,
                    700,
                    'center',
                    true,
                ),
                label(
                    c,
                    vote ? 'A' : 'B',
                    columnX[i],
                    563,
                    columnW,
                    25,
                    24,
                    vote ? green : warm,
                    750,
                    'center',
                    true,
                ),
                label(
                    c,
                    squaredErrors[1][i].toFixed(4),
                    columnX[i],
                    591,
                    columnW,
                    27,
                    24,
                    c.textPrimary,
                    700,
                    'center',
                    true,
                ),
            ]),
            label(
                c,
                'One-bin ECE: 0.00 at p=.75 · 0.24 at p=.99',
                32,
                702,
                656,
                28,
                24,
                c.textPrimary,
                700,
                'center',
                true,
            ),
            label(
                c,
                'Both rank A first · accuracy 3/4 on four votes.',
                24,
                736,
                672,
                28,
                24,
                muted,
                550,
                'center',
            ),
        ],
    })
}

export default create('dark')
