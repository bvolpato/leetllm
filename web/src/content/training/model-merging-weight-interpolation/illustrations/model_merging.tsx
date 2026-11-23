import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    SvgPoint,
    TextLabel,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 560
export const height = 650
export const alt =
    'On one authored scalar weight coordinate, the base is 2.0, Code is 2.5, and Math is 1.5. The equal endpoint average and the corresponding 50/50 task-vector merge both land at 2.0. With 60/40 coefficients, both methods land at 2.1. This coordinate example says nothing about model quality.'
export const numericFixture = {
    base: 2,
    code: 2.5,
    math: 1.5,
    equalAverage: 2,
    weightedEndpoint: 2.1,
    weightedTaskArithmetic: 2.1,
    equalTaskDelta: 0,
    weightedTaskDelta: 0.1,
}

function label(
    c: ReturnType<typeof getThemeColors>,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    size: number,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({
            c,
            text,
            width: '100%',
            fontSize: size,
            color,
            align,
            fontWeight: 650,
        }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const code = getReadableToneColor('cyan', c)
    const math = getReadableToneColor('warm', c)
    const mean = getReadableToneColor('green', c)
    const baseColor = getReadableToneColor('neutral', c)
    const plot = { xStart: 60, xEnd: 520 }
    const map = (v: number) => plot.xStart + ((v - 1) / 2) * (plot.xEnd - plot.xStart)
    const rows = [220, 330, 440]
    const verticalGuides = [1, 1.5, 2, 2.5, 3].flatMap((v) =>
        [
            [170, 286],
            [324, 396],
            [434, 474],
        ].map(([y1, y2]) =>
            VectorSegment({
                x1: map(v),
                y1,
                x2: map(v),
                y2,
                color: v === 2 ? baseColor : c.border,
                strokeWidth: v === 2 ? 2 : 1,
                showStartDot: false,
                showEndDot: false,
            }),
        ),
    )
    const axis = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        ...verticalGuides,
        ...rows.map((y) =>
            VectorSegment({
                x1: plot.xStart,
                y1: y,
                x2: plot.xEnd,
                y2: y,
                color: c.border,
                strokeWidth: 1.5,
                showStartDot: false,
                showEndDot: false,
            }),
        ),
        SvgFrame({
            c,
            x: map(2) - 5,
            y: rows[1] - 5,
            width: 10,
            height: 10,
            rx: 2,
            fill: 'transparent',
            stroke: c.bgCard,
            strokeWidth: 1,
        }),
        SvgFrame({
            c,
            x: map(2.1) - 5,
            y: rows[2] - 5,
            width: 10,
            height: 10,
            rx: 2,
            fill: 'transparent',
            stroke: c.bgCard,
            strokeWidth: 1,
        }),
        SvgPoint({ cx: map(2.5), cy: rows[0], r: 8, fill: code, stroke: c.bgCard, strokeWidth: 2 }),
        SvgPoint({ cx: map(1.5), cy: rows[0], r: 8, fill: math, stroke: c.bgCard, strokeWidth: 2 }),
        SvgPoint({ cx: map(2), cy: rows[1], r: 9, fill: mean, stroke: c.bgCard, strokeWidth: 2 }),
        SvgPoint({ cx: map(2.1), cy: rows[2], r: 9, fill: mean, stroke: c.bgCard, strokeWidth: 2 }),
    )
    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        background: 'transparent',
        children: Board({
            c,
            width,
            height,
            background: 'transparent',
            children: [
                CanvasItem({ x: 0, y: 0, width, height, children: axis }),
                label(
                    c,
                    'One coordinate, two equivalent merge paths',
                    16,
                    12,
                    528,
                    35,
                    24,
                    c.textPrimary,
                    'center',
                ),
                label(
                    c,
                    'With coefficients summing to one, both recipes match.',
                    20,
                    51,
                    520,
                    30,
                    20,
                    c.textSecondary,
                    'center',
                ),
                label(c, 'Code 2.5', map(2.5) - 62, 175, 124, 28, 21, code, 'center'),
                label(c, 'Math 1.5', map(1.5) - 62, 175, 124, 28, 21, math, 'center'),
                label(c, '50/50 · both = 2.0', 104, 292, 352, 28, 21, c.textPrimary, 'center'),
                label(c, '60/40 · both = 2.1', 104, 402, 352, 28, 21, c.textPrimary, 'center'),
                ...[1, 1.5, 2, 2.5, 3].map((v) =>
                    label(c, v.toFixed(1), map(v) - 24, 480, 48, 27, 20, c.textSecondary, 'center'),
                ),
                label(c, 'weight θ', 220, 510, 120, 26, 20, c.textSecondary, 'center'),
                label(c, 'Base θ₀ = 2.0', 28, 554, 220, 28, 20, baseColor),
                label(
                    c,
                    'Equal deltas: 0.5(+0.5) + 0.5(−0.5) = 0',
                    28,
                    586,
                    510,
                    27,
                    20,
                    c.textPrimary,
                ),
                label(
                    c,
                    'Weighted deltas: 0.6(+0.5) + 0.4(−0.5) = +0.1',
                    28,
                    616,
                    510,
                    27,
                    20,
                    c.textPrimary,
                ),
            ],
        }),
    })
}

export default create('dark')
