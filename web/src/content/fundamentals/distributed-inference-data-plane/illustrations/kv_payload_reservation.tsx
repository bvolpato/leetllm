import React from 'react'
import { AxisPlot, Board, CanvasItem, Scene, SvgFrame, TextLabel, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 900
export const height = 560
export const alt =
    'A common byte scale compares 2,560 MiB of real prompt KV with a 2,600 MiB reservation and a 2,605 MiB reservation after one extra prompt token. The 8,192 prompt positions form 512 blocks of 16 positions. Eight future output blocks add 40 MiB of allocated capacity. Magnified 16-position blocks show why 8,193 plus 128 output positions rounds from 520 to 521 blocks.'

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
    const green = c.positive
    const warm = c.warning

    const x0 = 260
    const maxW = 590
    const px = (mib: number) => (mib / 2605) * maxW

    const slots = Array.from({ length: 16 }, (_, idx) =>
        SvgFrame({
            c,
            x: 44 + idx * 51,
            y: 444,
            width: 45,
            height: 44,
            rx: 5,
            fill: idx === 0 ? blue : idx === 1 ? warm : c.bgCardAlt,
            stroke: idx === 0 ? blue : idx === 1 ? warm : c.borderSubtle,
            strokeWidth: 2,
        }),
    )

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
            // Top bar panel
            SvgFrame({
                c,
                x: 24,
                y: 106,
                width: 852,
                height: 224,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            // Row 1: 2560 MiB prompt payload
            SvgFrame({
                c,
                x: x0,
                y: 132,
                width: px(2560),
                height: 36,
                rx: 6,
                fill: blue,
                stroke: blue,
                strokeWidth: 1,
            }),
            // Row 2: 2560 + 40 MiB decode reservation
            SvgFrame({
                c,
                x: x0,
                y: 196,
                width: px(2560),
                height: 36,
                rx: 6,
                fill: blue,
                stroke: blue,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: x0 + px(2560),
                y: 196,
                width: px(40),
                height: 36,
                rx: 4,
                fill: green,
                stroke: green,
                strokeWidth: 1,
            }),
            // Row 3: 8193 + 128 -> 521 blocks = 2605 MiB
            SvgFrame({
                c,
                x: x0,
                y: 260,
                width: px(2560),
                height: 36,
                rx: 6,
                fill: blue,
                stroke: blue,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: x0 + px(2560),
                y: 260,
                width: px(45),
                height: 36,
                rx: 4,
                fill: warm,
                stroke: warm,
                strokeWidth: 1,
            }),

            // Bottom block panel
            SvgFrame({
                c,
                x: 24,
                y: 354,
                width: 852,
                height: 176,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            ...slots,
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
                    'Prompt KV payload versus reserved block capacity',
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
                    '320 KiB/token · 16 positions/block = 5 MiB per block',
                    20,
                    56,
                    860,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}

                {label(c, '8,192 prompt', 40, 134, 210, 34, 28, blue, 'left', 750)}
                {label(
                    c,
                    '2,560 MiB (512 blks)',
                    270,
                    134,
                    420,
                    34,
                    28,
                    c.textPrimary,
                    'left',
                    750,
                )}

                {label(c, '+128 decode', 40, 198, 210, 34, 28, green, 'left', 750)}
                {label(
                    c,
                    '2,600 MiB (520 blks)',
                    270,
                    198,
                    420,
                    34,
                    28,
                    c.textPrimary,
                    'left',
                    750,
                )}

                {label(c, '8,193 + 128', 40, 262, 210, 34, 28, warm, 'left', 750)}
                {label(
                    c,
                    '2,605 MiB (521 blks)',
                    270,
                    262,
                    420,
                    34,
                    28,
                    c.textPrimary,
                    'left',
                    750,
                )}

                {label(
                    c,
                    'Block 520 zoomed (5 MiB rounded for +1 token):',
                    44,
                    370,
                    812,
                    36,
                    28,
                    c.textPrimary,
                    'left',
                    750,
                )}
                {label(
                    c,
                    'P = token 8192, O = 1 output, 14 tail slots',
                    44,
                    404,
                    812,
                    34,
                    28,
                    warm,
                    'left',
                    650,
                )}
                {label(c, 'P', 44, 450, 45, 34, 28, c.textPrimary, 'center', 800)}
                {label(c, 'O', 95, 450, 45, 34, 28, c.textPrimary, 'center', 800)}
            </Board>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return frame(theme)
}

export default create('dark')
