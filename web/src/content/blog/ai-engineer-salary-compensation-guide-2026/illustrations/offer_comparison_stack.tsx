import React from 'react'
import { Board, CanvasItem, TextLabel, defineIllustration, getReadableToneColor } from 'vizmatic'

export const width = 640
export const height = 760
export const alt =
    'Annual offer stacks share a 350 thousand dollar scale. Offer A totals 311,250 dollars in years 1 and 2, 321,250 in year 3, and 331,250 in year 4 as 10,000 and then 20,000 dollars of refreshers vest. Offer B shows 209,000 dollars of target cash plus 95,000 of stated private option value each year. Private option value depends on vesting and liquidity.'

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

    const colors = [blue, getReadableToneColor('cyan', c), green, purple, warm]
    const rows = [
        { title: 'A · years 1–2', values: [175, 26.25, 110, 0, 0], total: '311.25' },
        { title: 'A · year 3', values: [175, 26.25, 110, 10, 0], total: '321.25' },
        { title: 'A · year 4', values: [175, 26.25, 110, 20, 0], total: '331.25' },
        { title: 'B · each year', values: [190, 19, 0, 0, 95], total: '304' },
    ]
    text('Annual stated value · common $350k scale', 28, 12, 584, 27, c.textPrimary, 'left', 650)
    rows.forEach((row, i) => {
        const y = 76 + 112 * i
        text(row.title, 28, y, 350, 26)
        text('$' + row.total + 'k', 410, y, 202, 27, c.textPrimary, 'right', 650)
        line(28, y + 58, 612, y + 58, c.border, 30)
        let cursor = 28
        row.values.forEach((v, j) => {
            const next = cursor + (584 * v) / 350
            if (v) line(cursor, y + 58, next, y + 58, colors[j], 30)
            cursor = next
        })
    })
    ;['Base pay', 'Target bonus', 'Initial RSUs', 'Refresher vesting', 'Illiquid options'].forEach(
        (s, i) => {
            const x = i % 2 ? 340 : 28,
                y = 558 + Math.floor(i / 2) * 52
            line(x, y + 15, x + 28, y + 15, colors[i], 10)
            text(s, x + 42, y, 250, 25, colors[i])
        },
    )
    text('Options: stated $95k value, liquidity uncertain.', 28, 714, 584, 24, warm)

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
