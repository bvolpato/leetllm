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
    'Six input tokens each route top-2 experts across two devices. E0 and E1 on Device 0 receive 8 assignments while E2 and E3 on Device 1 receive 4 assignments (1.33x peak-to-average skew). Token T3 (value 4) dispatches 0.75 weight to E0 and 0.25 to E2, yielding weighted contributions 3 + 3 = 6.'

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
    const blue = c.info
    const warm = c.warning
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
            // Top: Device skew bars (8 vs 4 assignments)
            SvgFrame({
                c,
                x: 24,
                y: 108,
                width: 852,
                height: 190,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 266,
                y: 170,
                width: 380,
                height: 38,
                rx: 6,
                fill: warm,
                stroke: warm,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: 266,
                y: 232,
                width: 190,
                height: 38,
                rx: 6,
                fill: blue,
                stroke: blue,
                strokeWidth: 1,
            }),

            // Bottom: T3 worked dispatch/combine dataflow
            SvgFrame({
                c,
                x: 24,
                y: 318,
                width: 852,
                height: 256,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 42,
                y: 422,
                width: 146,
                height: 90,
                rx: 10,
                fill: c.bgCardAlt,
                stroke: purple,
                strokeWidth: 2,
            }),
            // Expert branches
            SvgFrame({
                c,
                x: 276,
                y: 382,
                width: 324,
                height: 66,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: warm,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 276,
                y: 474,
                width: 324,
                height: 66,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: blue,
                strokeWidth: 2,
            }),
            // Dispatch arrows
            VectorArrow({
                x1: 190,
                y1: 454,
                x2: 274,
                y2: 415,
                color: warm,
                strokeWidth: 3.5,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 190,
                y1: 482,
                x2: 274,
                y2: 507,
                color: blue,
                strokeWidth: 3.5,
                arrowSize: 4,
            }),
            // Combine box & arrows
            SvgFrame({
                c,
                x: 676,
                y: 422,
                width: 180,
                height: 90,
                rx: 10,
                fill: c.bgCardAlt,
                stroke: green,
                strokeWidth: 2,
            }),
            VectorArrow({
                x1: 602,
                y1: 415,
                x2: 674,
                y2: 454,
                color: green,
                strokeWidth: 3.5,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 602,
                y1: 507,
                x2: 674,
                y2: 482,
                color: green,
                strokeWidth: 3.5,
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
                    'Expert parallelism dispatch skew and weighted combine',
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
                    '6 tok x top-2 across 2 GPUs (1.33x skew)',
                    20,
                    56,
                    860,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}

                {label(
                    c,
                    'Device assignments (E0,E1 on D0; E2,E3 on D1)',
                    42,
                    122,
                    816,
                    34,
                    28,
                    c.textPrimary,
                    'left',
                    800,
                )}
                {label(c, 'D0 (E0,E1)', 42, 172, 214, 34, 28, warm, 'left', 750)}
                {label(c, '8 hits (1.33x)', 660, 172, 206, 34, 28, warm, 'left', 750)}
                {label(c, 'D1 (E2,E3)', 42, 234, 214, 34, 28, blue, 'left', 750)}
                {label(c, '4 hits', 472, 234, 220, 34, 28, blue, 'left', 750)}

                {label(
                    c,
                    'Example path for token T3 (input x = 4.0)',
                    42,
                    332,
                    816,
                    34,
                    28,
                    c.textPrimary,
                    'left',
                    800,
                )}
                {label(c, 'T3 (x=4)', 46, 450, 138, 34, 28, purple, 'center', 800)}
                {label(c, 'E0 (D0): .75*4 = 3', 282, 398, 312, 34, 28, warm, 'center', 750)}
                {label(c, 'E2 (D1): .25*12 = 3', 282, 490, 312, 34, 28, blue, 'center', 750)}
                {label(c, 'Out: 6.0', 682, 450, 168, 34, 28, green, 'center', 800)}
            </Board>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return frame(theme)
}

export default create('dark')
