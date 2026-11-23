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
export const height = 610
export const alt =
    'The MLP Z=GeLU(xA)B+b uses A[2x4] split by columns and B[4x2] split by rows. Both ranks receive x=[1,2]. Rank 0 computes xA0=[1,1], h0=[0.841,0.841], and p0=[0.841,0.841]. Rank 1 computes xA1=[0,4], h1=[0,4.000], and p1=[-4.000,8.000]. One SUM all-reduce yields [-3.159,8.841]; adding bias [0.5,-0.5] once gives [-2.659,8.341] on both ranks.'

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
    const purple = c.primary
    const blue = c.info
    const green = c.positive
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
            // Input x
            SvgFrame({
                c,
                x: 20,
                y: 236,
                width: 120,
                height: 112,
                rx: 10,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),

            // Rank 0 lane
            SvgFrame({
                c,
                x: 184,
                y: 112,
                width: 450,
                height: 156,
                rx: 12,
                fill: c.bgCard,
                stroke: purple,
                strokeWidth: 2.5,
            }),
            SvgFrame({
                c,
                x: 196,
                y: 162,
                width: 198,
                height: 88,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: purple,
                strokeWidth: 1.5,
            }),
            SvgFrame({
                c,
                x: 424,
                y: 162,
                width: 198,
                height: 88,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: purple,
                strokeWidth: 1.5,
            }),
            VectorArrow({
                x1: 396,
                y1: 206,
                x2: 422,
                y2: 206,
                color: purple,
                strokeWidth: 3,
                arrowSize: 4,
            }),

            // Rank 1 lane
            SvgFrame({
                c,
                x: 184,
                y: 292,
                width: 450,
                height: 156,
                rx: 12,
                fill: c.bgCard,
                stroke: blue,
                strokeWidth: 2.5,
            }),
            SvgFrame({
                c,
                x: 196,
                y: 342,
                width: 198,
                height: 88,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: blue,
                strokeWidth: 1.5,
            }),
            SvgFrame({
                c,
                x: 424,
                y: 342,
                width: 198,
                height: 88,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: blue,
                strokeWidth: 1.5,
            }),
            VectorArrow({
                x1: 396,
                y1: 386,
                x2: 422,
                y2: 386,
                color: blue,
                strokeWidth: 3,
                arrowSize: 4,
            }),

            // Input arrows
            VectorArrow({
                x1: 140,
                y1: 274,
                x2: 182,
                y2: 206,
                color: purple,
                strokeWidth: 3,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 140,
                y1: 310,
                x2: 182,
                y2: 386,
                color: blue,
                strokeWidth: 3,
                arrowSize: 4,
            }),

            // All-Reduce SUM & Bias output
            SvgFrame({
                c,
                x: 676,
                y: 176,
                width: 204,
                height: 136,
                rx: 12,
                fill: c.bgCard,
                stroke: green,
                strokeWidth: 2.5,
            }),
            SvgFrame({
                c,
                x: 676,
                y: 348,
                width: 204,
                height: 100,
                rx: 12,
                fill: c.bgCardAlt,
                stroke: warm,
                strokeWidth: 2,
            }),
            VectorArrow({
                x1: 634,
                y1: 206,
                x2: 674,
                y2: 232,
                color: green,
                strokeWidth: 3,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 634,
                y1: 374,
                x2: 674,
                y2: 266,
                color: green,
                strokeWidth: 3,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 778,
                y1: 312,
                x2: 778,
                y2: 346,
                color: warm,
                strokeWidth: 3,
                arrowSize: 4,
            }),

            // Summary bar
            SvgFrame({
                c,
                x: 20,
                y: 474,
                width: 860,
                height: 106,
                rx: 12,
                fill: c.bgCardAlt,
                stroke: c.border,
                strokeWidth: 2,
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
                    'Megatron-LM MLP: column A, row B, one SUM all-reduce',
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
                    'Split hidden dim (4 -> 2 + 2); reduce once after row B',
                    20,
                    56,
                    860,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}

                {label(c, 'Input x', 24, 250, 112, 34, 28, c.textPrimary, 'center', 800)}
                {label(c, '[1, 2]', 24, 294, 112, 34, 28, warm, 'center', 750)}

                {label(c, 'Rank 0 (c0..1 / r0..1)', 194, 120, 430, 34, 28, purple, 'center', 800)}
                {label(c, 'GeLU(x A0)', 200, 168, 190, 34, 28, c.textPrimary, 'center', 700)}
                {label(c, '[0.84, 0.84]', 200, 206, 190, 34, 28, purple, 'center', 750)}
                {label(c, 'p0 = h0 B0', 428, 168, 190, 34, 28, c.textPrimary, 'center', 700)}
                {label(c, '[0.84, 0.84]', 428, 206, 190, 34, 28, purple, 'center', 750)}

                {label(c, 'Rank 1 (c2..3 / r2..3)', 194, 300, 430, 34, 28, blue, 'center', 800)}
                {label(c, 'GeLU(x A1)', 200, 348, 190, 34, 28, c.textPrimary, 'center', 700)}
                {label(c, '[0.0, 4.0]', 200, 386, 190, 34, 28, blue, 'center', 750)}
                {label(c, 'p1 = h1 B1', 428, 348, 190, 34, 28, c.textPrimary, 'center', 700)}
                {label(c, '[-4.0, 8.0]', 428, 386, 190, 34, 28, blue, 'center', 750)}

                {label(c, 'SUM Reduce', 682, 192, 192, 34, 28, green, 'center', 800)}
                {label(c, '[-3.16, 8.84]', 682, 246, 192, 34, 28, c.textPrimary, 'center', 750)}
                {label(c, '+ b once', 682, 358, 192, 34, 28, warm, 'center', 800)}
                {label(c, '[-2.66, 8.34]', 682, 400, 192, 34, 28, c.textPrimary, 'center', 800)}

                {label(
                    c,
                    'p0 + p1 = [-3.159, 8.841]; adding bias [0.5, -0.5] once gives dense output [-2.659, 8.341].',
                    34,
                    488,
                    832,
                    72,
                    28,
                    c.textPrimary,
                    'center',
                    650,
                )}
            </Board>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return frame(theme)
}

export default create('dark')
