import { createElement } from 'react'
import {
    SvgPoint,
    VectorArrow,
    VectorSegment,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import { board, label, svg } from './_parts/layout'
export { createFilm } from './_parts/xor-film'

export const width = 672
export const height = 472
export const alt =
    'Four XOR input points map to two ReLU features. The blue points (0,0) and (1,1) both reach hidden (0,0); orange points reach (0,1) and (1,0). The line h1+h2=0.5 separates the classes in hidden space.'

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c)
    const orange = getReadableToneColor('warm', c)
    const green = getReadableToneColor('green', c)
    const P = (side: number, x: number, y: number) => ({
        x: 48 + side * 344 + x * 180,
        y: 276 - y * 180,
    })
    const segment = (side: number, a: number[], b: number[], color: string) => {
        const p = P(side, a[0], a[1]),
            q = P(side, b[0], b[1])
        return VectorSegment({
            x1: p.x,
            y1: p.y,
            x2: q.x,
            y2: q.y,
            color,
            strokeWidth: 2.5,
            showEndDot: false,
        })
    }
    const axes = [0, 1].flatMap((side) => [
        segment(side, [-0.12, 0], [1.15, 0], c.textMuted),
        segment(side, [0, -0.12], [0, 1.15], c.textMuted),
    ])
    const marks = [0, 1].flatMap((side) =>
        [[0, 0, blue], [0, 1, orange], [1, 0, orange], ...(side === 0 ? [[1, 1, blue]] : [])].map(
            ([x, y, fill]) => {
                const p = P(side, Number(x), Number(y))
                return SvgPoint({
                    cx: p.x,
                    cy: p.y,
                    r: 11,
                    fill: String(fill),
                    stroke: c.bgCard,
                    strokeWidth: 2,
                })
            },
        ),
    )
    return board(
        c,
        640,
        440,
        svg(
            640,
            440,
            ...axes,
            segment(1, [-0.08, 0.58], [0.58, -0.08], green),
            ...marks,
            VectorArrow({
                x1: 272,
                y1: 185,
                x2: 330,
                y2: 185,
                color: c.textMuted,
                strokeWidth: 3,
                arrowSize: 6,
            }),
            createElement('circle', {
                cx: 392,
                cy: 276,
                r: 17,
                fill: 'none',
                stroke: blue,
                strokeWidth: 2,
            }),
        ),
        [
            label(c, 0, 10, 270, 'Input coordinates', c.textPrimary, 27),
            label(c, 344, 10, 290, 'Hidden features', c.textPrimary, 27),
            label(c, 243, 280, 45, 'x₁', c.textPrimary, 22),
            label(c, 5, 45, 70, 'x₂'),
            label(c, 587, 280, 45, 'h₁', c.textPrimary, 22),
            label(c, 350, 45, 70, 'h₂'),
            label(c, 31, 300, 35, '0', c.textMuted),
            label(c, 209, 300, 35, '1', c.textMuted),
            label(c, 0, 80, 35, '1', c.textMuted),
            label(c, 553, 300, 35, '1', c.textMuted),
            label(c, 455, 190, 175, 'h₁+h₂=0.5', green, 22),
            label(c, 340, 335, 275, 'Two blue points at (0,0)', blue, 23),
            label(c, 0, 382, 300, 'h₁ = max(0,x₁−x₂)', c.textPrimary, 24),
            label(c, 336, 382, 304, 'h₂ = max(0,x₂−x₁)', c.textPrimary, 24),
        ],
    )
})
export const create = illustration.create
export default illustration.default
