import React from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getThemeColors,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 900
export const height = 560
export const alt =
    'Two aligned index cells hold rank 0 values 1 and 2 and rank 1 values 10 and 20. Corresponding elements sum to 11 and 22. All-reduce copies the ordered vector 11,22 to both ranks. Reduce-scatter gives index 0, value 11, to rank 0 and index 1, value 22, to rank 1. All-gather then reconstructs the ordered vector 11,22 on both ranks.'

const label = (
    c: ReturnType<typeof getThemeColors>,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    size: number,
    color: string,
    align: 'left' | 'center' | 'right' = 'center',
    weight = 700,
) => (
    <CanvasItem x={x} y={y} width={w} height={h}>
        <TextLabel
            c={c}
            text={text}
            width="100%"
            fontSize={size}
            fontWeight={weight}
            color={color}
            align={align}
        />
    </CanvasItem>
)

function frame(theme: ThemeMode) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = c.info
    const purple = c.primary
    const green = c.positive

    const geometry = AxisPlot({
        c,
        width,
        height,
        xMin: 0,
        xMax: width,
        yMin: 0,
        yMax: height,
        padding: 0,
        showFrame: false,
        showAxes: false,
        showGrid: false,
        children: [
            // Top inputs bar
            SvgFrame({
                c,
                x: 24,
                y: 102,
                width: 852,
                height: 110,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 180,
                y: 120,
                width: 140,
                height: 38,
                rx: 6,
                fill: c.bgCardAlt,
                stroke: blue,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 180,
                y: 164,
                width: 140,
                height: 38,
                rx: 6,
                fill: c.bgCardAlt,
                stroke: purple,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 446,
                y: 136,
                width: 204,
                height: 48,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: green,
                strokeWidth: 2.5,
            }),
            VectorArrow({
                x1: 326,
                y1: 160,
                x2: 442,
                y2: 160,
                color: green,
                strokeWidth: 3.5,
                arrowSize: 4,
            }),

            // Left panel: All-reduce
            SvgFrame({
                c,
                x: 24,
                y: 234,
                width: 416,
                height: 298,
                rx: 12,
                fill: c.bgCard,
                stroke: blue,
                strokeWidth: 2.5,
            }),
            SvgFrame({
                c,
                x: 46,
                y: 344,
                width: 176,
                height: 52,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: blue,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 242,
                y: 344,
                width: 176,
                height: 52,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: blue,
                strokeWidth: 2,
            }),
            VectorArrow({
                x1: 232,
                y1: 212,
                x2: 232,
                y2: 232,
                color: blue,
                strokeWidth: 3.5,
                arrowSize: 4,
            }),

            // Right panel: Reduce-scatter -> All-gather
            SvgFrame({
                c,
                x: 460,
                y: 234,
                width: 416,
                height: 298,
                rx: 12,
                fill: c.bgCard,
                stroke: purple,
                strokeWidth: 2.5,
            }),
            SvgFrame({
                c,
                x: 492,
                y: 312,
                width: 140,
                height: 48,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: purple,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 696,
                y: 312,
                width: 140,
                height: 48,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: purple,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 482,
                y: 432,
                width: 176,
                height: 50,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: green,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 678,
                y: 432,
                width: 176,
                height: 50,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: green,
                strokeWidth: 2,
            }),
            VectorArrow({
                x1: 668,
                y1: 212,
                x2: 668,
                y2: 232,
                color: purple,
                strokeWidth: 3.5,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 562,
                y1: 362,
                x2: 562,
                y2: 430,
                color: green,
                strokeWidth: 3,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 766,
                y1: 362,
                x2: 766,
                y2: 430,
                color: green,
                strokeWidth: 3,
                arrowSize: 4,
            }),
        ],
    })

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        children: (
            <Board c={c} width={width} height={height} background="transparent">
                <CanvasItem x={0} y={0} width={width} height={height}>
                    {geometry}
                </CanvasItem>

                {label(
                    c,
                    'Replica collective outputs agree by index',
                    20,
                    14,
                    860,
                    42,
                    31,
                    c.textPrimary,
                    'center',
                    800,
                )}
                {label(
                    c,
                    'Sum partial vectors across tensor-parallel ranks',
                    20,
                    56,
                    860,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}

                {label(c, 'Rank 0', 48, 122, 120, 34, 28, blue, 'left', 750)}
                {label(c, '[1, 2]', 184, 122, 132, 34, 28, c.textPrimary, 'center', 750)}
                {label(c, 'Rank 1', 48, 166, 120, 34, 28, purple, 'left', 750)}
                {label(c, '[10, 20]', 184, 166, 132, 34, 28, c.textPrimary, 'center', 750)}
                {label(c, 'Sum: [11,22]', 450, 144, 196, 36, 28, green, 'center', 800)}
                {label(c, 'Idx 0, Idx 1', 658, 144, 210, 36, 28, c.textSecondary, 'left', 650)}

                {label(
                    c,
                    'All-reduce: full vector to all',
                    40,
                    250,
                    384,
                    36,
                    28,
                    blue,
                    'center',
                    800,
                )}
                {label(c, 'R0: [11,22]', 48, 354, 172, 36, 28, c.textPrimary, 'center', 750)}
                {label(c, 'R1: [11,22]', 244, 354, 172, 36, 28, c.textPrimary, 'center', 750)}
                {label(c, 'Every rank keeps full sum', 40, 444, 384, 36, 28, blue, 'center', 650)}

                {label(c, 'RS + All-gather', 476, 250, 384, 36, 28, purple, 'center', 800)}
                {label(c, 'R0: [11]', 496, 320, 132, 34, 28, purple, 'center', 750)}
                {label(c, 'R1: [22]', 700, 320, 132, 34, 28, purple, 'center', 750)}
                {label(c, 'Gather:', 602, 378, 132, 34, 28, green, 'center', 700)}
                {label(c, 'R0: [11,22]', 484, 440, 172, 34, 28, green, 'center', 750)}
                {label(c, 'R1: [11,22]', 680, 440, 172, 34, 28, green, 'center', 750)}
            </Board>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return frame(theme)
}

export default create('dark')
