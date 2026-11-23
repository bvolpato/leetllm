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
export const height = 590
export const alt =
    'Worked RAG trace: required policy P-17 is eligible and retrieved at rank 2, but is absent from selected context, which contains only irrelevant P-04. The first evidence loss is context selection.'

const illustration = defineIllustration((c) => {
    const green = getReadableToneColor('green', c),
        red = getReadableToneColor('critical', c)
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

    const stages = [
        ['Eligibility', 'Current + permitted', green],
        ['Retrieval top 2', '1. P-04    2. P-17', green],
        ['Selected context', 'P-04 only', red],
    ]
    text('Follow required policy P-17', 28, 12, 584, 30, c.textPrimary, 'left', 650)
    stages.forEach(([name, detail, color], i) => {
        const y = 90 + i * 142
        text(name, 28, y, 290, 27, c.textPrimary, 'left', 650)
        text(detail, 28, y + 46, 345, 25, c.textSecondary)
        box(398, y, 214, 90, color)
        text(i === 2 ? 'P-17 lost' : 'P-17 present', 408, y + 27, 194, 25, color, 'center', 650)
        if (i < 2) arrow(505, y + 94, 505, y + 136, i === 1 ? red : green)
    })
    text('First evidence loss: context selection', 28, 544, 584, 27, red, 'center', 650)

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
