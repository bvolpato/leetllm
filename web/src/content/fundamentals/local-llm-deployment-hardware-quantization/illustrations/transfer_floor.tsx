import React from 'react'
import { AxisPlot, Board, CanvasItem, Scene, SvgFrame, TextLabel, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 900
export const height = 576
export const alt =
    'Logarithmic stream-time plot for a 7.6 GB weight read: 7.54 ms at 1,008 GB/s device peak, 85.56 ms when 2 GB crosses a 25 GB/s host link (11.35x slower), 304 ms if all 7.6 GB streams across 25 GB/s host memory, and 1,520 ms from 5 GB/s storage.'

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
    const red = c.critical

    const x0 = 276
    const span = 380
    const logMax = Math.log10(2000)
    const bx = (ms: number) => x0 + (Math.log10(ms) / logMax) * span
    const by = (yTop: number) => height - yTop

    const rows = [
        { name: 'Device (1,008 GB/s)', ms: 7.54, txt: '7.54 ms', y: 152, color: blue },
        { name: 'Mixed (5.6+2 GB)', ms: 85.56, txt: '85.6 ms (11.35x)', y: 232, color: warm },
        { name: 'Host (25 GB/s)', ms: 304.0, txt: '304 ms', y: 312, color: green },
        { name: 'NVMe (5 GB/s)', ms: 1520.0, txt: '1,520 ms', y: 392, color: red },
    ]

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
                height: 376,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            ...rows.map((r) =>
                SvgFrame({
                    c,
                    x: x0,
                    y: r.y,
                    width: Math.max(8, bx(r.ms) - x0),
                    height: 36,
                    rx: 6,
                    fill: r.color,
                    stroke: r.color,
                    strokeWidth: 1,
                }),
            ),
            SvgFrame({
                c,
                x: 24,
                y: 500,
                width: 852,
                height: 44,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: c.border,
                strokeWidth: 1.5,
            }),
        ],
    })

    const axisOverlay = AxisPlot({
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
                    { x: x0, y: by(440) },
                    { x: x0 + span + 18, y: by(440) },
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
                    {axisOverlay}
                </CanvasItem>

                {label(
                    c,
                    'Serial 7.6 GB read floor across memory paths',
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
                    'Log-scaled ms (2 GB over 25 GB/s PCIe adds 80 ms per step)',
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
                        {label(c, r.name, 34, r.y + 2, 236, 34, 28, r.color, 'left', 750)}
                        {label(
                            c,
                            r.txt,
                            bx(r.ms) + 12,
                            r.y + 2,
                            210,
                            34,
                            28,
                            c.textPrimary,
                            'left',
                            750,
                        )}
                    </React.Fragment>
                ))}

                {[1, 10, 100, 1000].map((tick) =>
                    label(
                        c,
                        String(tick),
                        bx(tick) - 44,
                        448,
                        88,
                        34,
                        28,
                        c.textSecondary,
                        'center',
                        600,
                    ),
                )}
                {label(
                    c,
                    'Serial weight stream only; excludes compute and overlap.',
                    32,
                    504,
                    836,
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
