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
export const height = 710
export const alt =
    'CUDA stream event timing paired with Nsight Compute roofline and warp stall diagnostics. On top, Host API enqueues the kernel asynchronously in 4 us and blocks on cudaEventSynchronize at 92 us, while GPU Stream 0 executes the kernel from 12 to 92 us inside an 85 us event span and A-B-B-A matched rounds give a 1.24x median speedup at locked 1980 MHz SM clock. On the bottom left, the Nsight roofline places triad_f32 at 0.167 FLOP per byte on the 3.35 TB/s HBM bandwidth slope at 87% SOL. On the bottom right, achieved occupancy is 78% with 64% long-scoreboard HBM wait stalls and 4% barrier stalls.'

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
    const green = c.positive
    const warm = c.warning
    const neutral = c.textSecondary

    // Roofline plot area (bottom-left box x: 24..444, y: 348..656)
    const rx = (lx: number) => 76 + ((lx + 1) / 3) * 332
    const ryTop = (ly: number) => 586 - ((ly + 0.65) / 2.65) * 164
    const by = (yTop: number) => height - yTop

    const triadLx = Math.log10(0.167)
    const triadLy = Math.log10(0.486)

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
            // Top panel: CUDA stream events & A-B-B-A pairing
            SvgFrame({
                c,
                x: 24,
                y: 104,
                width: 852,
                height: 228,
                rx: 14,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            // Host blocks (y = 158..198)
            SvgFrame({
                c,
                x: 192,
                y: 158,
                width: 204,
                height: 40,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: warm,
                strokeWidth: 2.5,
            }),
            SvgFrame({
                c,
                x: 660,
                y: 158,
                width: 194,
                height: 40,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: purple,
                strokeWidth: 2.5,
            }),
            // Stream 0 blocks (y = 218..258)
            SvgFrame({
                c,
                x: 248,
                y: 218,
                width: 92,
                height: 40,
                rx: 8,
                fill: 'transparent',
                stroke: c.borderLight,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 344,
                y: 218,
                width: 316,
                height: 40,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: blue,
                strokeWidth: 3,
            }),
            // Host async line + event markers
            VectorArrow({
                x1: 396,
                y1: 178,
                x2: 658,
                y2: 178,
                color: neutral,
                strokeWidth: 2.5,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 248,
                y1: 198,
                x2: 248,
                y2: 218,
                color: warm,
                strokeWidth: 3,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 660,
                y1: 218,
                x2: 660,
                y2: 198,
                color: purple,
                strokeWidth: 3,
                arrowSize: 4,
            }),

            // Bottom-left panel: Nsight Roofline
            SvgFrame({
                c,
                x: 24,
                y: 348,
                width: 420,
                height: 326,
                rx: 14,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            // Bottom-right panel: Occupancy & Warp Stalls
            SvgFrame({
                c,
                x: 460,
                y: 348,
                width: 416,
                height: 326,
                rx: 14,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),

            // Horizontal stall bars (track + fill) inside bottom-right panel
            SvgFrame({
                c,
                x: 484,
                y: 446,
                width: 368,
                height: 22,
                rx: 6,
                fill: c.bgCardAlt,
                stroke: c.borderSubtle,
                strokeWidth: 1.5,
            }),
            SvgFrame({
                c,
                x: 484,
                y: 446,
                width: 287,
                height: 22,
                rx: 6,
                fill: green,
                stroke: green,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: 484,
                y: 520,
                width: 368,
                height: 22,
                rx: 6,
                fill: c.bgCardAlt,
                stroke: c.borderSubtle,
                strokeWidth: 1.5,
            }),
            SvgFrame({
                c,
                x: 484,
                y: 520,
                width: 236,
                height: 22,
                rx: 6,
                fill: warm,
                stroke: warm,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: 484,
                y: 594,
                width: 368,
                height: 22,
                rx: 6,
                fill: c.bgCardAlt,
                stroke: c.borderSubtle,
                strokeWidth: 1.5,
            }),
            SvgFrame({
                c,
                x: 484,
                y: 594,
                width: 24,
                height: 22,
                rx: 6,
                fill: purple,
                stroke: purple,
                strokeWidth: 1,
            }),
        ],
    })

    const rooflineOverlay = AxisPlot({
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
            // Mini roofline axes
            {
                points: [
                    { x: rx(-1), y: by(414) },
                    { x: rx(-1), y: by(586) },
                    { x: rx(2), y: by(586) },
                ],
                color: c.borderLight,
                strokeWidth: 2.5,
            },
            // HBM slope 3.35 TB/s + 67 TF FP32 roof
            {
                points: [
                    { x: rx(-1), y: by(ryTop(-0.47)) },
                    { x: rx(1.3), y: by(ryTop(1.83)) },
                    { x: rx(2.0), y: by(ryTop(1.83)) },
                ],
                color: purple,
                strokeWidth: 4,
            },
        ],
        points: [{ x: rx(triadLx), y: by(ryTop(triadLy)), fill: green, r: 9 }],
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
                <CanvasItem x={0} y={0} width={width} height={height}>
                    {rooflineOverlay}
                </CanvasItem>

                {label(
                    c,
                    'CUDA stream timing and Nsight diagnostics',
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
                    'Pair completed GPU events with counter roofs and warp stalls',
                    20,
                    58,
                    860,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}

                {/* Panel 1 */}
                {label(
                    c,
                    '1. CUDA events (SM 1980 MHz locked)',
                    42,
                    114,
                    816,
                    36,
                    28,
                    blue,
                    'left',
                    750,
                )}
                {label(c, 'Host API', 42, 162, 142, 36, 28, warm, 'left', 750)}
                {label(c, 'Enqueue 4 us', 194, 162, 200, 36, 28, warm, 'center', 700)}
                {label(c, 'Host async', 404, 142, 248, 36, 28, neutral, 'center', 600)}
                {label(c, 'Sync 92 us', 662, 162, 190, 36, 28, purple, 'center', 750)}

                {label(c, 'Stream 0', 42, 222, 142, 36, 28, blue, 'left', 750)}
                {label(c, '5 us', 248, 222, 92, 36, 28, neutral, 'center', 650)}
                {label(c, 'triad_f32: 80 us', 346, 222, 312, 36, 28, blue, 'center', 750)}

                {label(c, 'A-B-B-A', 42, 282, 142, 36, 28, green, 'left', 750)}
                {label(c, 'Event span = 85 us', 192, 282, 276, 36, 28, blue, 'left', 700)}
                {label(c, 'Medians: 102/82 = 1.24x', 474, 282, 382, 36, 28, green, 'right', 750)}

                {/* Panel 2 */}
                {label(c, '2. Nsight Roofline (HBM)', 40, 358, 392, 36, 28, purple, 'left', 750)}
                {label(c, '67 TF FP32', 242, 390, 188, 36, 28, purple, 'center', 750)}
                {label(c, '3.35 TB/s', 90, 446, 160, 36, 28, purple, 'center', 700)}
                {label(c, 'triad', 114, 544, 100, 36, 28, green, 'left', 750)}
                {label(c, '0.1', 56, 588, 60, 32, 28, c.textSecondary, 'center', 650)}
                {label(c, '1', 166, 588, 50, 32, 28, c.textSecondary, 'center', 650)}
                {label(c, '10', 274, 588, 60, 32, 28, c.textSecondary, 'center', 650)}
                {label(c, '100', 376, 588, 66, 32, 28, c.textSecondary, 'center', 650)}
                {label(c, '0.167 FLOP/B -> 87% SOL', 40, 624, 392, 36, 28, green, 'left', 750)}

                {/* Panel 3 */}
                {label(c, '3. Occupancy & Stalls', 484, 358, 376, 36, 28, warm, 'left', 750)}
                {label(c, 'Occupancy: 78%', 484, 408, 368, 34, 28, green, 'left', 750)}
                {label(c, 'HBM wait stall: 64%', 484, 482, 368, 34, 28, warm, 'left', 750)}
                {label(c, 'Barrier stall: 4%', 484, 556, 368, 34, 28, purple, 'left', 750)}
                {label(
                    c,
                    '32 regs/thr -> HBM bound',
                    484,
                    624,
                    376,
                    36,
                    28,
                    c.textSecondary,
                    'left',
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
