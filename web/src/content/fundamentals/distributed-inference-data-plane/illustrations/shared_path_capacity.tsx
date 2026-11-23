import React from 'react'
import { AxisPlot, Board, CanvasItem, Scene, SvgFrame, TextLabel, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 900
export const height = 580
export const alt =
    'Two identical 1.25 GiB KV shards travel over one shared 25 GB/s bottleneck or two independent 25 GB/s links. On a 0 to 120 ms timeline, the shared bottleneck finishes both shards at 107.4 ms, supporting at most 9.31 transfers per second while 40 requests per second demand 107.4 GB/s. Two independent 25 GB/s links complete both shards in 53.7 ms before overhead.'

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
    const purple = c.primary
    const warm = c.warning
    const green = c.positive
    const red = c.critical

    const x0 = 260
    const span = 560
    const barW = (ms: number) => (ms / 120) * span
    const sharedMs = 107.374
    const indepMs = 53.687
    const by = (yTop: number) => height - yTop

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
            SvgFrame({
                c,
                x: 24,
                y: 108,
                width: 852,
                height: 158,
                rx: 12,
                fill: c.bgCard,
                stroke: warm,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: x0,
                y: 162,
                width: barW(sharedMs),
                height: 42,
                rx: 6,
                fill: warm,
                stroke: warm,
                strokeWidth: 1,
            }),

            SvgFrame({
                c,
                x: 24,
                y: 288,
                width: 852,
                height: 184,
                rx: 12,
                fill: c.bgCard,
                stroke: green,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: x0,
                y: 344,
                width: barW(indepMs),
                height: 34,
                rx: 6,
                fill: blue,
                stroke: blue,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: x0,
                y: 386,
                width: barW(indepMs),
                height: 34,
                rx: 6,
                fill: purple,
                stroke: purple,
                strokeWidth: 1,
            }),

            SvgFrame({
                c,
                x: 24,
                y: 492,
                width: 852,
                height: 64,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: red,
                strokeWidth: 1.5,
            }),
        ],
    })

    const axisOverlay = AxisPlot({
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
        paths: [
            {
                points: [
                    { x: x0, y: by(214) },
                    { x: x0 + span, y: by(214) },
                ],
                color: c.borderLight,
                strokeWidth: 2,
            },
            {
                points: [
                    { x: x0, y: by(432) },
                    { x: x0 + span, y: by(432) },
                ],
                color: c.borderLight,
                strokeWidth: 2,
            },
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
                <CanvasItem x={0} y={0} width={width} height={height}>
                    {axisOverlay}
                </CanvasItem>

                {label(
                    c,
                    'Shared bottleneck vs. independent KV links',
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
                    'Moving two 1.25 GiB shards (2.50 GiB total) at 25 GB/s per link',
                    20,
                    56,
                    860,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}

                {label(c, '1. Single shared 25 GB/s path', 42, 118, 600, 34, 28, warm, 'left', 800)}
                {label(c, '2 x 1.25 GiB', 42, 166, 210, 34, 28, c.textPrimary, 'left', 700)}
                {label(c, '107.4 ms', 274, 166, 300, 34, 28, c.textPrimary, 'left', 800)}
                {label(c, '0 ms', x0 - 10, 222, 90, 34, 28, c.textSecondary, 'left', 600)}
                {label(
                    c,
                    '60 ms',
                    x0 + barW(60) - 45,
                    222,
                    90,
                    34,
                    28,
                    c.textSecondary,
                    'center',
                    600,
                )}
                {label(
                    c,
                    '120 ms',
                    x0 + span - 95,
                    222,
                    100,
                    34,
                    28,
                    c.textSecondary,
                    'right',
                    600,
                )}

                {label(
                    c,
                    '2. Two independent 25 GB/s links',
                    42,
                    298,
                    600,
                    34,
                    28,
                    green,
                    'left',
                    800,
                )}
                {label(c, 'Rank 0 shard', 42, 344, 210, 34, 28, blue, 'left', 700)}
                {label(c, 'Rank 1 shard', 42, 386, 210, 34, 28, purple, 'left', 700)}
                {label(
                    c,
                    '53.7 ms parallel',
                    x0 + barW(indepMs) + 16,
                    366,
                    270,
                    34,
                    28,
                    green,
                    'left',
                    800,
                )}
                {label(c, '0 ms', x0 - 10, 436, 90, 34, 28, c.textSecondary, 'left', 600)}
                {label(
                    c,
                    '60 ms',
                    x0 + barW(60) - 45,
                    436,
                    90,
                    34,
                    28,
                    c.textSecondary,
                    'center',
                    600,
                )}
                {label(
                    c,
                    '120 ms',
                    x0 + span - 95,
                    436,
                    100,
                    34,
                    28,
                    c.textSecondary,
                    'right',
                    600,
                )}

                {label(
                    c,
                    '40 req/s needs 107.4 GB/s; 25 GB/s shared caps at 9.31 req/s',
                    32,
                    504,
                    836,
                    40,
                    28,
                    red,
                    'center',
                    700,
                )}
            </Board>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return frame(theme)
}

export default create('dark')
