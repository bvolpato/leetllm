import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    VectorArrow,
    defineIllustration,
    getReadableToneColor,
    type ThemeColors,
} from 'vizmatic'

export const preset = 'engineering'
export const width = 760
export const height = 740
export const alt =
    'A 5 by 5 crop passes through two spatial weight masks. The center mask averages 0.85, 0.88, 0.90, and 0.92 into z1 = 0.888; the lower mask averages 0.18 and 0.16 into z2 = 0.170. A decoder rebuilds the crop with mean squared error 0.0027.'

const boardWidth = 728
const boardHeight = 708
const labelScale = width / boardWidth

const patch = [
    [0.08, 0.12, 0.09, 0.11, 0.07],
    [0.15, 0.85, 0.88, 0.14, 0.1],
    [0.11, 0.9, 0.92, 0.13, 0.09],
    [0.07, 0.18, 0.16, 0.12, 0.08],
    [0.06, 0.09, 0.1, 0.07, 0.05],
]
const reconstructedPatch = [
    [0.08, 0.08, 0.08, 0.08, 0.08],
    [0.19, 0.97, 0.97, 0.19, 0.08],
    [0.19, 0.97, 0.97, 0.19, 0.08],
    [0.14, 0.25, 0.25, 0.14, 0.08],
    [0.08, 0.14, 0.14, 0.08, 0.08],
]
const residualErrors = [
    [0.0, 0.04, 0.01, 0.03, 0.01],
    [0.04, 0.12, 0.09, 0.05, 0.02],
    [0.08, 0.07, 0.05, 0.06, 0.01],
    [0.07, 0.07, 0.09, 0.02, 0.0],
    [0.02, 0.05, 0.04, 0.01, 0.03],
]

function label(
    c: ThemeColors,
    x: number,
    y: number,
    w: number,
    text: string,
    size = 24,
    color = c.textPrimary,
    mono = false,
    weight = 600,
    align: 'left' | 'center' | 'right' = 'left',
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: size * 1.5,
        children: TextLabel({
            c,
            text,
            fontSize: size * labelScale,
            color,
            mono,
            fontWeight: weight,
            align,
        }),
    })
}

function pixelRects(
    data: number[][],
    x: number,
    y: number,
    cell: number,
    color: string,
    maxValue = 1,
) {
    return data.flatMap((row, r) =>
        row.map((val, col) =>
            createElement('rect', {
                key: `${x}-${y}-${r}-${col}`,
                x: x + col * cell,
                y: y + r * cell,
                width: cell - 3,
                height: cell - 3,
                rx: 4,
                fill: color,
                opacity: 0.14 + 0.82 * Math.max(0, Math.min(1, val / maxValue)),
                stroke: color,
                strokeWidth: 1,
            }),
        ),
    )
}

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const cyan = getReadableToneColor('cyan', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)

    const maskCenter = Array.from({ length: 5 }, (_, r) =>
        Array.from({ length: 5 }, (_, col) => (r >= 1 && r <= 2 && col >= 1 && col <= 2 ? 1 : 0)),
    )
    const maskLower = Array.from({ length: 5 }, (_, r) =>
        Array.from({ length: 5 }, (_, col) => (r === 3 && (col === 1 || col === 2) ? 1 : 0)),
    )

    const geometry = createElement(
        'svg',
        {
            width: boardWidth,
            height: boardHeight,
            viewBox: `0 0 ${boardWidth} ${boardHeight}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        ...pixelRects(patch, 58, 96, 28, blue),
        ...pixelRects(maskCenter, 362, 96, 22, purple),
        ...pixelRects(maskLower, 548, 96, 22, cyan),
        VectorArrow({
            x1: 214,
            y1: 166,
            x2: 342,
            y2: 166,
            color: c.textMuted,
            strokeWidth: 3,
            arrowSize: 7,
        }),
        VectorArrow({
            x1: 416,
            y1: 214,
            x2: 416,
            y2: 256,
            color: purple,
            strokeWidth: 3,
            arrowSize: 7,
        }),
        VectorArrow({
            x1: 602,
            y1: 214,
            x2: 602,
            y2: 256,
            color: cyan,
            strokeWidth: 3,
            arrowSize: 7,
        }),
        VectorArrow({
            x1: 364,
            y1: 400,
            x2: 364,
            y2: 438,
            color: warm,
            strokeWidth: 3.5,
            arrowSize: 8,
        }),
        ...pixelRects(reconstructedPatch, 134, 490, 28, green),
        ...pixelRects(residualErrors, 454, 490, 28, warm, 0.12),
    )

    return Scene({
        c,
        padding: 16,
        gap: 0,
        contentWidth: boardWidth,
        children: Board({
            c,
            width: boardWidth,
            height: boardHeight,
            children: [
                CanvasItem({
                    x: 0,
                    y: 0,
                    width: boardWidth,
                    height: boardHeight,
                    children: geometry,
                }),
                label(
                    c,
                    16,
                    6,
                    696,
                    'One crop, two weighted reads, one rebuild',
                    28,
                    c.textPrimary,
                    false,
                    800,
                ),
                label(c, 38, 56, 180, 'Input x · 5 × 5', 24, blue, false, 750, 'center'),
                label(c, 336, 56, 160, 'W₁ · center', 24, purple, false, 750, 'center'),
                label(c, 522, 56, 160, 'W₂ · lower', 24, cyan, false, 750, 'center'),
                label(
                    c,
                    14,
                    266,
                    700,
                    'z₁ = 0.25·(0.85+0.88+0.90+0.92) = 0.888',
                    22,
                    purple,
                    true,
                    700,
                    'center',
                ),
                label(
                    c,
                    14,
                    312,
                    700,
                    'z₂ = 0.50·(0.18+0.16) = 0.170',
                    22,
                    cyan,
                    true,
                    700,
                    'center',
                ),
                label(c, 164, 356, 400, 'z = [0.888, 0.170]', 28, warm, true, 800, 'center'),
                label(c, 64, 448, 280, 'Decoder output x̂', 24, green, false, 750, 'center'),
                label(
                    c,
                    384,
                    448,
                    280,
                    '|x − x̂| · per-pixel error',
                    24,
                    warm,
                    false,
                    750,
                    'center',
                ),
                label(
                    c,
                    104,
                    650,
                    520,
                    'Mean squared error = 0.0027',
                    26,
                    green,
                    true,
                    800,
                    'center',
                ),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
