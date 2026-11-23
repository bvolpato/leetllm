import React from 'react'
import { AxisPlot, Board, CanvasItem, Scene, SvgFrame, TextLabel, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 900
export const height = 580
export const alt =
    'With TP=8, 2 KV heads, DCP=4, and 32 history tokens, each replicated KV head group splits tokens by index modulo four across ranks. Each rank holds 8 positions instead of 32, cutting total physical KV pairs stored from 256 to 64.'

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
    const green = c.positive
    const red = c.critical
    const laneCols = [blue, purple, green, warm]

    // Show 16 tokens in top grid across 4 DCP lanes of KV head 0
    const tokenCells = []
    for (let r = 0; r < 4; r++) {
        for (let t = 0; t < 16; t++) {
            const owned = t % 4 === r
            tokenCells.push(
                SvgFrame({
                    c,
                    x: 242 + t * 38,
                    y: 162 + r * 44,
                    width: 32,
                    height: 32,
                    rx: 4,
                    fill: owned ? laneCols[r] : c.bgCardAlt,
                    stroke: owned ? laneCols[r] : c.borderSubtle,
                    strokeWidth: 1,
                }),
            )
        }
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
            // Stride matrix card
            SvgFrame({
                c,
                x: 24,
                y: 108,
                width: 852,
                height: 252,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            ...tokenCells,

            // Total stored footprint bar comparison (256 -> 64)
            SvgFrame({
                c,
                x: 24,
                y: 378,
                width: 852,
                height: 176,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 242,
                y: 432,
                width: 410,
                height: 38,
                rx: 6,
                fill: red,
                stroke: red,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: 242,
                y: 492,
                width: 102,
                height: 38,
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
                    'Decode CP (DCP=4) shards replicated KV',
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
                    'TP=8, 2 KV heads, 32 tok: pos mod 4 == lane',
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
                    'KV0 stride pattern (first 16 of 32 positions)',
                    42,
                    120,
                    816,
                    34,
                    28,
                    c.textPrimary,
                    'left',
                    750,
                )}
                {[0, 1, 2, 3].map((r) =>
                    label(
                        c,
                        `Lane ${r} (R${r})`,
                        42,
                        162 + r * 44,
                        186,
                        34,
                        28,
                        laneCols[r],
                        'left',
                        750,
                    ),
                )}

                {label(
                    c,
                    'Total physical KV head-position pairs across all 8 ranks',
                    42,
                    390,
                    816,
                    34,
                    28,
                    c.textPrimary,
                    'left',
                    800,
                )}
                {label(c, 'Plain TP=8', 42, 434, 186, 34, 28, red, 'left', 750)}
                {label(c, '256 (32/rk)', 666, 434, 200, 34, 28, red, 'left', 750)}
                {label(c, 'TP=8+DCP', 42, 494, 186, 34, 28, green, 'left', 750)}
                {label(c, '64 pairs (8/rk, 4x cut)', 360, 494, 490, 34, 28, green, 'left', 800)}
            </Board>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return frame(theme)
}

export default create('dark')
