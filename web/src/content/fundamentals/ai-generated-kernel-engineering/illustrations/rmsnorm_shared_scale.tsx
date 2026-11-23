import React from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    FlowArrow,
    Scene,
    SvgFrame,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 900
export const height = 760
export const alt =
    'In one shared coordinate plane, RMSNorm scales x=[3,4] to r x≈[0.8485278,1.1313704] along the same ray. Multiplying by w=[1,2] leaves x₁ unchanged and doubles x₂, giving y≈[0.8485278,2.2627409] with a new direction. The calculation uses mean square 12.5 and r≈0.2828426. A separate zero-row inset uses r₀=1/√ε≈316.23; scaling [0,0] still gives [0,0].'

type ThemeColors = ReturnType<typeof getThemeColors>

const label = (
    c: ThemeColors,
    value: string,
    x: number,
    y: number,
    labelWidth: number,
    labelHeight: number,
    fontSize: number,
    color = c.textPrimary,
    options: { align?: 'left' | 'center' | 'right'; weight?: number; mono?: boolean } = {},
) =>
    React.createElement(
        CanvasItem,
        {
            x: x + (options.align === 'left' || options.align === undefined ? 6 : 0),
            y,
            width: labelWidth - (options.align === 'left' || options.align === undefined ? 6 : 0),
            height: labelHeight,
        },
        React.createElement(TextLabel, {
            c,
            text: value,
            width: labelWidth - (options.align === 'left' || options.align === undefined ? 6 : 0),
            fontSize,
            fontWeight: options.weight ?? 650,
            color,
            align: options.align ?? 'left',
            mono: options.mono ?? false,
        }),
    )

