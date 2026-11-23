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
export const height = 600
export const alt =
    'Three-gate screening rejects TP=1 for exceeding 80 GB per rank and admits TP=2 (310 ms TTFT, 45 ms TPOT, 620 TPS) while excluding TP=4 (430 ms TTFT, 62 ms TPOT) despite higher raw 700 TPS. Below, comparing a 620 TPS two-GPU group ($6/hr, $2.69 per million tokens) against a 900 TPS four-GPU group ($12/hr, $3.70 per million tokens) shows why faster throughput can cost more per token.'

const label = (
    c: ReturnType<typeof getThemeColors>,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    size: number,
    color: string,
    align: 'left' | 'center' | 'right' = 'left',
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
    const red = c.critical
    const green = c.positive
    const blue = c.info
    const warm = c.warning

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
            // Top: Gate screening table (TP=1, TP=2, TP=4)
            SvgFrame({
                c,
                x: 24,
                y: 108,
                width: 852,
                height: 274,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 42,
                y: 170,
                width: 816,
                height: 56,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: red,
                strokeWidth: 1.5,
            }),
            SvgFrame({
                c,
                x: 42,
                y: 240,
                width: 816,
                height: 56,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: green,
                strokeWidth: 2.5,
            }),
            SvgFrame({
                c,
                x: 42,
                y: 310,
                width: 816,
                height: 56,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: warm,
                strokeWidth: 1.5,
            }),

            // Arrow down to cost Pareto
            VectorArrow({
                x1: 450,
                y1: 382,
                x2: 450,
                y2: 414,
                color: green,
                strokeWidth: 3.5,
                arrowSize: 4,
            }),

            // Bottom: Eligible cost per million tokens ($2.69 vs $3.70)
            SvgFrame({
                c,
                x: 24,
                y: 416,
                width: 852,
                height: 158,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 284,
                y: 472,
                width: 240,
                height: 34,
                rx: 6,
                fill: green,
                stroke: green,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: 284,
                y: 522,
                width: 330,
                height: 34,
                rx: 6,
                fill: blue,
                stroke: blue,
                strokeWidth: 1,
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
                    'Filter fit & SLO gates before $/token',
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
                    'VRAM <= 80 GB | TTFT <= 400 | TPOT <= 55 ms',
                    20,
                    56,
                    860,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}

                {label(c, 'Layout', 54, 122, 130, 34, 28, c.textSecondary, 'left', 750)}
                {label(c, 'Fit', 194, 122, 120, 34, 28, c.textSecondary, 'center', 750)}
                {label(c, 'TTFT / TPOT', 326, 122, 230, 34, 28, c.textSecondary, 'center', 750)}
                {label(c, 'TPS', 572, 122, 120, 34, 28, c.textSecondary, 'center', 750)}
                {label(c, 'Decision', 704, 122, 140, 34, 28, c.textSecondary, 'center', 750)}

                {label(c, 'TP=1', 54, 180, 130, 34, 28, red, 'left', 800)}
                {label(c, '86 GB', 194, 180, 120, 34, 28, red, 'center', 750)}
                {label(c, 'OOM', 326, 180, 230, 34, 28, red, 'center', 700)}
                {label(c, '-', 572, 180, 120, 34, 28, c.textSecondary, 'center', 700)}
                {label(c, 'Fail fit', 704, 180, 140, 34, 28, red, 'center', 800)}

                {label(c, 'TP=2', 54, 250, 130, 34, 28, green, 'left', 800)}
                {label(c, 'Fits', 194, 250, 120, 34, 28, green, 'center', 750)}
                {label(c, '310 / 45 ms', 326, 250, 230, 34, 28, green, 'center', 750)}
                {label(c, '620', 572, 250, 120, 34, 28, c.textPrimary, 'center', 750)}
                {label(c, 'Eligible', 704, 250, 140, 34, 28, green, 'center', 800)}

                {label(c, 'TP=4', 54, 320, 130, 34, 28, warm, 'left', 800)}
                {label(c, 'Fits', 194, 320, 120, 34, 28, green, 'center', 750)}
                {label(c, '430 / 62 ms', 326, 320, 230, 34, 28, red, 'center', 750)}
                {label(c, '700', 572, 320, 120, 34, 28, c.textPrimary, 'center', 750)}
                {label(c, 'Fail SLO', 704, 320, 140, 34, 28, red, 'center', 800)}

                {label(
                    c,
                    'Cost per 1M tokens (when both clear SLO)',
                    42,
                    428,
                    816,
                    34,
                    28,
                    c.textPrimary,
                    'left',
                    800,
                )}
                {label(c, '2 GPU (620 t/s)', 42, 472, 230, 34, 28, green, 'left', 750)}
                {label(c, '$2.69/M ($6/hr)', 538, 472, 320, 34, 28, green, 'left', 800)}
                {label(c, '4 GPU (900 t/s)', 42, 522, 230, 34, 28, blue, 'left', 750)}
                {label(c, '$3.70/M ($12/hr)', 628, 522, 244, 34, 28, blue, 'left', 800)}
            </Board>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return frame(theme)
}

export default create('dark')
