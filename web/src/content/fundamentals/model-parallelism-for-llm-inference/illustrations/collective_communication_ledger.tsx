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
export const height = 620
export const alt =
    'Communication overlap and bandwidth comparison across tensor parallelism (TP=4) and pipeline parallelism (PP=2) for an 80-layer dense transformer. At 300 GB/s NVLink, 160 all-reduces per decode step move 96 KiB per rank per collective for a 0.05 ms payload transfer floor, whereas serial launch overhead of 5 to 20 microseconds adds 0.8 to 3.2 ms per step unless overlapped.'

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
    const green = c.positive
    const warm = c.warning
    const red = c.critical
    const purple = c.primary

    const nvlinkSlots = [0, 1, 2, 3].flatMap((i) => {
        const bx = 278 + i * 144
        return [
            SvgFrame({
                c,
                x: bx,
                y: 170,
                width: 120,
                height: 34,
                rx: 4,
                fill: blue,
                stroke: blue,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: bx + 122,
                y: 170,
                width: 16,
                height: 34,
                rx: 3,
                fill: green,
                stroke: green,
                strokeWidth: 1,
            }),
        ]
    })

    const pcieSlots = [0, 1, 2, 3].flatMap((i) => {
        const bx = 278 + i * 144
        return [
            SvgFrame({
                c,
                x: bx,
                y: 236,
                width: 72,
                height: 34,
                rx: 4,
                fill: blue,
                stroke: blue,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: bx + 74,
                y: 236,
                width: 64,
                height: 34,
                rx: 4,
                fill: red,
                stroke: red,
                strokeWidth: 1,
            }),
        ]
    })

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
            // Top card: Execution timeline comparison
            SvgFrame({
                c,
                x: 24,
                y: 108,
                width: 852,
                height: 248,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            ...nvlinkSlots,
            ...pcieSlots,
            // PP stage transfer (only 1 cross-stage boundary)
            SvgFrame({
                c,
                x: 278,
                y: 302,
                width: 242,
                height: 34,
                rx: 4,
                fill: blue,
                stroke: blue,
                strokeWidth: 1,
            }),
            VectorArrow({
                x1: 524,
                y1: 319,
                x2: 580,
                y2: 319,
                color: warm,
                strokeWidth: 3.5,
                arrowSize: 4,
            }),
            SvgFrame({
                c,
                x: 584,
                y: 302,
                width: 256,
                height: 34,
                rx: 4,
                fill: purple,
                stroke: purple,
                strokeWidth: 1,
            }),

            // Bottom card: 80-layer TP=4 ring cost breakdown (bars)
            SvgFrame({
                c,
                x: 24,
                y: 374,
                width: 852,
                height: 222,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 304,
                y: 428,
                width: 12,
                height: 34,
                rx: 4,
                fill: green,
                stroke: green,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: 304,
                y: 482,
                width: 112,
                height: 34,
                rx: 4,
                fill: blue,
                stroke: blue,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: 304,
                y: 536,
                width: 320,
                height: 34,
                rx: 4,
                fill: red,
                stroke: red,
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
                    'All-reduce exposure & bandwidth (80L, TP=4)',
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
                    '160 calls/step (96 KiB/rank); 20,320 over 128 tokens',
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
                    'Trace: Blue = compute | Green/Red = AR | PP edge',
                    42,
                    122,
                    816,
                    34,
                    28,
                    c.textPrimary,
                    'left',
                    750,
                )}
                {label(c, 'TP NVLink', 42, 172, 224, 34, 28, green, 'left', 750)}
                {label(c, 'TP PCIe stall', 42, 238, 224, 34, 28, red, 'left', 750)}
                {label(c, 'PP=2 handoff', 42, 304, 224, 34, 28, warm, 'left', 750)}

                {label(
                    c,
                    'TP=4 floor terms (batch=8, BF16, 64 KiB)',
                    42,
                    386,
                    816,
                    34,
                    28,
                    c.textPrimary,
                    'left',
                    800,
                )}
                {label(c, 'Payload 300 GB/s', 42, 430, 250, 34, 28, green, 'left', 750)}
                {label(
                    c,
                    '0.05 ms/step (unbounded BW)',
                    328,
                    430,
                    530,
                    34,
                    28,
                    c.textPrimary,
                    'left',
                    700,
                )}
                {label(c, 'Launch (5 us)', 42, 484, 250, 34, 28, blue, 'left', 750)}
                {label(
                    c,
                    '0.80 ms/step (serial floor)',
                    428,
                    484,
                    430,
                    34,
                    28,
                    c.textPrimary,
                    'left',
                    700,
                )}
                {label(c, 'Launch (20 us)', 42, 538, 250, 34, 28, red, 'left', 750)}
                {label(c, '3.20 ms (64x!)', 636, 538, 230, 34, 28, red, 'left', 750)}
            </Board>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return frame(theme)
}

export default create('dark')