function frame(theme: ThemeMode) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const warm = getReadableToneColor('warm', c)
    const green = getReadableToneColor('green', c)
    const zeroBorder = getReadableToneColor('neutral', c)

    // FP32 reference values for x=[3,4], w=[1,2], eps=1e-5.
    const scaled = [0.8485277891159058, 1.1313704252243042] as const
    const weighted = [0.8485277891159058, 2.2627408504486084] as const
    const plotX = 30
    const plotY = 145
    const plotSize = 430
    const plotPadding = 48
    const plotInner = plotSize - 2 * plotPadding
    const mapX = (x: number) => plotX + plotPadding + (x / 4.5) * plotInner
    const mapY = (y: number) => plotY + plotPadding + plotInner - (y / 4.5) * plotInner

    const plot = AxisPlot({
        c,
        width: plotSize,
        height: plotSize,
        xMin: 0,
        xMax: 4.5,
        yMin: 0,
        yMax: 4.5,
        padding: plotPadding,
        showFrame: true,
        showAxes: true,
        showGrid: true,
        gridCount: 3,
        frameFill: c.bgCard,
        frameStroke: zeroBorder,
        axisColor: zeroBorder,
        vectors: [
            { x1: 0, y1: 0, x2: 3, y2: 4, color: blue, strokeWidth: 7, arrow: true, arrowSize: 3 },
            {
                x1: 0,
                y1: 0,
                x2: scaled[0],
                y2: scaled[1],
                color: purple,
                strokeWidth: 7,
                arrow: true,
                arrowSize: 3,
            },
            {
                x1: 0,
                y1: 0,
                x2: weighted[0],
                y2: weighted[1],
                color: green,
                strokeWidth: 7,
                arrow: true,
                arrowSize: 3,
            },
            {
                x1: scaled[0],
                y1: scaled[1],
                x2: weighted[0],
                y2: weighted[1],
                color: warm,
                strokeWidth: 5,
                arrow: true,
                arrowSize: 3,
            },
        ],
    })

    const zeroInset = SvgFrame({
        c,
        x: 24,
        y: 615,
        width: 852,
        height: 136,
        rx: 14,
        fill: 'transparent',
        stroke: zeroBorder,
        strokeWidth: 2,
    })
    const zeroInsetLayer = AxisPlot({
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
        children: [zeroInset],
    })

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        children: Board({
            c,
            width,
            height,
            background: 'transparent',
            children: [
                React.createElement(CanvasItem, {
                    x: 0,
                    y: 0,
                    width,
                    height,
                    children: zeroInsetLayer,
                }),
                React.createElement(CanvasItem, {
                    x: 30,
                    y: plotY,
                    width: plotSize,
                    height: plotSize,
                    children: plot,
                }),
                label(
                    c,
                    'One shared scale, then learned feature weights',
                    28,
                    16,
                    844,
                    44,
                    32,
                    c.textPrimary,
                    { weight: 800, align: 'center' },
                ),
                label(c, 'mean(x²) = (9 + 16) / 2 = 12.5', 40, 62, 820, 44, 32, c.textSecondary, {
                    align: 'center',
                    mono: true,
                }),
                label(c, 'r = 1 / √(12.5 + ε) ≈ 0.2828426', 40, 103, 820, 44, 32, purple, {
                    align: 'center',
                    mono: true,
                }),

                label(c, 'x', mapX(3) + 10, mapY(4) - 28, 55, 44, 32, blue, {
                    weight: 800,
                    mono: true,
                }),
                label(c, 'y', mapX(weighted[0]) + 10, mapY(weighted[1]) - 26, 55, 44, 32, green, {
                    weight: 800,
                    mono: true,
                }),
                label(c, 'r x', mapX(scaled[0]) + 10, mapY(scaled[1]) + 3, 75, 44, 32, purple, {
                    weight: 800,
                    mono: true,
                }),
                label(c, 'x₂', 6, plotY + 7, 54, 44, 32, c.textSecondary, {
                    weight: 750,
                    mono: true,
                }),
                label(c, 'x₁', plotX + plotSize - 70, 547, 56, 44, 32, c.textSecondary, {
                    weight: 750,
                    mono: true,
                    align: 'right',
                }),

                label(c, 'Vector path', 500, 154, 350, 44, 32, c.textSecondary, { weight: 750 }),
                label(c, 'x', 503, 200, 310, 44, 32, blue, { weight: 800, mono: true }),
                label(c, '[3, 4]', 503, 239, 330, 44, 32, c.textPrimary, {
                    weight: 700,
                    mono: true,
                }),
                React.createElement(CanvasItem, {
                    x: 615,
                    y: 282,
                    width: 40,
                    height: 22,
                    children: FlowArrow({ direction: 'down', length: 18, c, tone: 'purple' }),
                }),
                label(c, 'uniform scale × r', 503, 305, 330, 44, 32, purple, { weight: 700 }),
                label(c, 'r x', 503, 344, 310, 44, 32, purple, { weight: 800, mono: true }),
                label(c, '≈ [0.8485,1.1314]', 503, 384, 360, 44, 32, c.textPrimary, {
                    weight: 700,
                    mono: true,
                }),
                React.createElement(CanvasItem, {
                    x: 615,
                    y: 426,
                    width: 40,
                    height: 22,
                    children: FlowArrow({ direction: 'down', length: 18, c, tone: 'warm' }),
                }),
                label(c, 'feature weights × [1,2]', 503, 446, 365, 44, 32, warm, { weight: 700 }),
                label(c, 'y', 503, 490, 310, 44, 32, green, { weight: 800, mono: true }),
                label(c, '≈ [0.8485,2.2627]', 503, 529, 360, 44, 32, c.textPrimary, {
                    weight: 700,
                    mono: true,
                }),
                label(c, 'x₁ stays · x₂ doubles', 503, 569, 365, 44, 32, warm, { weight: 650 }),

                label(c, 'Separate zero row', 52, 619, 790, 44, 32, c.textSecondary, {
                    weight: 750,
                }),
                label(c, 'r₀ = 1 / √ε ≈ 316.23', 52, 657, 790, 44, 32, c.textPrimary, {
                    weight: 700,
                    mono: true,
                }),
                label(c, '[0,0] × r₀ × [1,2] = [0,0]', 52, 695, 790, 44, 32, c.textPrimary, {
                    weight: 700,
                    mono: true,
                }),
            ],
        }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return frame(theme)
}

export default create('dark')
