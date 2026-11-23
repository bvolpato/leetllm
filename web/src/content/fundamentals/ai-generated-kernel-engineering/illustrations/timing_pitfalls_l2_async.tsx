import React from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 900
export const height = 640
export const alt =
    'Two timing traps skew GPU kernel benchmarks. In the top timeline, host Python perf_counter without cuda.synchronize stops after queuing the kernel at 12 microseconds, missing the 148-microsecond asynchronous device execution measured by CUDA events. In the bottom bandwidth bars, reusing a 20 MB input fits inside H100 SXM 50 MB L2 cache and prints an apparent 4.80 TB/s exceeding the 3.35 TB/s HBM peak, whereas explicitly flushing a larger L2 buffer reveals the true 2.42 TB/s cold-HBM bandwidth.'

type ThemeColors = ReturnType<typeof getThemeColors>

const label = (
    c: ThemeColors,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    size = 28,
    color = c.textPrimary,
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
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const red = getReadableToneColor('critical', c)
    const neutral = getReadableToneColor('neutral', c)

    const barX = 320
    const bwScale = 76 // 5 TB/s = 380 px -> ends at 700
    const peakX = barX + 3.35 * bwScale

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
                x: barX,
                y: 126,
                width: 42,
                height: 34,
                rx: 6,
                fill: warm,
                stroke: warm,
            }),
            SvgFrame({
                c,
                x: barX,
                y: 178,
                width: 520,
                height: 34,
                rx: 6,
                fill: blue,
                stroke: blue,
            }),
            SvgFrame({
                c,
                x: barX,
                y: 230,
                width: 150,
                height: 34,
                rx: 6,
                fill: green,
                stroke: green,
            }),
            SvgFrame({
                c,
                x: 30,
                y: 294,
                width: 840,
                height: 2,
                rx: 0,
                fill: neutral,
                stroke: neutral,
            }),
            SvgFrame({
                c,
                x: barX,
                y: 392,
                width: 4.8 * bwScale,
                height: 36,
                rx: 6,
                fill: red,
                stroke: red,
            }),
            SvgFrame({
                c,
                x: barX,
                y: 452,
                width: 2.42 * bwScale,
                height: 36,
                rx: 6,
                fill: green,
                stroke: green,
            }),
            SvgFrame({
                c,
                x: peakX,
                y: 366,
                width: 3,
                height: 140,
                rx: 0,
                fill: neutral,
                stroke: neutral,
            }),
            SvgFrame({
                c,
                x: barX,
                y: 508,
                width: 420,
                height: 2,
                rx: 0,
                fill: neutral,
                stroke: neutral,
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
                    'Async launch and warm L2 skew GPU timing',
                    20,
                    14,
                    860,
                    42,
                    30,
                    c.textPrimary,
                    'center',
                    800,
                )}

                {label(
                    c,
                    '1. Host launch timer vs. GPU execution',
                    30,
                    74,
                    840,
                    36,
                    29,
                    blue,
                    'left',
                    800,
                )}
                {label(c, 'Host perf_counter', 30, 125, 280, 36, 28, warm, 'left', 700)}
                {label(c, '12 us (launch stub)', barX + 54, 125, 360, 36, 28, warm, 'left', 700)}
                {label(c, 'CUDA Events', 30, 177, 280, 36, 28, blue, 'left', 700)}
                {label(
                    c,
                    '148 us (actual kernel)',
                    barX + 14,
                    177,
                    490,
                    36,
                    28,
                    '#ffffff',
                    'center',
                    750,
                )}
                {label(c, 'Warmup + median', 30, 229, 280, 36, 28, green, 'left', 700)}
                {label(
                    c,
                    'Drops JIT & clock ramp',
                    barX + 162,
                    229,
                    360,
                    36,
                    28,
                    green,
                    'left',
                    700,
                )}

                {label(
                    c,
                    '2. L2 cache residency vs. explicit L2 flush',
                    30,
                    314,
                    840,
                    36,
                    29,
                    green,
                    'left',
                    800,
                )}
                {label(
                    c,
                    '3.35 TB/s HBM peak',
                    peakX - 150,
                    344,
                    300,
                    34,
                    28,
                    neutral,
                    'center',
                    700,
                )}
                {label(c, 'Warm L2 repeat', 30, 392, 280, 36, 28, red, 'left', 700)}
                {label(
                    c,
                    '4.80 TB/s',
                    barX + 4.8 * bwScale + 12,
                    392,
                    180,
                    36,
                    28,
                    red,
                    'left',
                    750,
                )}
                {label(c, 'Flushed L2 buffer', 30, 452, 280, 36, 28, green, 'left', 700)}
                {label(
                    c,
                    '2.42 TB/s cold',
                    barX + 2.42 * bwScale + 12,
                    452,
                    260,
                    36,
                    28,
                    green,
                    'left',
                    750,
                )}

                {label(c, '0', barX - 16, 518, 32, 34, 28, c.textSecondary, 'center', 650)}
                {label(
                    c,
                    '2',
                    barX + 2 * bwScale - 16,
                    518,
                    32,
                    34,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}
                {label(c, '3.35', peakX - 36, 518, 72, 34, 28, neutral, 'center', 700)}
                {label(
                    c,
                    '5 TB/s',
                    barX + 5 * bwScale - 45,
                    518,
                    90,
                    34,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}
                {label(
                    c,
                    'Report median across L2-flushed A-B-B-A CUDA event pairs.',
                    20,
                    574,
                    860,
                    38,
                    28,
                    neutral,
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
