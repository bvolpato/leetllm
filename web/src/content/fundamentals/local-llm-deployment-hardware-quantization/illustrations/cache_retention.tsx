import React from 'react'
import { AxisPlot, Board, CanvasItem, Scene, SvgFrame, TextLabel, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 900
export const height = 580
export const alt =
    'For four 16,384-token sequences on Gemma 4 12B, 40 sliding-window layers retain only the latest 1,024 positions (1.342 GB) when evicting older blocks, while 8 full layers keep all 16,384 positions (1.074 GB), totaling 2.416 GB. Storing full-length sliding buffers raises KV payload nearly tenfold to 22.549 GB while leaving the attention mask unchanged.'

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
    const red = c.critical

    const tiles = Array.from({ length: 16 }, (_, i) => i)
    const tx0 = 196
    const tw = 34
    const tgap = 6
    const barW = (gb: number) => (gb / 25) * 440

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
            // Top card: 16K tile retention map
            SvgFrame({
                c,
                x: 24,
                y: 106,
                width: 852,
                height: 214,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            ...tiles.map((i) =>
                SvgFrame({
                    c,
                    x: tx0 + i * (tw + tgap),
                    y: 166,
                    width: tw,
                    height: 36,
                    rx: 5,
                    fill: i === 15 ? warm : c.bgCardAlt,
                    stroke: i === 15 ? warm : c.borderSubtle,
                    strokeWidth: i === 15 ? 2 : 1.5,
                }),
            ),
            ...tiles.map((i) =>
                SvgFrame({
                    c,
                    x: tx0 + i * (tw + tgap),
                    y: 236,
                    width: tw,
                    height: 36,
                    rx: 5,
                    fill: blue,
                    stroke: blue,
                    strokeWidth: 1.5,
                }),
            ),

            // Bottom card: Raw KV GB scale comparison
            SvgFrame({
                c,
                x: 24,
                y: 342,
                width: 852,
                height: 214,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            // Capped 2.416 GB stacked
            SvgFrame({
                c,
                x: 230,
                y: 400,
                width: barW(1.342),
                height: 38,
                rx: 4,
                fill: warm,
                stroke: warm,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: 230 + barW(1.342) + 2,
                y: 400,
                width: barW(1.074),
                height: 38,
                rx: 4,
                fill: blue,
                stroke: blue,
                strokeWidth: 1,
            }),
            // Full sliding 22.549 GB
            SvgFrame({
                c,
                x: 230,
                y: 462,
                width: barW(21.475),
                height: 38,
                rx: 4,
                fill: red,
                stroke: red,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: 230 + barW(21.475) + 2,
                y: 462,
                width: barW(1.074),
                height: 38,
                rx: 4,
                fill: blue,
                stroke: blue,
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
                    'Sliding window eviction vs. full-length KV buffers',
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
                    'Gemma 4 12B: 4 x 16,384 tokens (each tile = 1,024 positions)',
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
                    'Retained K/V blocks per layer group (window = 1K)',
                    42,
                    118,
                    816,
                    34,
                    28,
                    c.textPrimary,
                    'left',
                    800,
                )}
                {label(c, '40 Sliding', 42, 166, 140, 36, 28, warm, 'left', 750)}
                {label(c, '8 Full', 42, 236, 140, 36, 28, blue, 'left', 750)}
                {label(
                    c,
                    '0K..15K evicted -> only tail 1K kept | Full retains 0K..16K',
                    42,
                    282,
                    816,
                    30,
                    28,
                    c.textSecondary,
                    'left',
                    600,
                )}

                {label(
                    c,
                    'Total raw KV payload (4 concurrent 16K streams)',
                    42,
                    354,
                    816,
                    34,
                    28,
                    c.textPrimary,
                    'left',
                    800,
                )}
                {label(c, 'Evict 1K cap', 42, 402, 176, 34, 28, warm, 'left', 750)}
                {label(c, '2.416 GB', 284, 402, 240, 34, 28, c.textPrimary, 'left', 800)}
                {label(c, 'Full buffers', 42, 464, 176, 34, 28, red, 'left', 750)}
                {label(c, '22.549 GB (9.3x)', 642, 464, 224, 34, 28, red, 'left', 800)}
            </Board>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return frame(theme)
}

export default create('dark')
