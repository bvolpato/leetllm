import React from 'react'
import { AxisPlot, Board, CanvasItem, Scene, SvgFrame, TextLabel, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 900
export const height = 560
export const alt =
    'Four memory layouts plotted on a 0 to 36 GB scale share a 7.6 GB weight proxy and 2.0 GB workspace. Eviction-capped cache gives totals of 12.02 GB for 16K at concurrency 4, 13.09 GB for 32K at concurrency 4, and 14.43 GB for 16K at concurrency 8, all below the 19.2 GB planning threshold. Disabling eviction reaches 32.15 GB and exceeds 24 GB VRAM.'

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
    const green = c.positive

    const x0 = 230
    const span = 530
    const gx = (gb: number) => x0 + (gb / 36) * span
    const gw = (gb: number) => (gb / 36) * span
    const by = (yTop: number) => height - yTop

    const rows = [
        { name: '16K x 4 (evict)', y: 146, kv: 2.416, total: 12.016, color: blue },
        { name: '32K x 4 (evict)', y: 222, kv: 3.49, total: 13.09, color: green },
        { name: '16K x 8 (evict)', y: 298, kv: 4.832, total: 14.432, color: warm },
        { name: '16K x 4 (full)', y: 374, kv: 22.549, total: 32.149, color: red },
    ]

    const barFrames = rows.flatMap((r) => {
        const wW = gw(7.6)
        const wS = gw(2.0)
        const wK = gw(r.kv)
        return [
            SvgFrame({
                c,
                x: x0,
                y: r.y,
                width: wW,
                height: 42,
                rx: 4,
                fill: blue,
                stroke: blue,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: x0 + wW + 2,
                y: r.y,
                width: wS,
                height: 42,
                rx: 4,
                fill: purple,
                stroke: purple,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: x0 + wW + wS + 4,
                y: r.y,
                width: wK,
                height: 42,
                rx: 4,
                fill: r.color,
                stroke: r.color,
                strokeWidth: 1,
            }),
        ]
    })

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
                x: 24,
                y: 112,
                width: 852,
                height: 386,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            ...barFrames,
        ],
    })

    const thresholdLines = AxisPlot({
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
            {
                points: [
                    { x: gx(19.2), y: by(134) },
                    { x: gx(19.2), y: by(434) },
                ],
                color: warm,
                strokeWidth: 3,
            },
            {
                points: [
                    { x: gx(24), y: by(134) },
                    { x: gx(24), y: by(434) },
                ],
                color: red,
                strokeWidth: 3,
            },
            {
                points: [
                    { x: x0, y: by(434) },
                    { x: x0 + span, y: by(434) },
                ],
                color: c.borderLight,
                strokeWidth: 2,
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
                <CanvasItem x={0} y={0} width={width} height={height}>
                    {geometry}
                </CanvasItem>
                <CanvasItem x={0} y={0} width={width} height={height}>
                    {thresholdLines}
                </CanvasItem>

                {label(
                    c,
                    'Weights, workspace, and KV share the same 24 GB pool',
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
                    'Blue = 7.6 GB wts | Purple = 2.0 GB work | End bar = KV cache',
                    20,
                    56,
                    860,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}

                {rows.map((r) => (
                    <React.Fragment key={r.name}>
                        {label(c, r.name, 38, r.y + 4, 184, 34, 28, r.color, 'left', 750)}
                        {label(
                            c,
                            `${r.total.toFixed(1)} GB`,
                            gx(r.total) + 12,
                            r.y + 4,
                            128,
                            34,
                            28,
                            c.textPrimary,
                            'left',
                            750,
                        )}
                    </React.Fragment>
                ))}

                {label(c, 'Plan 19.2 GB', gx(19.2) - 180, 444, 172, 34, 28, warm, 'right', 750)}
                {label(c, '24 GB GPU', gx(24) + 8, 444, 160, 34, 28, red, 'left', 750)}
                {label(c, '0 GB', x0 - 20, 512, 90, 34, 28, c.textSecondary, 'left', 600)}
                {label(c, '12 GB', gx(12) - 45, 512, 90, 34, 28, c.textSecondary, 'center', 600)}
                {label(c, '24 GB', gx(24) - 45, 512, 90, 34, 28, c.textSecondary, 'center', 600)}
                {label(c, '36 GB', gx(36) - 65, 512, 90, 34, 28, c.textSecondary, 'right', 600)}
            </Board>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return frame(theme)
}

export default create('dark')
