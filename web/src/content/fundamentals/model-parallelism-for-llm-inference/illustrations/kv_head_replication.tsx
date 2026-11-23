import React from 'react'
import { AxisPlot, Board, CanvasItem, Scene, SvgFrame, TextLabel, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 900
export const height = 560
export const alt =
    'For Qwen attention layers with 16 query heads and 2 key-value heads, TP=2 gives each rank 8 query heads and one unique KV head. TP=8 gives each rank 2 query heads while each KV head is replicated across four ranks, eliminating per-rank KV savings unless decode context sharding runs.'

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
    const red = c.critical

    // TP=8 rank boxes
    const tp8Boxes = Array.from({ length: 8 }, (_, r) => {
        const y = 176 + r * 38
        const kvCol = r < 4 ? blue : warm
        return [
            SvgFrame({
                c,
                x: 486,
                y,
                width: 170,
                height: 30,
                rx: 4,
                fill: c.bgCardAlt,
                stroke: green,
                strokeWidth: 1.5,
            }),
            SvgFrame({
                c,
                x: 668,
                y,
                width: 186,
                height: 30,
                rx: 4,
                fill: kvCol,
                stroke: kvCol,
                strokeWidth: 1,
            }),
        ]
    }).flat()

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
            // Left card: TP=2 clean split
            SvgFrame({
                c,
                x: 24,
                y: 112,
                width: 414,
                height: 382,
                rx: 12,
                fill: c.bgCard,
                stroke: green,
                strokeWidth: 2.5,
            }),
            SvgFrame({
                c,
                x: 46,
                y: 176,
                width: 370,
                height: 96,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: blue,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 46,
                y: 292,
                width: 370,
                height: 96,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: warm,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 46,
                y: 408,
                width: 370,
                height: 64,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: green,
                strokeWidth: 1.5,
            }),

            // Right card: TP=8 4x replication
            SvgFrame({
                c,
                x: 462,
                y: 112,
                width: 414,
                height: 382,
                rx: 12,
                fill: c.bgCard,
                stroke: red,
                strokeWidth: 2.5,
            }),
            ...tp8Boxes,
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
                    'When TP exceeds KV-head count (16 Q, 2 KV)',
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
                    'TP=2 partitions KV heads; TP=8 duplicates each KV head 4x',
                    20,
                    56,
                    860,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}

                {/* Left: TP=2 */}
                {label(c, 'TP=2: 1 KV head / rank', 42, 126, 378, 36, 28, green, 'center', 800)}
                {label(c, 'Rank 0: Q0..7 + KV0', 60, 206, 342, 36, 28, blue, 'center', 750)}
                {label(c, 'Rank 1: Q8..15 + KV1', 60, 322, 342, 36, 28, warm, 'center', 750)}
                {label(c, 'Physical KV copies: 1x', 58, 422, 346, 36, 28, green, 'center', 750)}

                {/* Right: TP=8 */}
                {label(c, 'TP=8: 4x replicated KV', 476, 126, 386, 36, 28, red, 'center', 800)}
                {Array.from({ length: 8 }, (_, r) => {
                    const y = 175 + r * 38
                    const kvName = r < 4 ? 'KV0 (dup)' : 'KV1 (dup)'
                    return (
                        <React.Fragment key={r}>
                            {label(
                                c,
                                `R${r}: Q${2 * r}..${2 * r + 1}`,
                                494,
                                y,
                                154,
                                32,
                                28,
                                c.textPrimary,
                                'center',
                                650,
                            )}
                            {label(c, kvName, 674, y, 174, 32, 28, c.bg, 'center', 750)}
                        </React.Fragment>
                    )
                })}
                {label(
                    c,
                    'Applies to full-attention layers; 30 gated layers differ.',
                    24,
                    510,
                    852,
                    34,
                    28,
                    c.textSecondary,
                    'center',
                    600,
                )}
            </Board>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return frame(theme)
}

export default create('dark')
