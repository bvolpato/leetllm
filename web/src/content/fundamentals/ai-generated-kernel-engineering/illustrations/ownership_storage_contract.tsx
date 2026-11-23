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
export const height = 820
export const alt =
    'Caller-owned x=[3,4] and weight=[1,2] feed weighted RMSNorm. A separate output allocation [0.8485,2.2627] flows to the next operation while both inputs stay unchanged. In a mutation failure, x.add_(1) changes the caller storage to [4,5], which the next layer then sees. Returning the same empty [0,2] input also fails the object-identity check, even though there are no element bytes to compare; empty-storage alias coverage remains limited.'

type ThemeColors = ReturnType<typeof getThemeColors>

const label = (
    c: ThemeColors,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    size = 30,
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

const cell = (c: ThemeColors, x: number, y: number, w: number, h: number, stroke: string) =>
    SvgFrame({ c, x, y, width: w, height: h, rx: 10, fill: c.bgCard, stroke, strokeWidth: 3 })

function frame(theme: ThemeMode) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    const critical = getReadableToneColor('critical', c)
    const neutral = getReadableToneColor('neutral', c)
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
            cell(c, 48, 128, 100, 68, blue),
            cell(c, 158, 128, 100, 68, blue),
            cell(c, 48, 244, 100, 68, purple),
            cell(c, 158, 244, 100, 68, purple),
            cell(c, 346, 174, 190, 112, purple),
            cell(c, 610, 188, 130, 68, green),
            cell(c, 744, 188, 130, 68, green),
            VectorArrow({
                x1: 266,
                y1: 162,
                x2: 346,
                y2: 194,
                color: blue,
                strokeWidth: 6,
                arrowSize: 3,
            }),
            VectorArrow({
                x1: 266,
                y1: 278,
                x2: 346,
                y2: 252,
                color: purple,
                strokeWidth: 6,
                arrowSize: 3,
            }),
            VectorArrow({
                x1: 536,
                y1: 230,
                x2: 610,
                y2: 220,
                color: green,
                strokeWidth: 6,
                arrowSize: 3,
            }),

            cell(c, 68, 446, 84, 60, blue),
            cell(c, 164, 446, 84, 60, blue),
            cell(c, 280, 438, 185, 76, critical),
            cell(c, 494, 446, 84, 60, critical),
            cell(c, 590, 446, 84, 60, critical),
            VectorArrow({
                x1: 256,
                y1: 476,
                x2: 280,
                y2: 476,
                color: critical,
                strokeWidth: 5,
                arrowSize: 3,
            }),
            VectorArrow({
                x1: 465,
                y1: 476,
                x2: 494,
                y2: 476,
                color: critical,
                strokeWidth: 5,
                arrowSize: 3,
            }),
            VectorArrow({
                x1: 676,
                y1: 476,
                x2: 696,
                y2: 476,
                color: critical,
                strokeWidth: 5,
                arrowSize: 3,
            }),

            VectorArrow({
                x1: 278,
                y1: 664,
                x2: 342,
                y2: 664,
                color: critical,
                strokeWidth: 6,
                arrowSize: 3,
            }),
            VectorArrow({
                x1: 562,
                y1: 664,
                x2: 626,
                y2: 664,
                color: critical,
                strokeWidth: 6,
                arrowSize: 3,
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
                    'A correct call leaves caller storage intact',
                    24,
                    12,
                    852,
                    44,
                    32,
                    c.textPrimary,
                    'center',
                    800,
                )}
                {label(c, 'caller x', 48, 88, 210, 44, 32, blue, 'center', 750)}
                {label(c, '3', 48, 138, 100, 48, 32, blue, 'center', 750, true)}
                {label(c, '4', 158, 138, 100, 48, 32, blue, 'center', 750, true)}
                {label(c, 'weight w', 48, 204, 210, 44, 32, purple, 'center', 750)}
                {label(c, '1', 48, 254, 100, 48, 32, purple, 'center', 750, true)}
                {label(c, '2', 158, 254, 100, 48, 32, purple, 'center', 750, true)}
                {label(c, 'weighted', 356, 202, 170, 44, 32, purple, 'center', 750)}
                {label(c, 'RMSNorm', 352, 242, 178, 44, 32, purple, 'center', 750)}
                {label(c, 'new output y', 610, 144, 264, 44, 32, green, 'center', 750)}
                {label(c, '0.8485', 610, 196, 130, 48, 32, green, 'center', 750, true)}
                {label(c, '2.2627', 744, 196, 130, 48, 32, green, 'center', 750, true)}
                {label(c, 'next operation', 610, 266, 264, 44, 32, green, 'center', 700)}
                {label(
                    c,
                    'x stays [3,4]     w stays [1,2]',
                    110,
                    316,
                    680,
                    46,
                    32,
                    c.textSecondary,
                    'center',
                    700,
                    true,
                )}

                {label(
                    c,
                    'Mutation redirects the next operation',
                    24,
                    365,
                    852,
                    44,
                    32,
                    c.textPrimary,
                    'center',
                    800,
                )}
                {label(c, 'x before', 68, 411, 180, 42, 32, blue, 'center', 700)}
                {label(c, '3', 68, 452, 84, 46, 32, blue, 'center', 750, true)}
                {label(c, '4', 164, 452, 84, 46, 32, blue, 'center', 750, true)}
                {label(c, 'x.add_(1)', 280, 450, 185, 50, 32, critical, 'center', 750, true)}
                {label(c, '4', 494, 452, 84, 46, 32, critical, 'center', 750, true)}
                {label(c, '5', 590, 452, 84, 46, 32, critical, 'center', 750, true)}
                {label(c, 'next layer', 704, 452, 194, 50, 32, critical, 'center', 750)}
                {label(
                    c,
                    'Byte check catches the caller mutation.',
                    110,
                    516,
                    680,
                    44,
                    32,
                    c.textSecondary,
                    'center',
                    650,
                )}

                {label(
                    c,
                    'An empty return still aliases the caller',
                    24,
                    562,
                    852,
                    44,
                    32,
                    c.textPrimary,
                    'center',
                    800,
                )}
                {label(c, 'x:[0,2]', 28, 615, 250, 44, 32, blue, 'center', 700, true)}
                {label(c, 'same object', 342, 615, 220, 44, 32, critical, 'center', 750)}
                {label(c, 'output = x', 626, 615, 250, 42, 32, blue, 'center', 700, true)}
                {label(c, 'identity guard → FAIL', 200, 672, 500, 44, 32, critical, 'center', 750)}
                {label(
                    c,
                    'No element bytes; identity guard rejects alias.',
                    32,
                    744,
                    836,
                    48,
                    32,
                    neutral,
                    'center',
                    600,
                )}
            </Board>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return frame(theme)
}
export default create('dark')
