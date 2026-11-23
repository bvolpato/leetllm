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
export const height = 730
export const alt =
    'Repository repair loop: issue to search and reproduce, then localize, patch, and run visible tests. Local feedback returns to search while budget remains. The selected patch goes to the hidden harness for a separate final grade.'

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c),
        green = getReadableToneColor('green', c),
        purple = getReadableToneColor('purple', c),
        warm = getReadableToneColor('warm', c)
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

    const steps = [
        ['Issue + repository', 'required behavior', blue],
        ['Search + reproduce', 'collect evidence', blue],
        ['Localize + patch', 'narrow code change', purple],
        ['Visible tests', 'local feedback', warm],
        ['Hidden harness', 'final F2P + P2P grade', green],
    ]
    steps.forEach(([title, detail, color], i) => {
        const y = 24 + i * 140
        box(76, y, 416, 92, color)
        text(title, 92, y + 10, 384, 29, color, 'center', 650)
        text(detail, 92, y + 49, 384, 25, c.textSecondary, 'center')
        if (i < 4) arrow(284, y + 92, 284, y + 136, i === 3 ? green : c.textSecondary)
    })
    marks.push(
        <polyline
            points="492,490 540,490 540,210 492,210"
            fill="none"
            stroke={warm}
            strokeWidth={2}
            strokeDasharray="6 5"
        />,
    )
    arrow(522, 210, 492, 210, warm)
    text('retry', 548, 327, 76, 24, warm, 'left')
    text('submit', 299, 537, 150, 24, green)

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
