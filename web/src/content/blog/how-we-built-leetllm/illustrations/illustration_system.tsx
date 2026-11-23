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
export const height = 710
export const alt =
    'One TSX illustration source enters a raster builder that produces dark and light PNG files. Both asset URLs are exposed by the content loader. The client Markdown renderer chooses the active variant without rebuilding the illustration.'

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c),
        green = getReadableToneColor('green', c),
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

    const node = (s: string, detail: string, x: number, y: number, w: number, color: string) => {
        box(x, y, w, 100, color)
        text(s, x + 8, y + 12, w - 16, 28, color, 'center', 650)
        text(detail, x + 8, y + 55, w - 16, 24, c.textSecondary, 'center')
    }
    node('TSX source', 'Vizmatic components', 170, 20, 300, blue)
    arrow(320, 124, 320, 170, purple)
    node('Raster builder', 'Satori + Resvg', 170, 176, 300, purple)
    arrow(270, 280, 166, 346, purple)
    arrow(370, 280, 474, 346, purple)
    node('Dark PNG', '*_dark.png', 28, 352, 276, c.textSecondary)
    node('Light PNG', '*_light.png', 336, 352, 276, c.textSecondary)
    arrow(166, 456, 270, 530, green)
    arrow(474, 456, 370, 530, green)
    node('Client renderer', 'choose active asset URL', 140, 536, 360, green)
    text('Build once · select by active theme', 28, 666, 584, 25, c.textSecondary, 'center')

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
