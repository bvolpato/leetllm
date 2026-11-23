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
export const height = 560
export const alt =
    'A 1,000-token prompt splits into 600 cached prefix tokens and 400 uncached tokens evaluated in 0.2 s. Using only the 400 uncached tokens gives 2,000 tok/s, whereas dividing all 1,000 tokens overstates throughput at 5,000 tok/s. Output generation computes separately at 80 tokens in 2 s (40 tok/s) alongside client TTFT and inter-token timestamps.'

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
    const warm = c.warning
    const green = c.positive
    const purple = c.primary
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
            // Prompt breakdown strip (y: 108..236)
            SvgFrame({
                c,
                x: 24,
                y: 108,
                width: 852,
                height: 128,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 46,
                y: 162,
                width: 486,
                height: 48,
                rx: 6,
                fill: blue,
                stroke: blue,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: 536,
                y: 162,
                width: 320,
                height: 48,
                rx: 6,
                fill: warm,
                stroke: warm,
                strokeWidth: 1,
            }),

            // Row 2: Correct uncached rate vs Wrong total rate
            SvgFrame({
                c,
                x: 24,
                y: 256,
                width: 472,
                height: 136,
                rx: 12,
                fill: c.bgCard,
                stroke: blue,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 514,
                y: 256,
                width: 362,
                height: 136,
                rx: 12,
                fill: c.bgCard,
                stroke: red,
                strokeWidth: 2,
            }),
            VectorArrow({
                x1: 696,
                y1: 212,
                x2: 390,
                y2: 254,
                color: warm,
                strokeWidth: 3,
                arrowSize: 4,
            }),

            // Row 3: Output clock vs Client stream
            SvgFrame({
                c,
                x: 24,
                y: 412,
                width: 416,
                height: 128,
                rx: 12,
                fill: c.bgCard,
                stroke: green,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 460,
                y: 412,
                width: 416,
                height: 128,
                rx: 12,
                fill: c.bgCard,
                stroke: purple,
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
                    'Separate cached tokens, prefill, and decode clocks',
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
                    'Prefix cache reuse shrinks uncached prompt duration',
                    20,
                    56,
                    860,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}

                {label(
                    c,
                    'Prompt: 1,000 tokens = 600 KV-cached + 400 uncached',
                    46,
                    120,
                    810,
                    34,
                    28,
                    c.textPrimary,
                    'left',
                    750,
                )}
                {label(
                    c,
                    '600 cached (reused)',
                    54,
                    168,
                    470,
                    34,
                    28,
                    c.textPrimary,
                    'center',
                    750,
                )}
                {label(
                    c,
                    '400 evaluated (0.2s)',
                    540,
                    168,
                    312,
                    34,
                    28,
                    c.textPrimary,
                    'center',
                    750,
                )}

                {label(c, 'Uncached prefill rate (valid)', 44, 272, 434, 34, 28, blue, 'left', 800)}
                {label(
                    c,
                    '400 tok / 0.2 s = 2,000 tok/s',
                    44,
                    326,
                    434,
                    36,
                    28,
                    c.textPrimary,
                    'left',
                    750,
                )}

                {label(c, 'Overcounted (wrong)', 534, 272, 326, 34, 28, red, 'left', 800)}
                {label(c, '1,000 / 0.2 s = 5,000', 534, 326, 326, 36, 28, red, 'left', 750)}

                {label(c, 'Server decode clock', 44, 428, 376, 34, 28, green, 'left', 800)}
                {label(
                    c,
                    '80 tok / 2.0 s = 40 tok/s',
                    44,
                    478,
                    376,
                    34,
                    28,
                    c.textPrimary,
                    'left',
                    750,
                )}

                {label(c, 'Client streaming trace', 480, 428, 376, 34, 28, purple, 'left', 800)}
                {label(
                    c,
                    'Measure TTFT + ITL gaps',
                    480,
                    478,
                    376,
                    34,
                    28,
                    c.textPrimary,
                    'left',
                    750,
                )}
            </Board>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return frame(theme)
}

export default create('dark')
