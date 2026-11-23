import React from 'react'
import { Board, CanvasItem, TextLabel, defineIllustration, getReadableToneColor } from 'vizmatic'

export const width = 640
export const height = 600
export const alt =
    'Illustrative before-and-after bars for an internal FAQ assistant. p95 latency falls from 4.2 seconds to 1.1 seconds, and a token-cost index falls from 100 to 38, after routing, caching, and shorter context replace a full document dump to the highest-cost model.'

const illustration = defineIllustration((c) => {
    const green = getReadableToneColor('green', c),
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

    const chart = (
        title: string,
        before: number,
        after: number,
        max: number,
        unit: string,
        top: number,
    ) => {
        text(title, 28, top, 584, 29, c.textPrimary, 'left', 650)
        ;[before, after].forEach((v, i) => {
            const y = top + 73 + i * 68,
                color = i ? green : warm
            text(i ? 'After' : 'Before', 28, y - 14, 112, 26, c.textSecondary)
            line(150, y, 510, y, c.border, 24)
            line(150, y, 150 + (360 * v) / max, y, color, 24)
            text(String(v) + unit, 526, y - 15, 96, 26, color, 'left', 650)
        })
        text('0', 140, top + 185, 40, 24, c.textSecondary)
        text(String(max), 480, top + 185, 55, 24, c.textSecondary, 'right')
    }
    chart('FAQ p95 latency · seconds', 4.2, 1.1, 5, 's', 20)
    line(28, 278, 612, 278)
    chart('Token cost / conversation · index', 100, 38, 100, '', 316)
    text(
        'Same workload, traffic mix, and quality checks',
        28,
        558,
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
