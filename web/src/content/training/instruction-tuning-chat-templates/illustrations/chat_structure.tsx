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
export const height = 720
export const alt =
    'One training row from the pinned Mistral v0.1 tokenizer, drawn one cell per token ID. Three lanes share the same 44-ID prefix: the beginning token, the [INST] marker, system and user text folded into one block, and the [/INST] marker. Only the beginning and end tokens are reserved control IDs, and the two markers are ordinary vocabulary pieces. Training adds 8 answer IDs and an end token, for 53 IDs. Fresh generation stops at 44 IDs, and decoding starts there. JSON prefill adds 8 open IDs with no end token, for 52 IDs.'

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c),
        green = getReadableToneColor('green', c),
        purple = getReadableToneColor('purple', c),
        warm = getReadableToneColor('warm', c),
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

    text('44-ID prefix · three endings', 28, 12, 584, 28, c.textPrimary, 'left', 650)
    text('Pinned Mistral v0.1 tokenizer', 28, 62, 584, 24, c.textSecondary)
    const lanes = [
        { name: 'Training', count: 53, tail: 9, kind: 'closed' },
        { name: 'Generation', count: 44, tail: 0, kind: 'generate' },
        { name: 'JSON prefill', count: 52, tail: 8, kind: 'prefill' },
    ]
    lanes.forEach((lane, i) => {
        const y = 128 + i * 156
        text(lane.name, 28, y, 390, 27, c.textPrimary, 'left', 650)
        text(lane.count + ' IDs', 480, y, 132, 26, blue, 'right', 650)
        for (let p = 0; p < lane.count; p++) {
            const color =
                p === 0 || (lane.kind === 'closed' && p === 52)
                    ? warm
                    : p >= 44
                      ? blue
                      : p <= 3 || p >= 40
                        ? c.textSecondary
                        : c.border
            marks.push(<rect x={28 + p * 10.5} y={y + 54} width={8.5} height={30} fill={color} />)
        }
        if (lane.kind === 'closed') text('EOS', 530, y + 94, 82, 24, warm, 'right', 650)
        if (lane.kind === 'generate') {
            arrow(494, y + 69, 550, y + 69, blue)
            text('decode', 500, y + 100, 112, 24, blue, 'right')
        }
        if (lane.kind === 'prefill')
            text('open suffix · no EOS', 28, y + 98, 584, 24, blue, 'right')
    })
    text('Warm: reserved beginning/end control IDs', 28, 622, 584, 24, warm, 'center')
    text(
        '[INST] and [/INST]: ordinary vocabulary pieces',
        28,
        666,
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
