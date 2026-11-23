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
export const height = 640
export const alt =
    'An automated kernel synthesis and verification search loop connects an LLM kernel generator to compiler PTXAS diagnostics, an isolated subprocess GPU worker running Compute Sanitizer and randomized assert_close equivalence checks, and L2-flushed CUDA event profiling with Nsight stall feedback. Illegal-memory-address faults respawn a clean worker process without halting the search. Search iterates on tuning shapes and metrics; only after search finishes does the top candidate face an untouched held-out suite of prime dimensions and strided views.'

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
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const red = getReadableToneColor('critical', c)
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
            SvgFrame({
                c,
                x: 16,
                y: 112,
                width: 598,
                height: 428,
                rx: 16,
                fill: 'transparent',
                stroke: blue,
                strokeWidth: 3,
            }),
            SvgFrame({
                c,
                x: 32,
                y: 170,
                width: 256,
                height: 112,
                rx: 12,
                fill: c.bgCard,
                stroke: purple,
                strokeWidth: 3,
            }),
            SvgFrame({
                c,
                x: 328,
                y: 170,
                width: 268,
                height: 112,
                rx: 12,
                fill: c.bgCard,
                stroke: warm,
                strokeWidth: 3,
            }),
            SvgFrame({
                c,
                x: 328,
                y: 362,
                width: 268,
                height: 150,
                rx: 12,
                fill: c.bgCard,
                stroke: blue,
                strokeWidth: 3,
            }),
            SvgFrame({
                c,
                x: 32,
                y: 362,
                width: 256,
                height: 150,
                rx: 12,
                fill: c.bgCard,
                stroke: red,
                strokeWidth: 3,
            }),
            SvgFrame({
                c,
                x: 646,
                y: 170,
                width: 234,
                height: 342,
                rx: 14,
                fill: c.bgCard,
                stroke: green,
                strokeWidth: 3,
            }),
            VectorArrow({
                x1: 288,
                y1: 226,
                x2: 328,
                y2: 226,
                color: purple,
                strokeWidth: 5,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 462,
                y1: 282,
                x2: 462,
                y2: 362,
                color: warm,
                strokeWidth: 5,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 328,
                y1: 437,
                x2: 288,
                y2: 437,
                color: blue,
                strokeWidth: 5,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 160,
                y1: 362,
                x2: 160,
                y2: 282,
                color: red,
                strokeWidth: 5,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 596,
                y1: 437,
                x2: 646,
                y2: 437,
                color: green,
                strokeWidth: 5,
                arrowSize: 4,
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
                    'Hardware-guided search isolates tuning and eval',
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
                    'Isolated worker processes survive CUDA faults',
                    20,
                    62,
                    860,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}
                {label(c, 'Tuning loop (K iterations)', 16, 122, 598, 36, 28, blue, 'center', 750)}

                {label(c, 'LLM Synthesizer', 36, 184, 248, 36, 28, purple, 'center', 800)}
                {label(c, 'CUDA / Triton', 36, 228, 248, 36, 28, c.textPrimary, 'center', 650)}

                {label(c, 'Compile / PTX', 332, 184, 260, 36, 28, warm, 'center', 800)}
                {label(c, 'PTX + memcheck', 332, 228, 260, 36, 28, c.textPrimary, 'center', 650)}

                {label(c, 'GPU Worker', 332, 376, 260, 36, 28, blue, 'center', 800)}
                {label(c, 'Equiv + L2 time', 332, 418, 260, 36, 28, c.textPrimary, 'center', 650)}
                {label(c, 'Respawn worker', 332, 460, 260, 36, 28, red, 'center', 700)}

                {label(c, 'Profiler Hints', 36, 376, 248, 36, 28, red, 'center', 800)}
                {label(c, 'Register spills &', 36, 418, 248, 36, 28, c.textPrimary, 'center', 650)}
                {label(c, 'Nsight stall cues', 36, 460, 248, 36, 28, c.textPrimary, 'center', 650)}

                {label(c, 'Held-Out Suite', 656, 188, 214, 38, 29, green, 'center', 800)}
                {label(c, 'Prime H widths', 656, 246, 214, 36, 28, c.textPrimary, 'center', 650)}
                {label(c, 'Strided views', 656, 294, 214, 36, 28, c.textPrimary, 'center', 650)}
                {label(c, 'FP16 extremes', 656, 342, 214, 36, 28, c.textPrimary, 'center', 650)}
                {label(c, 'Cold HBM test', 656, 390, 214, 36, 28, c.textPrimary, 'center', 650)}
                {label(c, 'Autotune cfg', 656, 446, 214, 38, 28, green, 'center', 750)}

                {label(
                    c,
                    'Freeze kernel and config before running held-out shapes.',
                    20,
                    566,
                    860,
                    40,
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
