import React from 'react'
import { AxisPlot, Board, CanvasItem, Scene, SvgFrame, TextLabel, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 900
export const height = 560
export const alt =
    'Two TP=2 ranks each hold 29 GB free after 35 GB weights and 16 GB reserve on an 80 GB budget. A 50 GB request placing 35 GB on rank 0 and 15 GB on rank 1 fits the 58 GB group sum yet overflows rank 0 by 6 GB while leaving 14 GB unused on rank 1.'

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
    const purple = c.primary
    const neutral = c.neutral
    const blue = c.info
    const green = c.positive
    const red = c.critical

    const x0 = 200
    const span = 610
    const gx = (gb: number) => x0 + (gb / 90) * span
    const gw = (gb: number) => (gb / 90) * span
    const by = (yTop: number) => height - yTop

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
                y: 108,
                width: 852,
                height: 322,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),

            // Rank 0: 35 wts + 16 rsv + 29 fit + 6 OOM
            SvgFrame({
                c,
                x: x0,
                y: 174,
                width: gw(35),
                height: 48,
                rx: 4,
                fill: purple,
                stroke: purple,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: x0 + gw(35) + 2,
                y: 174,
                width: gw(16) - 2,
                height: 48,
                rx: 4,
                fill: neutral,
                stroke: neutral,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: x0 + gw(51) + 2,
                y: 174,
                width: gw(29) - 2,
                height: 48,
                rx: 4,
                fill: blue,
                stroke: blue,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: gx(80) + 2,
                y: 174,
                width: gw(6),
                height: 48,
                rx: 4,
                fill: red,
                stroke: red,
                strokeWidth: 1,
            }),

            // Rank 1: 35 wts + 16 rsv + 15 used + 14 spare
            SvgFrame({
                c,
                x: x0,
                y: 274,
                width: gw(35),
                height: 48,
                rx: 4,
                fill: purple,
                stroke: purple,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: x0 + gw(35) + 2,
                y: 274,
                width: gw(16) - 2,
                height: 48,
                rx: 4,
                fill: neutral,
                stroke: neutral,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: x0 + gw(51) + 2,
                y: 274,
                width: gw(15) - 2,
                height: 48,
                rx: 4,
                fill: blue,
                stroke: blue,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: x0 + gw(66) + 2,
                y: 274,
                width: gw(14) - 2,
                height: 48,
                rx: 4,
                fill: green,
                stroke: green,
                strokeWidth: 1,
            }),

            // Footer summary
            SvgFrame({
                c,
                x: 24,
                y: 450,
                width: 852,
                height: 86,
                rx: 12,
                fill: c.bgCardAlt,
                stroke: red,
                strokeWidth: 2,
            }),
        ],
    })

    const limitLines = AxisPlot({
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
                    { x: gx(80), y: by(148) },
                    { x: gx(80), y: by(356) },
                ],
                color: red,
                strokeWidth: 3,
            },
            {
                points: [
                    { x: x0, y: by(356) },
                    { x: x0 + span, y: by(356) },
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
                    {limitLines}
                </CanvasItem>

                {label(
                    c,
                    'Per-rank fit matters more than group free sum (TP=2)',
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
                    'Purple 35w | Gray 16r | Blue req | Green free',
                    20,
                    56,
                    860,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}

                {label(c, '80 GB cap', gx(80) - 210, 126, 200, 34, 28, red, 'right', 800)}
                {label(c, 'R0 (+35)', 38, 182, 166, 34, 28, red, 'left', 750)}
                {label(c, '35 req (+6 OOM)', gx(51) + 6, 182, 236, 34, 28, c.bg, 'left', 750)}

                {label(c, 'R1 (+15)', 38, 282, 166, 34, 28, green, 'left', 750)}
                {label(c, '15', gx(54), 282, 60, 34, 28, c.bg, 'left', 750)}
                {label(c, '14', gx(67) + 8, 282, 66, 34, 28, c.bg, 'left', 750)}

                {[0, 20, 40, 60, 80].map((t) =>
                    label(
                        c,
                        `${t} GB`,
                        gx(t) - 48,
                        374,
                        96,
                        34,
                        28,
                        t === 80 ? red : c.textSecondary,
                        'center',
                        650,
                    ),
                )}

                {label(
                    c,
                    'Group free = 58 GB (>50), yet R0 OOMs (86 > 80).',
                    38,
                    476,
                    824,
                    36,
                    28,
                    red,
                    'center',
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
