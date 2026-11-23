import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    VectorArrow,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'

export const width = 640
export const height = 680
export const alt =
    'Mixture-of-experts routing graph where a router selects two active experts while other experts remain stored in the serving system, then combines the selected outputs.'

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c),
        green = getReadableToneColor('green', c),
        purple = getReadableToneColor('purple', c)
    const labels: React.ReactNode[] = [],
        marks: React.ReactNode[] = []
    const text = (
        s: string,
        x: number,
        y: number,
        w: number,
        size = 26,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
        weight = 500,
    ) =>
        labels.push(
            CanvasItem({
                x,
                y,
                width: w,
                height: size * 1.45,
                children: TextLabel({
                    c,
                    text: s,
                    width: w,
                    fontSize: size,
                    color,
                    align,
                    fontWeight: weight,
                }),
            }),
        )
    const box = (x: number, y: number, w: number, h: number, color = c.border) =>
        marks.push(
            <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx={6}
                fill="none"
                stroke={color}
                strokeWidth={2}
            />,
        )
    const arrow = (x1: number, y1: number, x2: number, y2: number, color = c.textSecondary) =>
        marks.push(VectorArrow({ x1, y1, x2, y2, color, strokeWidth: 2, arrowSize: 5 }))

    box(200, 20, 240, 74, blue)
    text('Token', 210, 38, 220, 29, blue, 'center', 650)
    arrow(320, 98, 320, 140, purple)
    box(170, 146, 300, 90, purple)
    text('Router · top-2', 180, 168, 280, 29, purple, 'center', 650)
    arrow(260, 240, 166, 328, green)
    arrow(380, 240, 474, 328, green)
    text('0.67', 48, 278, 100, 26, green, 'center', 650)
    text('0.33', 492, 278, 100, 26, green, 'center', 650)
    box(28, 334, 276, 100, green)
    text('Expert 1', 40, 350, 252, 29, green, 'center', 650)
    text('selected', 40, 394, 252, 25, c.textSecondary, 'center')
    box(336, 334, 276, 100, green)
    text('Expert 2', 348, 350, 252, 29, green, 'center', 650)
    text('selected', 348, 394, 252, 25, c.textSecondary, 'center')
    arrow(166, 438, 268, 520, green)
    arrow(474, 438, 372, 520, green)
    box(140, 526, 360, 90, green)
    text('Weighted output sum', 150, 550, 340, 27, green, 'center', 650)
    text('Experts 3 + 4 stay stored, inactive.', 28, 644, 584, 25, c.textSecondary, 'center')

    return Board({
        c,
        width,
        height,
        children: [
            CanvasItem({
                x: 0,
                y: 0,
                width,
                height,
                children: (
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        {marks}
                    </svg>
                ),
            }),
            ...labels,
        ],
    })
})
export const create = illustration.create
export default illustration.default
