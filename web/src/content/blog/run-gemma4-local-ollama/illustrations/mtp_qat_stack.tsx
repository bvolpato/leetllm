import React from 'react'
import { Board, CanvasItem, TextLabel, defineIllustration, getReadableToneColor } from 'vizmatic'

export const width = 640
export const height = 660
export const alt =
    'Published Ollama Gemma 4 artifact sizes: E2B Q4_K_M 4.6 GB versus QAT 4.3 GB, E4B 6.6 versus 6.1 GB, and 12B 8.0 versus 7.2 GB'

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

    const datasets = [
        ['E2B', 4.6, 4.3],
        ['E4B', 6.6, 6.1],
        ['12B', 8.0, 7.2],
    ] as const
    text('Published artifact size · GB', 28, 12, 584, 29, c.textPrimary, 'left', 650)
    text('Q4_K_M', 62, 66, 220, 25, blue)
    line(28, 82, 50, 82, blue, 10)
    text('QAT', 372, 66, 220, 25, purple)
    line(338, 82, 360, 82, purple, 10)
    datasets.forEach(([name, q4, qat], i) => {
        const y = 140 + i * 142
        text(name, 28, y, 105, 27, c.textPrimary, 'left', 650)
        ;[q4, qat].forEach((v, j) => {
            const by = y + 18 + j * 44,
                color = j ? purple : blue
            line(140, by, 540, by, c.border, 20)
            line(140, by, 140 + (400 * v) / 8, by, color, 20)
            text(v.toFixed(1), 556, by - 15, 70, 26, color)
        })
    })
    ;[0, 4, 8].forEach((v) =>
        text(String(v), 140 + (400 * v) / 8 - 20, 570, 40, 24, c.textSecondary, 'center'),
    )
    text(
        'Registry bytes · peak runtime memory differs',
        28,
        610,
        584,
        24,
        c.textSecondary,
        'center',
    )

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
