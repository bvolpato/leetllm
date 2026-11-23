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
export const height = 636
export const alt =
    'Two local memory architectures for serving a Q4_K_M GGUF model. On a discrete GPU, quantized weights and FP16 KV cache sit in separate 24 GB GDDR6X or HBM VRAM at 1,008 GB/s while offloaded blocks stay in host DRAM across a 25 GB/s PCIe bridge before dequantizing in GPU registers. On Apple Silicon unified memory, CPU and GPU share one high-bandwidth pool up to 614 GB/s or 1.2 TB/s alongside macOS without a PCIe transfer step.'

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
            // Left card: Discrete GPU
            SvgFrame({
                c,
                x: 24,
                y: 108,
                width: 416,
                height: 416,
                rx: 12,
                fill: c.bgCard,
                stroke: blue,
                strokeWidth: 2.5,
            }),
            SvgFrame({
                c,
                x: 46,
                y: 162,
                width: 372,
                height: 74,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: c.border,
                strokeWidth: 1.5,
            }),
            SvgFrame({
                c,
                x: 46,
                y: 282,
                width: 372,
                height: 112,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: blue,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 46,
                y: 432,
                width: 372,
                height: 72,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: green,
                strokeWidth: 2,
            }),
            VectorArrow({
                x1: 186,
                y1: 236,
                x2: 186,
                y2: 280,
                color: warm,
                strokeWidth: 3.5,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 232,
                y1: 394,
                x2: 232,
                y2: 430,
                color: green,
                strokeWidth: 3.5,
                arrowSize: 4,
            }),

            // Right card: Apple Silicon Unified Memory
            SvgFrame({
                c,
                x: 460,
                y: 108,
                width: 416,
                height: 416,
                rx: 12,
                fill: c.bgCard,
                stroke: purple,
                strokeWidth: 2.5,
            }),
            SvgFrame({
                c,
                x: 482,
                y: 162,
                width: 372,
                height: 232,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: purple,
                strokeWidth: 2,
            }),
            // Memory blocks inside unified pool
            SvgFrame({
                c,
                x: 500,
                y: 222,
                width: 84,
                height: 92,
                rx: 6,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 1.5,
            }),
            SvgFrame({
                c,
                x: 594,
                y: 222,
                width: 126,
                height: 92,
                rx: 6,
                fill: c.bgCard,
                stroke: blue,
                strokeWidth: 1.5,
            }),
            SvgFrame({
                c,
                x: 730,
                y: 222,
                width: 106,
                height: 92,
                rx: 6,
                fill: c.bgCard,
                stroke: warm,
                strokeWidth: 1.5,
            }),
            SvgFrame({
                c,
                x: 482,
                y: 432,
                width: 372,
                height: 72,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: green,
                strokeWidth: 2,
            }),
            VectorArrow({
                x1: 668,
                y1: 394,
                x2: 668,
                y2: 430,
                color: purple,
                strokeWidth: 3.5,
                arrowSize: 4,
            }),

            // Footer
            SvgFrame({
                c,
                x: 24,
                y: 544,
                width: 852,
                height: 60,
                rx: 10,
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
                    'GGUF Q4_K_M memory hierarchy',
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
                    'Bandwidth, dequantization, and KV capacity across hosts',
                    20,
                    56,
                    860,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}

                {/* Left: Discrete GPU */}
                {label(c, 'Discrete GPU (RTX 4090)', 36, 118, 392, 34, 28, blue, 'center', 800)}
                {label(
                    c,
                    'Host RAM: offloaded blk',
                    48,
                    180,
                    368,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}
                {label(c, 'PCIe ~25 GB/s', 202, 240, 214, 34, 28, warm, 'left', 700)}
                {label(c, 'VRAM 24 GB (1,008 GB/s)', 48, 294, 368, 34, 28, blue, 'center', 800)}
                {label(
                    c,
                    'Q4_K_M wts + FP16 KV',
                    48,
                    342,
                    368,
                    34,
                    28,
                    c.textPrimary,
                    'center',
                    650,
                )}
                {label(c, 'SMs: dequant + matmul', 48, 450, 368, 34, 28, green, 'center', 750)}

                {/* Right: Unified */}
                {label(c, 'Apple M5 Max / Ultra', 472, 118, 392, 34, 28, purple, 'center', 800)}
                {label(c, 'Unified (614-1200 GB/s)', 484, 174, 368, 34, 28, purple, 'center', 750)}
                {label(c, 'OS', 504, 250, 76, 34, 28, c.textSecondary, 'center', 700)}
                {label(c, 'Q4 Wts', 598, 250, 118, 34, 28, blue, 'center', 750)}
                {label(c, 'KV', 734, 250, 98, 34, 28, warm, 'center', 750)}
                {label(
                    c,
                    'Zero PCIe; shared pool',
                    484,
                    336,
                    368,
                    34,
                    28,
                    c.textPrimary,
                    'center',
                    650,
                )}
                {label(c, 'Metal GPU: direct dequant', 484, 450, 368, 34, 28, green, 'center', 750)}

                {/* Footer */}
                {label(
                    c,
                    'Fit weights, KV, and workspace in active RAM.',
                    36,
                    556,
                    828,
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
