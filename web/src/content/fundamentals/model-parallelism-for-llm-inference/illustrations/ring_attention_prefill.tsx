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
export const height = 580
export const alt =
    'In four-way Ring Attention prefill, each GPU holds its local query shard while KV shards circulate along a unidirectional ring over four steps, merging with online softmax. A 1M-token full-attention KV payload (305.2 GiB) divided four ways still requires 76.3 GiB per device before weights, exceeding a 74.5 GiB (80 decimal GB) limit.'

const label = (
    c: ReturnType<typeof getThemeColors>,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    size: number,
    color: string,
    align: 'left' | 'center' | 'right' = 'center',
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
    const purple = c.primary

    const gx0 = 260
    const gspan = 520
    const gx = (gb: number) => gx0 + (gb / 90) * gspan

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
            // Ring diagram card
            SvgFrame({
                c,
                x: 24,
                y: 108,
                width: 852,
                height: 292,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            // 4 GPUs across ring
            ...[0, 1, 2, 3].flatMap((i) => {
                const bx = 56 + i * 204
                return [
                    SvgFrame({
                        c,
                        x: bx,
                        y: 168,
                        width: 158,
                        height: 136,
                        rx: 10,
                        fill: c.bgCardAlt,
                        stroke: blue,
                        strokeWidth: 2,
                    }),
                    SvgFrame({
                        c,
                        x: bx + 16,
                        y: 244,
                        width: 126,
                        height: 42,
                        rx: 6,
                        fill: green,
                        stroke: green,
                        strokeWidth: 1,
                    }),
                ]
            }),
            // Ring clockwise transfers (0->1->2->3 and wrap 3->0 underneath)
            VectorArrow({
                x1: 214,
                y1: 230,
                x2: 258,
                y2: 230,
                color: warm,
                strokeWidth: 3.5,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 418,
                y1: 230,
                x2: 462,
                y2: 230,
                color: warm,
                strokeWidth: 3.5,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 622,
                y1: 230,
                x2: 666,
                y2: 230,
                color: warm,
                strokeWidth: 3.5,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 746,
                y1: 304,
                x2: 746,
                y2: 338,
                color: warm,
                strokeWidth: 3,
                arrowSize: 3,
            }),
            VectorArrow({
                x1: 746,
                y1: 338,
                x2: 134,
                y2: 338,
                color: warm,
                strokeWidth: 3,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 134,
                y1: 338,
                x2: 134,
                y2: 306,
                color: warm,
                strokeWidth: 3,
                arrowSize: 4,
            }),

            // Bottom memory bar: 76.3 GiB KV vs 74.5 GiB GPU limit
            SvgFrame({
                c,
                x: 24,
                y: 418,
                width: 852,
                height: 140,
                rx: 12,
                fill: c.bgCard,
                stroke: red,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: gx0,
                y: 476,
                width: gx(74.5) - gx0,
                height: 38,
                rx: 4,
                fill: purple,
                stroke: purple,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: gx(74.5) + 2,
                y: 476,
                width: 16,
                height: 38,
                rx: 4,
                fill: red,
                stroke: red,
                strokeWidth: 1,
            }),
        ],
    })

    const limitLine = AxisPlot({
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
                    { x: gx(74.5), y: height - 462 },
                    { x: gx(74.5), y: height - 536 },
                ],
                color: red,
                strokeWidth: 3,
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
                    {limitLine}
                </CanvasItem>

                {label(
                    c,
                    'Ring Attention prefill circulates KV slices',
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
                    '1 local + 3 ring KV visits merge via online softmax',
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
                    'Pass KV clockwise & overlap with local attention',
                    42,
                    120,
                    816,
                    34,
                    28,
                    c.textPrimary,
                    'center',
                    750,
                )}
                {[0, 1, 2, 3].map((i) => (
                    <React.Fragment key={i}>
                        {label(
                            c,
                            `GPU ${i}: Q${i}`,
                            60 + i * 204,
                            182,
                            150,
                            34,
                            28,
                            blue,
                            'center',
                            800,
                        )}
                        {label(c, `KV slot`, 74 + i * 204, 248, 122, 34, 28, c.bg, 'center', 750)}
                    </React.Fragment>
                ))}
                {label(
                    c,
                    'KV3 returns around ring to GPU 0',
                    220,
                    352,
                    460,
                    34,
                    28,
                    warm,
                    'center',
                    750,
                )}

                {label(
                    c,
                    '1M-tok 4-way shard (305.2 GiB / 4)',
                    42,
                    432,
                    816,
                    34,
                    28,
                    red,
                    'left',
                    800,
                )}
                {label(c, 'KV/GPU', 42, 478, 206, 34, 28, purple, 'left', 750)}
                {label(c, '76.3 GiB (> 74.5)', 270, 478, 280, 34, 28, c.bg, 'left', 750)}
                {label(c, '80 GB = 74.5 GiB', gx(74.5) - 270, 518, 260, 34, 28, red, 'right', 700)}
            </Board>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return frame(theme)
}

export default create('dark')
