import React from 'react'
import { Board, CanvasItem, TextLabel, defineIllustration, getReadableToneColor } from 'vizmatic'

export const width = 640
export const height = 640
export const alt =
    'Unified-memory budget: 4 GiB OS and applications, 7 GiB resident weights, and 1 GiB runtime leave 4 GiB out of 16 for cache; doubling independent request caches raises demand to 20 GiB'

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

    const scale = (v: number) => 28 + (584 * v) / 20
    text('Unified memory · GiB', 28, 12, 584, 29, c.textPrimary, 'left', 650)
    const capacity = scale(16)
    line(capacity, 82, capacity, 410, c.textMuted, 2, '5 5')
    text('16 GiB capacity', capacity - 95, 62, 220, 24, c.textSecondary)
    const rows = [
        [4, 7, 1, 4],
        [4, 7, 1, 8],
    ]
    rows.forEach((values, i) => {
        const y = 148 + 160 * i,
            total = values.reduce((a, b) => a + b, 0)
        text(
            i + 1 + ' request' + (i ? 's' : '') + ' · ' + total + ' GiB',
            28,
            y - 39,
            584,
            27,
            c.textPrimary,
            'left',
            650,
        )
        let cursor = 0
        values.forEach((v, j) => {
            const next = cursor + v
            marks.push(
                <rect
                    x={scale(cursor)}
                    y={y + 14}
                    width={scale(next) - scale(cursor)}
                    height={42}
                    fill={[c.textMuted, purple, blue, i ? red : green][j]}
                />,
            )
            cursor = next
        })
        text(i ? '4 GiB over capacity' : 'No safety margin', 28, y + 75, 584, 25, i ? red : warm)
    })
    ;[
        ['OS + apps', '4 GiB', c.textMuted],
        ['Weights', '7 GiB', purple],
        ['Runtime', '1 GiB', blue],
        ['KV / request', '4 GiB', green],
    ].forEach(([s, v, color], i) => {
        const x = i % 2 ? 340 : 28,
            y = 470 + Math.floor(i / 2) * 58
        line(x, y + 14, x + 24, y + 14, color, 10)
        text(s + ' · ' + v, x + 38, y, 250, 24, color)
    })
    text(
        'Independent caches · no sharing · assumed values',
        28,
        602,
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
