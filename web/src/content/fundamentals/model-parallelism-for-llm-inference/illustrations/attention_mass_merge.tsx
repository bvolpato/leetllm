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
    'Two equally scored positions of value 0 on shard 0 have probability mass 2, one position of value 9 on shard 1 has mass 1, and shard 2 is empty (mass 0). Averaging local shard outputs yields 4.5, whereas shared-maximum mass-weighted merging yields the exact global value 3.0.'

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
    const green = c.positive

    const x0 = 260
    const gx = (val: number) => x0 + (val / 9) * 520

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
            // Top: 3 shards
            SvgFrame({
                c,
                x: 24,
                y: 112,
                width: 268,
                height: 186,
                rx: 12,
                fill: c.bgCard,
                stroke: blue,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 316,
                y: 112,
                width: 268,
                height: 186,
                rx: 12,
                fill: c.bgCard,
                stroke: warm,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 608,
                y: 112,
                width: 268,
                height: 186,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),

            VectorArrow({
                x1: 158,
                y1: 300,
                x2: 330,
                y2: 344,
                color: blue,
                strokeWidth: 3,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 450,
                y1: 300,
                x2: 450,
                y2: 344,
                color: warm,
                strokeWidth: 3,
                arrowSize: 4,
            }),

            // Bottom comparison bars (wrong 4.5 vs exact 3.0)
            SvgFrame({
                c,
                x: 24,
                y: 346,
                width: 852,
                height: 188,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: x0,
                y: 404,
                width: gx(4.5) - x0,
                height: 38,
                rx: 6,
                fill: red,
                stroke: red,
                strokeWidth: 1,
            }),
            SvgFrame({
                c,
                x: x0,
                y: 462,
                width: gx(3.0) - x0,
                height: 38,
                rx: 6,
                fill: green,
                stroke: green,
                strokeWidth: 1,
            }),
        ],
    })

    const axisLines = AxisPlot({
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
                    { x: x0, y: height - 512 },
                    { x: gx(9), y: height - 512 },
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
                    {axisLines}
                </CanvasItem>

                {label(
                    c,
                    'Merge context-parallel shards using shared-max mass',
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
                    'Rescale l_j & u_j with shared M = max(m_j)',
                    20,
                    56,
                    860,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}

                {label(c, 'Shard 0 (n=2)', 30, 126, 256, 34, 28, blue, 'center', 800)}
                {label(c, 's = [1000, 1000]', 30, 174, 256, 34, 28, c.textSecondary, 'center', 650)}
                {label(c, 'v=[0,0] -> 0.0', 30, 226, 256, 34, 28, c.textPrimary, 'center', 750)}

                {label(c, 'Shard 1 (n=1)', 322, 126, 256, 34, 28, warm, 'center', 800)}
                {label(c, 's = [1000]', 322, 174, 256, 34, 28, c.textSecondary, 'center', 650)}
                {label(c, 'v=[9] -> 9.0', 322, 226, 256, 34, 28, c.textPrimary, 'center', 750)}

                {label(c, 'Shard 2 (empty)', 620, 126, 244, 34, 28, c.textSecondary, 'center', 800)}
                {label(c, 'mass = 0', 620, 174, 244, 34, 28, c.textSecondary, 'center', 650)}
                {label(c, 'Join NCCL!', 620, 226, 244, 34, 28, c.textPrimary, 'center', 750)}

                {label(
                    c,
                    'Combined scalar output on scale [0 .. 9]',
                    42,
                    360,
                    816,
                    34,
                    28,
                    c.textPrimary,
                    'left',
                    800,
                )}
                {label(c, 'Naive average', 42, 406, 204, 34, 28, red, 'left', 750)}
                {label(c, '4.5 (unweighted wrong)', 530, 406, 330, 34, 28, red, 'left', 750)}
                {label(c, 'Mass merge', 42, 464, 204, 34, 28, green, 'left', 750)}
                {label(c, '3.0 (exact = dense)', 446, 464, 380, 34, 28, green, 'left', 800)}
            </Board>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return frame(theme)
}

export default create('dark')
