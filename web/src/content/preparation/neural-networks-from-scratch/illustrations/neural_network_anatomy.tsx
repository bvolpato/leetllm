import { createElement } from 'react'
import {
    SvgPoint,
    VectorArrow,
    VectorSegment,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import { board, label, svg } from './_parts/layout'

export const width = 672
export const height = 482
export const alt =
    'For input (1,0), the first hidden neuron computes 1 and the second -1. ReLU yields hidden (1,0). The output adds 4 times 1 and 4 times 0, then bias -2, giving logit 2 and sigmoid probability 0.881. The inactive second path is dimmed.'

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c),
        orange = getReadableToneColor('warm', c),
        green = getReadableToneColor('green', c)
    const nodes = [
        [70, 130, blue],
        [70, 300, blue],
        [310, 130, orange],
        [310, 300, c.textMuted],
        [550, 215, green],
    ] as const
    return board(
        c,
        640,
        450,
        svg(
            640,
            450,
            ...[130, 300].flatMap((y) =>
                [130, 300].map((v) =>
                    VectorSegment({
                        x1: 108,
                        y1: y,
                        x2: 272,
                        y2: v,
                        color: v === 130 ? blue : c.borderLight,
                        strokeWidth: 2,
                        showEndDot: false,
                    }),
                ),
            ),
            VectorArrow({
                x1: 348,
                y1: 130,
                x2: 512,
                y2: 199,
                color: orange,
                strokeWidth: 5,
                arrowSize: 6,
            }),
            VectorArrow({
                x1: 348,
                y1: 300,
                x2: 512,
                y2: 231,
                color: c.borderLight,
                strokeWidth: 2,
                arrowSize: 6,
            }),
            ...nodes.map(([cx, cy, color]) =>
                SvgPoint({ cx, cy, r: 38, fill: c.bgCard, stroke: color, strokeWidth: 2.5 }),
            ),
            createElement('line', {
                x1: 550,
                y1: 254,
                x2: 550,
                y2: 320,
                stroke: green,
                strokeWidth: 3,
            }),
        ),
        [
            label(c, 15, 18, 120, 'Input', blue, 27),
            label(c, 210, 18, 200, 'Hidden · ReLU', orange, 24),
            label(c, 465, 18, 165, 'Output', green, 27),
            label(c, 30, 111, 80, '1', blue, 32),
            label(c, 30, 281, 80, '0', blue, 32),
            label(c, 270, 111, 80, '1', orange, 32),
            label(c, 270, 281, 80, '0', c.textMuted, 32),
            label(c, 510, 196, 80, '2', green, 32),
            label(c, 138, 86, 70, '×1', blue),
            label(c, 138, 308, 70, '×1', c.textMuted),
            label(c, 118, 158, 70, '×−1', c.textMuted, 23),
            label(c, 135, 236, 70, '×−1', blue, 23),
            label(c, 370, 99, 80, '×4', orange),
            label(c, 370, 290, 80, '×4', c.textMuted),
            label(c, 238, 59, 145, '1−0 = 1', orange, 21),
            label(c, 200, 349, 220, '−1 → ReLU → 0', c.textMuted, 21),
            label(c, 470, 123, 160, 'bias −2', green),
            label(c, 451, 329, 168, 'σ(2) = 0.881', green, 22),
            label(c, 0, 407, 640, '4 × 1  +  4 × 0  −  2  =  2', c.textPrimary, 28),
        ],
    )
})
export const create = illustration.create
export default illustration.default
