import React from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 900
export const height = 780
export const alt =
    'During the same assumed 12 microsecond interval, three logical FP16 streams contribute 20.8 MB each: input reads, per-row weight reads, and output writes. Their 62.4 MB requested total implies 5.20 TB/s. The example separately assumes 30 MB of HBM traffic, or 2.50 TB/s, below the 3.35 TB/s H100 SXM peak. Cache and reuse explain why these numerators differ; the assumed HBM bytes are not a profiler measurement. If the weight is fetched only once, unique input, weight, and output payload is (2NH+H)×2 = 41.602 MB.'

type ThemeColors = ReturnType<typeof getThemeColors>
const scaleX = width / 1000

const label = (
    c: ThemeColors,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    size = 32,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
    weight = 700,
    mono = false,
) => (
    <CanvasItem x={x * scaleX} y={y} width={w * scaleX} height={h}>
        <TextLabel
            c={c}
            text={text}
            width="100%"
            fontSize={size}
            fontWeight={weight}
            color={color}
            align={align}
            mono={mono}
        />
    </CanvasItem>
)

const box = (
    c: ThemeColors,
    x: number,
    y: number,
    w: number,
    h: number,
    stroke: string,
    fill = c.bgCard,
) =>
    SvgFrame({
        c,
        x: x * scaleX,
        y,
        width: w * scaleX,
        height: h,
        rx: 12,
        fill,
        stroke,
        strokeWidth: 3,
    })

function frame(theme: ThemeMode) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const neutral = getReadableToneColor('neutral', c)
    const mapTrafficX = (value: number) => 560 + (value / 6) * 360
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
            box(c, 56, 234, 118, 78, blue),
            box(c, 218, 234, 118, 78, purple),
            box(c, 380, 234, 118, 78, green),
            VectorArrow({
                x1: 178 * scaleX,
                y1: 273,
                x2: 210 * scaleX,
                y2: 273,
                color: blue,
                strokeWidth: 6,
                arrowSize: 3,
            }),
            VectorArrow({
                x1: 340 * scaleX,
                y1: 273,
                x2: 372 * scaleX,
                y2: 273,
                color: purple,
                strokeWidth: 6,
                arrowSize: 3,
            }),
            box(c, 560, 280, 360, 42, neutral),
            box(c, 560, 280, 312, 42, blue),
            box(c, 560, 375, 360, 42, neutral),
            box(c, 560, 375, 150, 42, purple),
            SvgFrame({
                c,
                x: 761 * scaleX,
                y: 280,
                width: 4 * scaleX,
                height: 42,
                rx: 2,
                fill: warm,
                stroke: warm,
                strokeWidth: 0,
            }),
            SvgFrame({
                c,
                x: 761 * scaleX,
                y: 375,
                width: 4 * scaleX,
                height: 42,
                rx: 2,
                fill: warm,
                stroke: warm,
                strokeWidth: 0,
            }),
            SvgFrame({
                c,
                x: 560 * scaleX,
                y: 452,
                width: 360 * scaleX,
                height: 3,
                rx: 1,
                fill: neutral,
                stroke: neutral,
                strokeWidth: 0,
            }),
            ...[0, 2, 4, 6].map((value) =>
                SvgFrame({
                    c,
                    x: mapTrafficX(value) * scaleX,
                    y: 445,
                    width: 3 * scaleX,
                    height: 15,
                    rx: 1,
                    fill: neutral,
                    stroke: neutral,
                    strokeWidth: 0,
                }),
            ),
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
                    'One interval, two traffic boundaries',
                    24,
                    12,
                    952,
                    55,
                    38,
                    c.textPrimary,
                    'center',
                    800,
                )}
                {label(c, 'same assumed time: 12 µs', 30, 70, 500, 46, 34, neutral, 'left', 650)}
                {label(c, 'requested work', 38, 164, 480, 48, 34, c.textSecondary, 'center', 700)}
                {label(c, 'SM', 56, 250, 118, 42, 34, blue, 'center', 800)}
                {label(c, 'L2', 218, 250, 118, 42, 34, purple, 'center', 800)}
                {label(c, 'HBM', 380, 250, 118, 42, 34, green, 'center', 800)}
                {label(c, '62.4 MB', 20, 326, 190, 48, 34, blue, 'center', 750, true)}
                {label(c, 'reuse', 205, 326, 142, 48, 34, purple, 'center', 700)}
                {label(c, '30 MB*', 354, 326, 170, 48, 34, green, 'center', 750, true)}
                {label(c, 'logical requests', 24, 370, 470, 48, 32, c.textSecondary, 'center', 600)}
                {label(c, 'HBM assumption', 24, 405, 470, 48, 32, c.textSecondary, 'center', 600)}

                {label(c, 'RATE  ·  TB/s', 550, 132, 430, 46, 34, c.textSecondary, 'center', 750)}
                {label(c, 'logical · 5.20', 560, 225, 360, 46, 34, blue, 'left', 750)}
                {label(c, 'HBM* · 2.50', 560, 330, 360, 46, 34, c.textPrimary, 'left', 750)}
                {label(c, '3.35 peak', 774, 184, 216, 46, 34, warm, 'left', 750)}
                {[0, 2, 4, 6].map((value) =>
                    label(
                        c,
                        String(value),
                        mapTrafficX(value) - 19,
                        464,
                        38,
                        42,
                        34,
                        neutral,
                        'center',
                        650,
                        true,
                    ),
                )}

                {label(c, 'x read · 20.8 MB', 26, 519, 460, 50, 32, blue, 'center', 700)}
                {label(c, 'weight read · 20.8 MB', 514, 519, 460, 50, 32, blue, 'center', 700)}
                {label(c, 'output write · 20.8 MB', 26, 558, 460, 50, 32, blue, 'center', 700)}
                {label(c, 'requested · 62.4 MB', 514, 558, 460, 50, 32, blue, 'center', 700)}
                {label(
                    c,
                    'w fetched once · (2NH+H)×2 = 41.602 MB',
                    26,
                    602,
                    948,
                    50,
                    32,
                    neutral,
                    'center',
                    700,
                    true,
                )}
                {label(
                    c,
                    '* HBM traffic is assumed, not profiled.',
                    26,
                    664,
                    948,
                    48,
                    32,
                    c.textSecondary,
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
