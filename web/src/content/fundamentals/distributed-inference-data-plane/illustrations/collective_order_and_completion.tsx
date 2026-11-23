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
    'Aligned rank timelines compare matching collective calls for layer 3 followed by layer 4 against rank 1 issuing layer 4 then layer 3. Equal element counts and dtypes still combine the wrong layers when call order differs, and skipping one call leaves peers stalled. Below, completion separates host enqueue and ncclGroupEnd, nonblocking communicator issuing, a CUDA completion event, and consumer reads.'

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
    const warm = c.warning
    const red = c.critical

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
            // Top-left: Matched schedule
            SvgFrame({
                c,
                x: 24,
                y: 106,
                width: 414,
                height: 244,
                rx: 12,
                fill: c.bgCard,
                stroke: green,
                strokeWidth: 2.5,
            }),
            SvgFrame({
                c,
                x: 146,
                y: 162,
                width: 122,
                height: 42,
                rx: 6,
                fill: c.bgCardAlt,
                stroke: blue,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 286,
                y: 162,
                width: 122,
                height: 42,
                rx: 6,
                fill: c.bgCardAlt,
                stroke: purple,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 146,
                y: 222,
                width: 122,
                height: 42,
                rx: 6,
                fill: c.bgCardAlt,
                stroke: blue,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 286,
                y: 222,
                width: 122,
                height: 42,
                rx: 6,
                fill: c.bgCardAlt,
                stroke: purple,
                strokeWidth: 2,
            }),

            // Top-right: Swapped order & skip
            SvgFrame({
                c,
                x: 462,
                y: 106,
                width: 414,
                height: 244,
                rx: 12,
                fill: c.bgCard,
                stroke: red,
                strokeWidth: 2.5,
            }),
            SvgFrame({
                c,
                x: 584,
                y: 162,
                width: 122,
                height: 42,
                rx: 6,
                fill: c.bgCardAlt,
                stroke: blue,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 724,
                y: 162,
                width: 122,
                height: 42,
                rx: 6,
                fill: c.bgCardAlt,
                stroke: purple,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 584,
                y: 222,
                width: 122,
                height: 42,
                rx: 6,
                fill: c.bgCardAlt,
                stroke: purple,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 724,
                y: 222,
                width: 122,
                height: 42,
                rx: 6,
                fill: c.bgCardAlt,
                stroke: blue,
                strokeWidth: 2,
            }),

            // Bottom strip: Completion chain
            SvgFrame({
                c,
                x: 24,
                y: 374,
                width: 852,
                height: 204,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 42,
                y: 444,
                width: 184,
                height: 96,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: warm,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 254,
                y: 444,
                width: 184,
                height: 96,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: blue,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 466,
                y: 444,
                width: 184,
                height: 96,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: green,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 678,
                y: 444,
                width: 180,
                height: 96,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: green,
                strokeWidth: 2.5,
            }),
            VectorArrow({
                x1: 226,
                y1: 492,
                x2: 252,
                y2: 492,
                color: warm,
                strokeWidth: 3,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 438,
                y1: 492,
                x2: 464,
                y2: 492,
                color: blue,
                strokeWidth: 3,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 650,
                y1: 492,
                x2: 676,
                y2: 492,
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
                    'Collective call order and GPU completion',
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
                    'Ranks must align layers and wait for CUDA stream completion',
                    20,
                    56,
                    860,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}

                {/* Matched */}
                {label(c, 'Matched schedule', 36, 118, 390, 34, 28, green, 'center', 800)}
                {label(c, 'Rank 0', 38, 166, 100, 34, 28, c.textPrimary, 'left', 700)}
                {label(c, 'a · L3', 150, 166, 114, 34, 28, blue, 'center', 750)}
                {label(c, 'b · L4', 290, 166, 114, 34, 28, purple, 'center', 750)}
                {label(c, 'Rank 1', 38, 226, 100, 34, 28, c.textPrimary, 'left', 700)}
                {label(c, 'a · L3', 150, 226, 114, 34, 28, blue, 'center', 750)}
                {label(c, 'b · L4', 290, 226, 114, 34, 28, purple, 'center', 750)}
                {label(c, 'L3 meets L3; L4 meets L4', 36, 294, 390, 36, 28, green, 'center', 700)}

                {/* Swapped */}
                {label(c, 'Swapped layer order', 474, 118, 390, 34, 28, red, 'center', 800)}
                {label(c, 'Rank 0', 476, 166, 100, 34, 28, c.textPrimary, 'left', 700)}
                {label(c, 'a · L3', 588, 166, 114, 34, 28, blue, 'center', 750)}
                {label(c, 'b · L4', 728, 166, 114, 34, 28, purple, 'center', 750)}
                {label(c, 'Rank 1', 476, 226, 100, 34, 28, c.textPrimary, 'left', 700)}
                {label(c, 'b · L4', 588, 226, 114, 34, 28, purple, 'center', 750)}
                {label(c, 'a · L3', 728, 226, 114, 34, 28, blue, 'center', 750)}
                {label(c, 'Joins wrong layers / hangs', 474, 294, 390, 36, 28, red, 'center', 700)}

                {/* Bottom completion */}
                {label(
                    c,
                    'Nonblocking issue and completion',
                    42,
                    392,
                    816,
                    36,
                    28,
                    c.textPrimary,
                    'left',
                    800,
                )}
                {label(c, '1. GroupEnd', 46, 454, 176, 34, 28, warm, 'center', 750)}
                {label(c, 'Host returns', 46, 496, 176, 34, 28, c.textSecondary, 'center', 600)}
                {label(c, '2. Comm Ok', 258, 454, 176, 34, 28, blue, 'center', 750)}
                {label(c, 'Issue state', 258, 496, 176, 34, 28, c.textSecondary, 'center', 600)}
                {label(c, '3. Event', 470, 454, 176, 34, 28, green, 'center', 750)}
                {label(c, 'GPU done', 470, 496, 176, 34, 28, c.textSecondary, 'center', 600)}
                {label(c, '4. Decode', 682, 454, 172, 34, 28, green, 'center', 750)}
                {label(c, 'Safe read', 682, 496, 172, 34, 28, c.textSecondary, 'center', 600)}
            </Board>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return frame(theme)
}

export default create('dark')
