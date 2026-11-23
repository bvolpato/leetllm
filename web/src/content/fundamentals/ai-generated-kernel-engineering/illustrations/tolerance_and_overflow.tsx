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
export const height = 790
export const alt =
    'For one reference component r=+1e-8 and candidate c=0, the atol=1e-6 acceptance interval includes zero, while atol=1e-10 excludes it. In the separate scalar overflow exercise, 1e19 squared is 1e38 and remains below the FP32 maximum 3.4e38, while 2e19 squared becomes 4e38 and overflows to infinity; reciprocal square root then yields zero and the direct FP32 product is zero, while the FP64 comparison is near one.'

type ThemeColors = ReturnType<typeof getThemeColors>

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
    <CanvasItem x={x} y={y} width={w} height={h}>
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

function frame(theme: ThemeMode) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const green = getReadableToneColor('green', c)
    const blue = getReadableToneColor('blue', c)
    const warm = getReadableToneColor('warm', c)
    const critical = getReadableToneColor('critical', c)
    const neutral = getReadableToneColor('neutral', c)

    const plotW = 400
    const plotH = 118
    const plotPad = 24
    const wideX = 28
    const tightX = 472
    const numberline = (
        min: number,
        max: number,
        from: number,
        to: number,
        candidate: number,
        reference: number,
        color: string,
    ) =>
        AxisPlot({
            c,
            width: plotW,
            height: plotH,
            xMin: min,
            xMax: max,
            yMin: -0.7,
            yMax: 0.7,
            padding: plotPad,
            showFrame: false,
            showAxes: false,
            showGrid: false,
            paths: [
                {
                    points: [
                        { x: min, y: 0 },
                        { x: max, y: 0 },
                    ],
                    color: neutral,
                    strokeWidth: 3,
                },
                {
                    points: [
                        { x: from, y: 0 },
                        { x: to, y: 0 },
                    ],
                    color,
                    strokeWidth: 14,
                },
                {
                    points: [
                        { x: candidate, y: -0.35 },
                        { x: candidate, y: 0 },
                    ],
                    color: critical,
                    strokeWidth: 4,
                },
                {
                    points: [
                        { x: reference, y: 0 },
                        { x: reference, y: 0.35 },
                    ],
                    color: warm,
                    strokeWidth: 4,
                },
            ],
            points: [
                { x: candidate, y: -0.35, fill: critical, r: 9 },
                { x: reference, y: 0.35, fill: c.bg, stroke: warm, strokeWidth: 4, r: 9 },
            ],
        })

    const wideTolerance = 1e-6 + 1e-5 * Math.abs(1e-8)
    const tightTolerance = 1e-10 + 1e-5 * Math.abs(1e-8)
    const wide = numberline(
        -1.2,
        1.2,
        (1e-8 - wideTolerance) / 1e-6,
        (1e-8 + wideTolerance) / 1e-6,
        0,
        0.01,
        green,
    )
    const tight = numberline(
        -0.2,
        1.2,
        (1e-8 - tightTolerance) / 1e-8,
        (1e-8 + tightTolerance) / 1e-8,
        0,
        1,
        green,
    )
    const mapOverflowX = (value: number) => 400 + (value / 4.5) * 450
    const thresholdX = mapOverflowX(3.4)

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        children: (
            <Board c={c} width={width} height={height} background="transparent">
                <CanvasItem x={0} y={0} width={width} height={height}>
                    <AxisPlot
                        c={c}
                        width={width}
                        height={height}
                        xMin={0}
                        xMax={width}
                        yMin={0}
                        yMax={height}
                        padding={0}
                        showFrame={false}
                        showAxes={false}
                        showGrid={false}
                    >
                        {[
                            SvgFrame({
                                c,
                                x: 400,
                                y: 500,
                                width: 100,
                                height: 24,
                                rx: 8,
                                fill: blue,
                                stroke: blue,
                            }),
                            SvgFrame({
                                c,
                                x: 400,
                                y: 579,
                                width: 400,
                                height: 24,
                                rx: 8,
                                fill: critical,
                                stroke: critical,
                            }),
                            SvgFrame({
                                c,
                                x: thresholdX,
                                y: 478,
                                width: 3,
                                height: 128,
                                rx: 0,
                                fill: neutral,
                                stroke: neutral,
                            }),
                            SvgFrame({
                                c,
                                x: 400,
                                y: 623,
                                width: 450,
                                height: 2,
                                rx: 0,
                                fill: neutral,
                                stroke: neutral,
                            }),
                            SvgFrame({
                                c,
                                x: mapOverflowX(1),
                                y: 619,
                                width: 2,
                                height: 10,
                                rx: 0,
                                fill: neutral,
                                stroke: neutral,
                            }),
                            SvgFrame({
                                c,
                                x: thresholdX,
                                y: 619,
                                width: 2,
                                height: 10,
                                rx: 0,
                                fill: neutral,
                                stroke: neutral,
                            }),
                            SvgFrame({
                                c,
                                x: mapOverflowX(4),
                                y: 619,
                                width: 2,
                                height: 10,
                                rx: 0,
                                fill: neutral,
                                stroke: neutral,
                            }),
                        ]}
                    </AxisPlot>
                </CanvasItem>
                <CanvasItem x={wideX} y={162} width={plotW} height={plotH}>
                    {wide}
                </CanvasItem>
                <CanvasItem x={tightX} y={162} width={plotW} height={plotH}>
                    {tight}
                </CanvasItem>

                {label(
                    c,
                    'Acceptance bands depend on atol',
                    24,
                    12,
                    852,
                    44,
                    32,
                    c.textPrimary,
                    'center',
                    800,
                )}
                {label(
                    c,
                    '|c − r| ≤ atol + rtol |r|',
                    32,
                    54,
                    836,
                    40,
                    32,
                    neutral,
                    'center',
                    700,
                    true,
                )}
                {label(
                    c,
                    'reference r = +10⁻⁸ · candidate c = 0',
                    32,
                    92,
                    836,
                    38,
                    30,
                    c.textSecondary,
                    'center',
                    650,
                )}
                {label(c, 'atol = 10⁻⁶', wideX, 136, plotW, 40, 30, green, 'center', 750, true)}
                {label(
                    c,
                    '10⁻⁶ scale · zero inside',
                    wideX,
                    272,
                    plotW,
                    38,
                    30,
                    green,
                    'center',
                    650,
                )}
                {label(
                    c,
                    'atol = 10⁻¹⁰',
                    tightX,
                    136,
                    plotW,
                    40,
                    30,
                    critical,
                    'center',
                    750,
                    true,
                )}
                {label(
                    c,
                    '10⁻⁸ scale · zero outside',
                    tightX,
                    272,
                    plotW,
                    38,
                    30,
                    critical,
                    'center',
                    650,
                )}

                {label(
                    c,
                    'FP32 overflow changes the computed path',
                    24,
                    320,
                    852,
                    44,
                    32,
                    c.textPrimary,
                    'center',
                    800,
                )}
                {label(
                    c,
                    'bar units: 10³⁸ · threshold = max FP32 ≈ 3.4',
                    48,
                    356,
                    820,
                    40,
                    30,
                    c.textSecondary,
                    'center',
                    650,
                )}
                {label(c, '1×10¹⁹ square', 44, 483, 340, 44, 30, blue, 'left', 700)}
                {label(c, '1×10³⁸ · finite', 44, 526, 340, 38, 30, blue, 'left', 700)}
                {label(c, '2×10¹⁹ square', 44, 562, 340, 44, 30, critical, 'left', 700)}
                {label(c, '4×10³⁸ · overflows', 44, 604, 340, 38, 30, critical, 'left', 700)}
                {label(
                    c,
                    'FP32 ceiling',
                    thresholdX - 92,
                    420,
                    210,
                    44,
                    30,
                    neutral,
                    'center',
                    650,
                )}
                {label(
                    c,
                    '0',
                    mapOverflowX(0) - 24,
                    633,
                    48,
                    36,
                    30,
                    c.textSecondary,
                    'center',
                    650,
                    true,
                )}
                {label(
                    c,
                    '1',
                    mapOverflowX(1) - 24,
                    633,
                    48,
                    36,
                    30,
                    c.textSecondary,
                    'center',
                    650,
                    true,
                )}
                {label(
                    c,
                    '3.4',
                    mapOverflowX(3.4) - 38,
                    633,
                    76,
                    44,
                    30,
                    c.textSecondary,
                    'center',
                    650,
                    true,
                )}
                {label(
                    c,
                    '4',
                    mapOverflowX(4) - 24,
                    633,
                    48,
                    36,
                    30,
                    c.textSecondary,
                    'center',
                    650,
                    true,
                )}
                {label(
                    c,
                    'FP32 path: 2×10¹⁹ → ∞ → 0',
                    32,
                    676,
                    836,
                    44,
                    30,
                    critical,
                    'center',
                    700,
                )}
                {label(
                    c,
                    'FP64: 2×10¹⁹ / √(4×10³⁸ + ε) ≈ 1',
                    32,
                    718,
                    836,
                    40,
                    30,
                    green,
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
