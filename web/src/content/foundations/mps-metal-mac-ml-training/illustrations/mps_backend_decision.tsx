import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    defineIllustration,
    getReadableToneColor,
    type ThemeColors,
} from 'vizmatic'

export const width = 632
export const height = 562
export const alt =
    'Two routes through an operation U. A supported U runs between A and B on the MPS lane. When U lacks an MPS implementation and CPU fallback is enabled, inputs travel to a CPU implementation and results return to MPS before B. The drawing shows execution order without assigning durations.'

function label(
    c: ThemeColors,
    x: number,
    y: number,
    w: number,
    text: string,
    size = 23,
    color = c.textPrimary,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: size + 10,
        children: TextLabel({ c, text, fontSize: size, color, mono: true }),
    })
}

const illustration = defineIllustration((c) => {
    const green = getReadableToneColor('green', c)
    const orange = getReadableToneColor('warm', c)
    const blue = getReadableToneColor('blue', c)
    const node = (x: number, y: number, color: string) =>
        SvgFrame({
            c,
            x,
            y,
            width: 82,
            height: 62,
            rx: 8,
            fill: c.bg,
            stroke: color,
            strokeWidth: 2,
        })
    const arrow = (x1: number, y1: number, x2: number, y2: number, color: string) =>
        VectorArrow({ x1, y1, x2, y2, color, strokeWidth: 3, arrowSize: 8 })
    return Scene({
        c,
        padding: 16,
        gap: 0,
        contentWidth: 600,
        background: c.bgSubtle,
        children: Board({
            c,
            width: 600,
            height: 530,
            background: c.bgSubtle,
            children: [
                CanvasItem({
                    x: 0,
                    y: 0,
                    width: 600,
                    height: 530,
                    children: React.createElement(
                        'svg',
                        { width: 600, height: 530, viewBox: '0 0 600 530' },
                        SvgFrame({
                            c,
                            x: 112,
                            y: 101,
                            width: 466,
                            height: 91,
                            fill: c.bg,
                            stroke: c.borderSubtle,
                        }),
                        node(130, 115, green),
                        node(304, 115, green),
                        node(478, 115, green),
                        arrow(220, 146, 296, 146, green),
                        arrow(394, 146, 470, 146, green),
                        SvgFrame({
                            c,
                            x: 112,
                            y: 306,
                            width: 466,
                            height: 91,
                            fill: c.bg,
                            stroke: c.borderSubtle,
                        }),
                        SvgFrame({
                            c,
                            x: 112,
                            y: 421,
                            width: 466,
                            height: 91,
                            fill: c.bg,
                            stroke: c.borderSubtle,
                        }),
                        node(130, 320, green),
                        node(478, 320, green),
                        node(304, 435, orange),
                        arrow(220, 356, 296, 458, orange),
                        arrow(394, 458, 470, 356, orange),
                    ),
                }),
                label(c, 18, 8, 570, 'Follow one operation through U', 27),
                label(c, 18, 52, 570, 'Supported U · stays on MPS', 24, green),
                label(c, 18, 131, 95, 'MPS', 24, green),
                label(c, 158, 131, 46, 'A', 25, green),
                label(c, 332, 131, 46, 'U', 25, green),
                label(c, 506, 131, 46, 'B', 25, green),
                label(c, 18, 219, 570, 'Unsupported U · CPU fallback enabled', 24, orange),
                label(
                    c,
                    18,
                    259,
                    570,
                    'Order only · durations vary by workload',
                    23,
                    c.textSecondary,
                ),
                label(c, 18, 337, 95, 'MPS', 24, green),
                label(c, 18, 450, 95, 'CPU', 24, blue),
                label(c, 158, 336, 46, 'A', 25, green),
                label(c, 506, 336, 46, 'B', 25, green),
                label(c, 332, 451, 46, 'U', 25, orange),
                label(c, 153, 401, 125, 'inputs', 23, orange),
                label(c, 461, 401, 115, 'results', 23, orange),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
