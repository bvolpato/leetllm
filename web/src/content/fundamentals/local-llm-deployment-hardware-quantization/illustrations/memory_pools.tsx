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
export const height = 576
export const alt =
    'Three physical memory topologies. A discrete GPU splits host RAM from device VRAM across a deliberate transfer path. Apple Silicon shares one physical pool across OS, weights, and KV cache. CPU NUMA nodes split local DIMM channels (89.6 GB/s dual-channel DDR5, 358.4 GB/s eight-channel) from slower remote socket hops.'

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
            // Col 1: Discrete GPU
            SvgFrame({
                c,
                x: 24,
                y: 106,
                width: 266,
                height: 374,
                rx: 12,
                fill: c.bgCard,
                stroke: blue,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 42,
                y: 174,
                width: 100,
                height: 146,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: c.border,
                strokeWidth: 1.5,
            }),
            SvgFrame({
                c,
                x: 172,
                y: 174,
                width: 100,
                height: 146,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: blue,
                strokeWidth: 2,
            }),
            VectorArrow({
                x1: 144,
                y1: 247,
                x2: 170,
                y2: 247,
                color: warm,
                strokeWidth: 3.5,
                arrowSize: 4,
            }),

            // Col 2: Apple Unified
            SvgFrame({
                c,
                x: 317,
                y: 106,
                width: 266,
                height: 374,
                rx: 12,
                fill: c.bgCard,
                stroke: purple,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 335,
                y: 174,
                width: 104,
                height: 52,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: c.border,
                strokeWidth: 1.5,
            }),
            SvgFrame({
                c,
                x: 461,
                y: 174,
                width: 104,
                height: 52,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: purple,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 335,
                y: 248,
                width: 230,
                height: 96,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: purple,
                strokeWidth: 2,
            }),
            VectorArrow({
                x1: 387,
                y1: 226,
                x2: 387,
                y2: 246,
                color: c.textSecondary,
                strokeWidth: 3,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 513,
                y1: 226,
                x2: 513,
                y2: 246,
                color: purple,
                strokeWidth: 3,
                arrowSize: 4,
            }),

            // Col 3: CPU NUMA
            SvgFrame({
                c,
                x: 610,
                y: 106,
                width: 266,
                height: 374,
                rx: 12,
                fill: c.bgCard,
                stroke: green,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 628,
                y: 174,
                width: 100,
                height: 112,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: green,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 758,
                y: 174,
                width: 100,
                height: 112,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: blue,
                strokeWidth: 2,
            }),
            VectorArrow({
                x1: 728,
                y1: 230,
                x2: 756,
                y2: 230,
                color: warm,
                strokeWidth: 3,
                arrowSize: 4,
            }),

            // Footer
            SvgFrame({
                c,
                x: 24,
                y: 498,
                width: 852,
                height: 46,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: c.border,
                strokeWidth: 1.5,
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
                    'Three physical memory topologies',
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
                    'Capacity and bandwidth depend on where bytes reside',
                    20,
                    56,
                    860,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}

                {/* Discrete GPU */}
                {label(c, 'Discrete GPU', 34, 120, 246, 36, 28, blue, 'center', 800)}
                {label(c, 'Host', 46, 204, 92, 34, 28, c.textPrimary, 'center', 700)}
                {label(c, 'RAM', 46, 246, 92, 34, 28, c.textSecondary, 'center', 600)}
                {label(c, 'GPU', 176, 204, 92, 34, 28, blue, 'center', 750)}
                {label(c, 'VRAM', 176, 246, 92, 34, 28, c.textPrimary, 'center', 650)}
                {label(c, 'Explicit copy', 34, 348, 246, 34, 28, warm, 'center', 700)}
                {label(c, 'RAM != VRAM', 34, 410, 246, 34, 28, c.textPrimary, 'center', 750)}

                {/* Unified */}
                {label(c, 'Apple Unified', 327, 120, 246, 36, 28, purple, 'center', 800)}
                {label(c, 'CPU', 339, 182, 96, 34, 28, c.textPrimary, 'center', 700)}
                {label(c, 'GPU', 465, 182, 96, 34, 28, purple, 'center', 750)}
                {label(c, 'OS + Wts + KV', 342, 278, 216, 34, 28, c.textPrimary, 'center', 700)}
                {label(c, 'One shared pool', 327, 410, 246, 34, 28, purple, 'center', 700)}

                {/* NUMA */}
                {label(c, 'CPU NUMA', 620, 120, 246, 36, 28, green, 'center', 800)}
                {label(c, 'N0', 632, 208, 92, 34, 28, green, 'center', 750)}
                {label(c, 'N1', 762, 208, 92, 34, 28, blue, 'center', 750)}
                {label(c, '2ch: 89.6 GB/s', 620, 348, 246, 34, 28, green, 'center', 700)}
                {label(c, '8ch: 358 GB/s', 620, 410, 246, 34, 28, c.textSecondary, 'center', 650)}

                {label(
                    c,
                    'DDR5 peaks are theoretical; measure sustained throughput.',
                    32,
                    504,
                    836,
                    36,
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
