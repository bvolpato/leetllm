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
export const height = 600
export const alt =
    'Four memory-allocation behaviors diverge under pressure: ordinary cudaMalloc targets the device pool and fails with cudaErrorMemoryAllocation when full; explicit offload executes chosen layers on CPU or copies tensors; CUDA managed memory migrates pages when platform capabilities support HMM or ATS; host pressure reads file-backed mmap pages from disk while swapping anonymous memory.'

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
    const purple = c.primary
    const warm = c.warning
    const red = c.critical

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
            // Row 1: cudaMalloc
            SvgFrame({
                c,
                x: 24,
                y: 106,
                width: 852,
                height: 100,
                rx: 10,
                fill: c.bgCard,
                stroke: red,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 244,
                y: 126,
                width: 176,
                height: 58,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: c.border,
                strokeWidth: 1.5,
            }),
            SvgFrame({
                c,
                x: 462,
                y: 126,
                width: 176,
                height: 58,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: blue,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 680,
                y: 126,
                width: 176,
                height: 58,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: red,
                strokeWidth: 2.5,
            }),
            VectorArrow({
                x1: 420,
                y1: 155,
                x2: 460,
                y2: 155,
                color: blue,
                strokeWidth: 3,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 638,
                y1: 155,
                x2: 678,
                y2: 155,
                color: red,
                strokeWidth: 3,
                arrowSize: 4,
            }),

            // Row 2: Explicit Offload
            SvgFrame({
                c,
                x: 24,
                y: 222,
                width: 852,
                height: 100,
                rx: 10,
                fill: c.bgCard,
                stroke: warm,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 244,
                y: 242,
                width: 204,
                height: 58,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: warm,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 540,
                y: 242,
                width: 316,
                height: 58,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: blue,
                strokeWidth: 2,
            }),
            VectorArrow({
                x1: 448,
                y1: 271,
                x2: 538,
                y2: 271,
                color: warm,
                strokeWidth: 3.5,
                arrowSize: 4,
            }),

            // Row 3: Managed
            SvgFrame({
                c,
                x: 24,
                y: 338,
                width: 852,
                height: 100,
                rx: 10,
                fill: c.bgCard,
                stroke: purple,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 244,
                y: 358,
                width: 204,
                height: 58,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: purple,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 540,
                y: 358,
                width: 316,
                height: 58,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: purple,
                strokeWidth: 2,
            }),
            VectorArrow({
                x1: 448,
                y1: 387,
                x2: 538,
                y2: 387,
                color: purple,
                strokeWidth: 3.5,
                arrowSize: 4,
            }),

            // Row 4: Host paging
            SvgFrame({
                c,
                x: 24,
                y: 454,
                width: 852,
                height: 116,
                rx: 10,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 244,
                y: 478,
                width: 280,
                height: 68,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: blue,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 560,
                y: 478,
                width: 296,
                height: 68,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: warm,
                strokeWidth: 2,
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
                    'Trace OOM to its physical allocation path',
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
                    'Logs, fault counters, and transfer traces separate routes',
                    20,
                    56,
                    860,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}

                {label(c, '1. CUDA', 42, 138, 186, 36, 28, red, 'left', 800)}
                {label(c, 'cudaMalloc', 250, 138, 164, 34, 28, c.textPrimary, 'center', 700)}
                {label(c, 'VRAM pool', 468, 138, 164, 34, 28, blue, 'center', 700)}
                {label(c, 'CUDA OOM', 686, 138, 164, 34, 28, red, 'center', 800)}

                {label(c, '2. Offload', 42, 254, 186, 36, 28, warm, 'left', 800)}
                {label(c, 'CPU layers', 250, 254, 192, 34, 28, warm, 'center', 700)}
                {label(c, 'PCIe', 454, 234, 80, 30, 28, warm, 'center', 650)}
                {label(c, 'GPU layers (explicit)', 546, 254, 304, 34, 28, blue, 'center', 700)}

                {label(c, '3. Managed', 42, 370, 186, 36, 28, purple, 'left', 800)}
                {label(c, 'Page table', 250, 370, 192, 34, 28, purple, 'center', 700)}
                {label(c, 'HMM / ATS migrate', 546, 370, 304, 34, 28, purple, 'center', 700)}

                {label(c, '4. Host OS', 42, 494, 186, 36, 28, c.textPrimary, 'left', 800)}
                {label(c, 'mmap -> disk read', 250, 494, 268, 34, 28, blue, 'center', 700)}
                {label(c, 'RAM -> swap IO', 566, 494, 284, 34, 28, warm, 'center', 700)}
            </Board>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return frame(theme)
}

export default create('dark')
