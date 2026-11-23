import React from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    FlowArrow,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 900
export const height = 735
export const alt =
    'For x=[0.001,-0.001], w=[1,1], and epsilon 1e-5, RMSNorm returns [+0.301511,-0.301511]. Scaling only x by 100 while keeping epsilon fixed gives [+0.999500,-0.999500]. Scaling epsilon by 100 squared to 0.1 restores [+0.301511,-0.301511]. In the vector plot, the base and coupled-scale outputs overlap; fixed epsilon extends the output along the same ray.'

type ThemeColors = ReturnType<typeof getThemeColors>
const scaleX = width / 1040

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

function frame(theme: ThemeMode) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c)
    const warm = getReadableToneColor('warm', c)
    const green = getReadableToneColor('green', c)
    const neutral = getReadableToneColor('neutral', c)
    const normalized = (x: number, epsilon: number) => x / Math.sqrt(x * x + epsilon)
    const baseEndpoint = normalized(0.001, 1e-5)
    const fixedEpsilonEndpoint = normalized(0.1, 1e-5)
    const plot = { x: 20 * scaleX, y: 202, size: 350 * scaleX, pad: 38 * scaleX }
    const chart = AxisPlot({
        c,
        width: plot.size,
        height: plot.size,
        xMin: -1.1,
        xMax: 1.1,
        yMin: -1.1,
        yMax: 1.1,
        padding: plot.pad,
        showFrame: true,
        showAxes: true,
        showGrid: true,
        gridCount: 4,
        frameFill: c.bgCard,
        frameStroke: neutral,
        axisColor: neutral,
        vectors: [
            {
                x1: 0,
                y1: 0,
                x2: fixedEpsilonEndpoint,
                y2: -fixedEpsilonEndpoint,
                color: warm,
                strokeWidth: 7,
                arrow: true,
                arrowSize: 3,
            },
            {
                x1: 0,
                y1: 0,
                x2: baseEndpoint,
                y2: -baseEndpoint,
                color: green,
                strokeWidth: 7,
                arrow: true,
                arrowSize: 3,
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
                <CanvasItem x={plot.x} y={plot.y} width={plot.size} height={plot.size}>
                    {chart}
                </CanvasItem>
                {label(
                    c,
                    'Epsilon controls scale invariance',
                    24,
                    14,
                    992,
                    52,
                    38,
                    c.textPrimary,
                    'center',
                    800,
                )}
                {label(
                    c,
                    'f(a x, w, a²ε) = f(x, w, ε),   a > 0',
                    38,
                    70,
                    964,
                    46,
                    34,
                    neutral,
                    'center',
                    700,
                    true,
                )}
                {label(c, 'same direction', 34, 157, 310, 42, 34, blue, 'center', 700)}

                {label(c, 'BASE', 400, 170, 600, 46, 34, green, 'left', 800)}
                {label(
                    c,
                    'x=[+1,−1]×10⁻³ · ε=10⁻⁵',
                    400,
                    210,
                    620,
                    46,
                    34,
                    neutral,
                    'left',
                    700,
                    true,
                )}
                {label(c, 'y₁ = +0.301511', 400, 252, 620, 46, 34, green, 'left', 750, true)}
                {label(c, 'y₂ = −0.301511', 400, 294, 620, 46, 34, green, 'left', 750, true)}

                <CanvasItem x={674 * scaleX} y={336} width={48 * scaleX} height={30}>
                    <FlowArrow c={c} direction="down" length={20} tone="warm" />
                </CanvasItem>
                {label(c, 'SCALE INPUT ONLY', 400, 358, 600, 46, 34, warm, 'left', 800)}
                {label(
                    c,
                    'x × 100 · ε stays 10⁻⁵',
                    400,
                    400,
                    620,
                    46,
                    34,
                    neutral,
                    'left',
                    700,
                    true,
                )}
                {label(c, 'y₁ = +0.999500', 400, 442, 620, 46, 34, warm, 'left', 750, true)}
                {label(c, 'y₂ = −0.999500', 400, 484, 620, 46, 34, warm, 'left', 750, true)}

                <CanvasItem x={674 * scaleX} y={526} width={48 * scaleX} height={30}>
                    <FlowArrow c={c} direction="down" length={20} tone="green" />
                </CanvasItem>
                {label(c, 'SCALE BOTH TERMS', 400, 548, 600, 46, 34, green, 'left', 800)}
                {label(
                    c,
                    'x × 100 · ε × 100² = 0.1',
                    400,
                    590,
                    620,
                    46,
                    34,
                    neutral,
                    'left',
                    700,
                    true,
                )}
                {label(c, 'y₁ = +0.301511', 400, 632, 620, 46, 34, green, 'left', 750, true)}
                {label(c, 'y₂ = −0.301511', 400, 674, 620, 46, 34, green, 'left', 750, true)}

                {label(c, 'base + coupled ε', 18, 574, 350, 46, 34, green, 'center', 700)}
                {label(c, 'fixed ε', 18, 610, 350, 46, 34, warm, 'center', 700)}
            </Board>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return frame(theme)
}
export default create('dark')
