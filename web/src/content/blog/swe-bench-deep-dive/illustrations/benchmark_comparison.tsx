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
export const height = 650
export const alt =
    'Two aligned paths: HumanEval supplies a named function and receives an implementation. SWE-bench supplies an issue and repository, requiring localization before patching. A file grid highlights one possible edit location; repository size is unspecified.'

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

    text('HumanEval · named coding target', 28, 14, 584, 29, blue, 'left', 650)
    box(28, 76, 260, 108, blue)
    box(360, 76, 252, 108, green)
    text('Named function', 40, 91, 236, 27, blue, 'center', 650)
    text('signature + docs', 40, 133, 236, 24, c.textSecondary, 'center')
    text('Implementation', 372, 91, 228, 27, green, 'center', 650)
    text('that function', 372, 133, 228, 24, c.textSecondary, 'center')
    arrow(292, 130, 354, 130)
    line(28, 233, 612, 233)
    text('SWE-bench · find the target first', 28, 268, 584, 29, purple, 'left', 650)
    box(28, 332, 260, 108, blue)
    box(360, 332, 252, 108, green)
    text('Issue + repo', 40, 347, 236, 27, blue, 'center', 650)
    text('localize the fault', 40, 389, 236, 24, c.textSecondary, 'center')
    text('Patch', 372, 347, 228, 27, green, 'center', 650)
    text('repair across files', 372, 389, 228, 24, c.textSecondary, 'center')
    arrow(292, 386, 354, 386)
    const files = ['src', 'lib', 'cli', 'util', 'fix', 'api', 'cfg', 'core', 'io']
    files.forEach((s, i) => {
        const x = 28 + (i % 3) * 84,
            y = 480 + Math.floor(i / 3) * 48
        box(x, y, 76, 40, i === 4 ? warm : c.border)
        text(s, x, y + 3, 76, 25, i === 4 ? warm : c.textSecondary, 'center', i === 4 ? 700 : 500)
    })
    text('One possible', 360, 506, 252, 26, c.textSecondary)
    text('edit location', 360, 546, 252, 26, warm)

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
