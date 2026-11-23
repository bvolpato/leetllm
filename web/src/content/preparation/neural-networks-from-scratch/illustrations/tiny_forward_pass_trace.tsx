import { SvgPoint, VectorArrow, defineIllustration, getReadableToneColor } from 'vizmatic'
import { board, label, svg } from './_parts/layout'

export const width = 672
export const height = 442
export const alt =
    'Backward sensitivities for x=(1,0), target 1. The output logit has sensitivity p-y=-0.119. Multiplying by output weight 4 gives -0.477 to both hidden outputs. The active ReLU passes -0.477, while the inactive ReLU stops its branch at zero. The first input weight gets -0.477 and the second gets zero.'

const illustration = defineIllustration((c) => {
    const warm = getReadableToneColor('warm', c),
        purple = getReadableToneColor('purple', c),
        blue = getReadableToneColor('blue', c)
    return board(
        c,
        640,
        410,
        svg(
            640,
            410,
            VectorArrow({
                x1: 495,
                y1: 165,
                x2: 350,
                y2: 120,
                color: warm,
                strokeWidth: 5,
                arrowSize: 6,
            }),
            VectorArrow({
                x1: 495,
                y1: 195,
                x2: 350,
                y2: 285,
                color: c.borderLight,
                strokeWidth: 2,
                arrowSize: 6,
            }),
            VectorArrow({
                x1: 255,
                y1: 120,
                x2: 112,
                y2: 120,
                color: purple,
                strokeWidth: 5,
                arrowSize: 6,
            }),
            SvgPoint({ cx: 302, cy: 120, r: 42, fill: c.bgCard, stroke: purple, strokeWidth: 2 }),
            SvgPoint({
                cx: 302,
                cy: 285,
                r: 42,
                fill: c.bgCard,
                stroke: c.textMuted,
                strokeWidth: 2,
            }),
            SvgPoint({ cx: 540, cy: 180, r: 44, fill: c.bgCard, stroke: warm, strokeWidth: 2 }),
        ),
        [
            label(c, 2, 15, 200, 'Gradients', blue, 26),
            label(c, 205, 15, 200, 'ReLU slopes', purple, 26),
            label(c, 440, 15, 200, 'Output error', warm, 26),
            label(c, 246, 100, 112, '×1', purple, 32),
            label(c, 246, 265, 112, '×0', c.textMuted, 32),
            label(c, 486, 163, 108, '−0.119', warm, 25),
            label(c, 365, 92, 90, '×4', warm),
            label(c, 365, 254, 90, '×4', c.textMuted),
            label(c, 122, 79, 115, '−0.477', purple, 25),
            label(c, 0, 150, 180, '× [1,0]', blue, 27),
            label(c, 0, 191, 180, '[−0.477,0]', blue, 26),
            label(c, 203, 331, 205, 'Stopped at zero', c.textMuted, 21),
            label(c, 425, 240, 200, 'p − y = 0.881 − 1', warm, 17),
            label(c, 0, 373, 640, 'local sensitivity × local derivative', c.textPrimary, 25),
        ],
    )
})
export const create = illustration.create
export default illustration.default
