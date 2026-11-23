import React from 'react'
import { Board, CanvasItem, TextLabel, defineIllustration, getReadableToneColor } from 'vizmatic'

export const width = 640
export const height = 740
export const alt =
    'Verified audit: 138 selected hard tasks out of 500, with 59.4 percent of that selected subset flawed. Pro audit: 286 initially flagged out of 731, then 200 labeled broken by agent-assisted review and 249 by humans. The two Pro counts overlap and must not be added.'

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c),
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

    const bar = (title: string, value: number, total: number, y: number, color: string) => {
        text(title, 28, y, 430, 25)
        text(String(value), 500, y, 110, 26, color, 'right', 650)
        line(28, y + 45, 612, y + 45, c.border, 14)
        line(28, y + 45, 28 + (584 * value) / total, y + 45, color, 14)
    }
    text('Verified · 500 public tasks', 28, 12, 584, 29, blue, 'left', 650)
    bar('Full set', 500, 500, 65, c.textMuted)
    bar('Selected hard-task audit', 138, 500, 145, warm)
    text('59.4% flawed within those 138.', 28, 225, 584, 26, warm)
    line(28, 290, 612, 290)
    text('Pro · 731 public tasks', 28, 320, 584, 29, purple, 'left', 650)
    bar('Full set', 731, 731, 370, c.textMuted)
    bar('Initially flagged', 286, 731, 450, warm)
    bar('Agent-assisted review: broken', 200, 731, 530, purple)
    bar('Human review: broken', 249, 731, 610, purple)
    text('The two review counts overlap.', 28, 690, 584, 25, c.textSecondary)

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
