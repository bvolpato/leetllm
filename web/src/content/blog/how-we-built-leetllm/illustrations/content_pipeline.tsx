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
export const height = 600
export const alt =
    'Two separate data paths. Git bundles pass through the content loader to canonical lessons. Supabase user rows pass through scoped queries to personal study state. User rows do not feed the shared canonical content artifact. Public comments are outside this diagram.'

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c),
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
    const line = (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color = c.border,
        strokeWidth = 2,
        dash?: string,
    ) =>
        marks.push(
            <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={dash}
            />,
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

    const lanes = [
        {
            x: 28,
            color: blue,
            nodes: [
                ['Git bundles', 'reviewed source'],
                ['Content loader', 'text + assets'],
                ['Canonical lessons', 'shared lesson text'],
            ],
        },
        {
            x: 336,
            color: purple,
            nodes: [
                ['Supabase rows', 'owned by one user'],
                ['Scoped queries', 'authenticated user'],
                ['Personal study state', 'progress + notes'],
            ],
        },
    ]
    lanes.forEach((lane) =>
        lane.nodes.forEach(([title, detail], i) => {
            const y = 28 + i * 175
            box(lane.x, y, 276, 112, lane.color)
            text(title, lane.x + 8, y + 15, 260, 25, lane.color, 'center', 650)
            text(detail, lane.x + 8, y + 62, 260, 24, c.textSecondary, 'center')
            if (i < 2) arrow(lane.x + 138, y + 116, lane.x + 138, y + 169, lane.color)
        }),
    )
    line(320, 28, 320, 506, c.border, 2, '5 6')
    text('Canonical content', 28, 538, 276, 26, blue, 'center')
    text('Personal state', 336, 538, 276, 26, purple, 'center')

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
