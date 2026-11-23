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
    'Common-scale three-stage pipeline calendars show one microbatch occupying 3 of 9 stage slots (33.3%), four occupying 12 of 18 (66.7%), and twelve reaching 85.7% utilization. Below, a single request crosses three 2 ms stages and two 0.2 ms transfers in 6.4 ms, a 1.07x ratio relative to 6.0 ms compute alone.'

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

    const cellCols = [blue, purple, green, warm]

    // Calendar helper
    const makeGrid = (gx0: number, gy0: number, m: number, cw: number, ch: number) => {
        const cols = m + 2
        const cells = []
        for (let s = 0; s < 3; s++) {
            for (let t = 0; t < cols; t++) {
                const idx = t - s
                const active = idx >= 0 && idx < m
                cells.push(
                    SvgFrame({
                        c,
                        x: gx0 + t * (cw + 4),
                        y: gy0 + s * (ch + 4),
                        width: cw,
                        height: ch,
                        rx: 4,
                        fill: active ? cellCols[idx % 4] : c.bgCardAlt,
                        stroke: active ? cellCols[idx % 4] : c.borderSubtle,
                        strokeWidth: 1,
                    }),
                )
            }
        }
        return cells
    }

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
            // Top cards: m=1 and m=4 diagonal calendars
            SvgFrame({
                c,
                x: 24,
                y: 108,
                width: 320,
                height: 224,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            ...makeGrid(86, 168, 1, 56, 36),

            SvgFrame({
                c,
                x: 364,
                y: 108,
                width: 512,
                height: 224,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            ...makeGrid(420, 168, 4, 58, 36),

            // Middle bar: m=12 comparison
            SvgFrame({
                c,
                x: 24,
                y: 348,
                width: 852,
                height: 86,
                rx: 12,
                fill: c.bgCard,
                stroke: green,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 310,
                y: 374,
                width: 390,
                height: 34,
                rx: 6,
                fill: green,
                stroke: green,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: 702,
                y: 374,
                width: 65,
                height: 34,
                rx: 6,
                fill: c.bgCardAlt,
                stroke: c.border,
                strokeWidth: 1,
            }),

            // Bottom timeline: Single-request latency (6.4 ms vs 6.0 ms)
            SvgFrame({
                c,
                x: 24,
                y: 452,
                width: 852,
                height: 126,
                rx: 12,
                fill: c.bgCard,
                stroke: blue,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 44,
                y: 510,
                width: 156,
                height: 42,
                rx: 6,
                fill: blue,
                stroke: blue,
                strokeWidth: 1,
            }),
            VectorArrow({
                x1: 204,
                y1: 531,
                x2: 244,
                y2: 531,
                color: warm,
                strokeWidth: 3.5,
                arrowSize: 4,
            }),
            SvgFrame({
                c,
                x: 248,
                y: 510,
                width: 156,
                height: 42,
                rx: 6,
                fill: purple,
                stroke: purple,
                strokeWidth: 1,
            }),
            VectorArrow({
                x1: 408,
                y1: 531,
                x2: 448,
                y2: 531,
                color: warm,
                strokeWidth: 3.5,
                arrowSize: 4,
            }),
            SvgFrame({
                c,
                x: 452,
                y: 510,
                width: 156,
                height: 42,
                rx: 6,
                fill: green,
                stroke: green,
                strokeWidth: 1,
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
                    'Pipeline bubble utilization and single-request latency',
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
                    '3 stages: more microbatches fill bubble slots',
                    20,
                    56,
                    860,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}

                {label(c, 'm=1: 3/9 (33.3%)', 36, 120, 296, 34, 28, warm, 'center', 800)}
                {['S0', 'S1', 'S2'].map((s, i) =>
                    label(c, s, 38, 170 + i * 40, 42, 34, 28, c.textSecondary, 'left', 650),
                )}

                {label(c, 'm=4: 12/18 slots (66.7%)', 378, 120, 484, 34, 28, blue, 'center', 800)}
                {['S0', 'S1', 'S2'].map((s, i) =>
                    label(c, s, 376, 170 + i * 40, 42, 34, 28, c.textSecondary, 'left', 650),
                )}
                {label(c, 'A', 420, 170, 58, 34, 28, c.bg, 'center', 800)}
                {label(c, 'B', 482, 170, 58, 34, 28, c.bg, 'center', 800)}
                {label(c, 'C', 544, 170, 58, 34, 28, c.bg, 'center', 800)}
                {label(c, 'D', 606, 170, 58, 34, 28, c.bg, 'center', 800)}

                {label(c, 'm=12: 36/42 slots', 42, 374, 256, 36, 28, green, 'left', 800)}
                {label(c, '85.7%', 780, 374, 84, 36, 28, green, 'left', 800)}

                {label(
                    c,
                    '3-stage latency: sum of compute + 2 hops',
                    42,
                    466,
                    816,
                    34,
                    28,
                    c.textPrimary,
                    'left',
                    800,
                )}
                {label(c, 'S0: 2 ms', 48, 514, 148, 34, 28, c.bg, 'center', 750)}
                {label(c, 'S1: 2 ms', 252, 514, 148, 34, 28, c.bg, 'center', 750)}
                {label(c, 'S2: 2 ms', 456, 514, 148, 34, 28, c.bg, 'center', 750)}
                {label(c, '6.4 ms (1.07x)', 626, 514, 238, 34, 28, warm, 'left', 800)}
            </Board>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return frame(theme)
}

export default create('dark')
