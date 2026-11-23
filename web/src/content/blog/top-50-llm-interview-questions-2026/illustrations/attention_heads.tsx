import React from 'react'
import { Board, CanvasItem, TextLabel, defineIllustration, getReadableToneColor } from 'vizmatic'

export const width = 640
export const height = 750
export const alt =
    'Attention KV sharing comparison where eight query heads stay fixed while stored key-value groups fall from eight in MHA, to two in GQA, to one in MQA, with relative cache bars of eight, two, and one.'

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c),
        green = getReadableToneColor('green', c),
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

    const modes = [
        ['MHA', 8, blue],
        ['GQA', 2, green],
        ['MQA', 1, warm],
    ] as const
    text('8 query heads in every mode', 28, 12, 584, 29, c.textPrimary, 'left', 650)
    modes.forEach(([name, kv, color], i) => {
        const y = 88 + i * 210
        text(name, 28, y, 125, 30, color, 'left', 700)
        text('Query', 28, y + 56, 100, 24, c.textSecondary)
        text('KV', 28, y + 104, 100, 24, c.textSecondary)
        for (let j = 0; j < 8; j++) {
            const cx = 158 + j * 57
            marks.push(
                <circle cx={cx} cy={y + 72} r={13} fill="none" stroke={color} strokeWidth={2} />,
            )
            if (j < kv) marks.push(<circle cx={cx} cy={y + 120} r={13} fill={color} />)
        }
        line(145, y + 164, 601, y + 164, c.border, 12)
        line(145, y + 164, 145 + (456 * kv) / 8, y + 164, color, 12)
        text(kv + '× cache', 360, y, 250, 27, color, 'right', 650)
    })
    text(
        'MQA = 1× · fixed layers, length, head size, dtype',
        28,
        712,
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
