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
export const height = 620
export const alt =
    'A log-log roofline plot for an H100 SXM GPU compares memory-bandwidth and compute ceilings against four kernels. The 3.35 TB/s HBM3 ceiling rises linearly with arithmetic intensity until meeting the 67 TFLOP/s FP32 scalar ceiling near 20 FLOP/byte and the 989 TFLOP/s FP16 Tensor Core ceiling near 295 FLOP/byte. Unfused RMSNorm and naive GEMM sit far left at 0.25 to 0.80 FLOP/byte in the memory-bound region. Fusing normalization and activation multiplies arithmetic intensity toward 2.0 FLOP/byte by eliminating extra HBM round-trips. Shared-memory tiling in GEMM raises reuse by the tile dimension and shifts execution toward compute ceilings.'

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

// Canvas coords: left=105..845 (log10(I) in [-1, 3]), top=120..500 (log10(TFLOP/s) in [-0.6, 3.2])
const px = (logI: number) => 105 + ((logI + 1) / 4) * 740
const canvasY = (logP: number) => 500 - ((logP + 0.6) / 3.8) * 380
// AxisPlot uses bottom-up Cartesian y, so convert top-down canvasY via (height - y)
const plotY = (logP: number) => height - canvasY(logP)

function frame(theme: ThemeMode) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const purple = getReadableToneColor('purple', c)
    const warm = getReadableToneColor('warm', c)
    const red = getReadableToneColor('critical', c)
    const neutral = getReadableToneColor('neutral', c)

    const ridgeFp32 = Math.log10(67 / 3.35) // 1.30
    const ridgeTc = Math.log10(989 / 3.35) // 2.47

    const plot = AxisPlot({
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
            // Axes
            {
                points: [
                    { x: px(-1), y: plotY(-0.6) },
                    { x: px(3), y: plotY(-0.6) },
                ],
                color: neutral,
                strokeWidth: 3,
            },
            {
                points: [
                    { x: px(-1), y: plotY(-0.6) },
                    { x: px(-1), y: plotY(3.15) },
                ],
                color: neutral,
                strokeWidth: 3,
            },
            // H100 Tensor Core roofline
            {
                points: [
                    { x: px(-1), y: plotY(Math.log10(0.335)) },
                    { x: px(ridgeTc), y: plotY(Math.log10(989)) },
                    { x: px(3), y: plotY(Math.log10(989)) },
                ],
                color: purple,
                strokeWidth: 5,
            },
            // H100 FP32 scalar roofline
            {
                points: [
                    { x: px(ridgeFp32), y: plotY(Math.log10(67)) },
                    { x: px(3), y: plotY(Math.log10(67)) },
                ],
                color: blue,
                strokeWidth: 5,
            },
        ],
        points: [
            { x: px(Math.log10(0.25)), y: plotY(Math.log10(0.55)), fill: red, r: 9 },
            { x: px(Math.log10(0.8)), y: plotY(Math.log10(1.6)), fill: warm, r: 9 },
            { x: px(Math.log10(2.0)), y: plotY(Math.log10(4.5)), fill: green, r: 9 },
            { x: px(Math.log10(64)), y: plotY(Math.log10(120)), fill: purple, r: 9 },
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
                    {plot}
                </CanvasItem>
                {label(
                    c,
                    'Fusion and tiling move kernels along the roofline',
                    20,
                    14,
                    860,
                    42,
                    32,
                    c.textPrimary,
                    'center',
                    800,
                )}
                {label(
                    c,
                    'H100 SXM: 3.35 TB/s HBM, 67 TF FP32, 989 TF TC',
                    20,
                    62,
                    860,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}

                {label(
                    c,
                    'FP16 TC: 989 TF/s',
                    575,
                    canvasY(Math.log10(989)) - 42,
                    285,
                    36,
                    28,
                    purple,
                    'left',
                    750,
                )}
                {label(
                    c,
                    'FP32: 67 TF/s',
                    575,
                    canvasY(Math.log10(67)) + 12,
                    260,
                    36,
                    28,
                    blue,
                    'left',
                    750,
                )}
                {label(c, '3.35 TB/s slope', 300, 200, 260, 36, 28, neutral, 'left', 700)}

                {label(
                    c,
                    'Tiled GEMM',
                    px(Math.log10(64)) + 16,
                    canvasY(Math.log10(120)) - 18,
                    210,
                    36,
                    28,
                    purple,
                    'left',
                    750,
                )}
                {label(
                    c,
                    'Fused Norm+SiLU',
                    px(Math.log10(2.0)) + 18,
                    canvasY(Math.log10(4.5)) - 18,
                    290,
                    36,
                    28,
                    green,
                    'left',
                    750,
                )}
                {label(
                    c,
                    'Unfused norm',
                    px(Math.log10(0.8)) + 18,
                    canvasY(Math.log10(1.6)) - 18,
                    250,
                    36,
                    28,
                    warm,
                    'left',
                    750,
                )}
                {label(
                    c,
                    'Naive GEMM',
                    px(Math.log10(0.25)) + 18,
                    canvasY(Math.log10(0.55)) - 18,
                    230,
                    36,
                    28,
                    red,
                    'left',
                    750,
                )}

                {label(c, '0.1', px(-1) - 32, 514, 64, 34, 28, c.textSecondary, 'center', 650)}
                {label(c, '1', px(0) - 24, 514, 48, 34, 28, c.textSecondary, 'center', 650)}
                {label(c, '10', px(1) - 30, 514, 60, 34, 28, c.textSecondary, 'center', 650)}
                {label(c, '100', px(2) - 40, 514, 80, 34, 28, c.textSecondary, 'center', 650)}
                {label(c, '1000', 782, 514, 96, 34, 28, c.textSecondary, 'center', 650)}
                {label(
                    c,
                    'Arithmetic Intensity (FLOP / DRAM byte)',
                    170,
                    560,
                    600,
                    38,
                    28,
                    c.textSecondary,
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
