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
    'An eight-rank hybrid layout places layers 0 to 39 on Node 0 across TP ranks 0 to 3, and layers 40 to 79 on Node 1 across TP ranks 4 to 7. Each stage runs intra-node SUM all-reduce within its TP group while hidden activations [B, s, h] cross one inter-node pipeline boundary to produce logits and the next sampled decode token.'

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
    const purple = c.primary
    const warm = c.warning
    const green = c.positive

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
            // Node 0: Stage 0
            SvgFrame({
                c,
                x: 24,
                y: 112,
                width: 356,
                height: 288,
                rx: 12,
                fill: c.bgCard,
                stroke: blue,
                strokeWidth: 2.5,
            }),
            ...[0, 1, 2, 3].map((r) =>
                SvgFrame({
                    c,
                    x: 46 + r * 80,
                    y: 186,
                    width: 72,
                    height: 84,
                    rx: 8,
                    fill: c.bgCardAlt,
                    stroke: blue,
                    strokeWidth: 1.5,
                }),
            ),
            SvgFrame({
                c,
                x: 46,
                y: 294,
                width: 312,
                height: 64,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: green,
                strokeWidth: 1.5,
            }),

            // Inter-node PP arrow
            VectorArrow({
                x1: 382,
                y1: 256,
                x2: 518,
                y2: 256,
                color: warm,
                strokeWidth: 4,
                arrowSize: 4,
            }),

            // Node 1: Stage 1
            SvgFrame({
                c,
                x: 520,
                y: 112,
                width: 356,
                height: 288,
                rx: 12,
                fill: c.bgCard,
                stroke: purple,
                strokeWidth: 2.5,
            }),
            ...[0, 1, 2, 3].map((r) =>
                SvgFrame({
                    c,
                    x: 542 + r * 80,
                    y: 186,
                    width: 72,
                    height: 84,
                    rx: 8,
                    fill: c.bgCardAlt,
                    stroke: purple,
                    strokeWidth: 1.5,
                }),
            ),
            SvgFrame({
                c,
                x: 542,
                y: 294,
                width: 312,
                height: 64,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: green,
                strokeWidth: 1.5,
            }),

            // Decode loop footer
            SvgFrame({
                c,
                x: 24,
                y: 426,
                width: 852,
                height: 108,
                rx: 12,
                fill: c.bgCardAlt,
                stroke: c.border,
                strokeWidth: 2,
            }),
            VectorArrow({
                x1: 698,
                y1: 400,
                x2: 698,
                y2: 424,
                color: warm,
                strokeWidth: 3.5,
                arrowSize: 4,
            }),
            VectorArrow({
                x1: 202,
                y1: 424,
                x2: 202,
                y2: 400,
                color: green,
                strokeWidth: 3.5,
                arrowSize: 4,
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
                    'Hybrid TP=4 x PP=2 across two 4-GPU nodes',
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
                    'Fast intra-node TP SUM; 1 cross-node PP hop',
                    20,
                    56,
                    860,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}

                {label(c, 'Node 0: S0 (L0..39)', 36, 126, 332, 36, 28, blue, 'center', 800)}
                {[0, 1, 2, 3].map((r) =>
                    label(c, `TP${r}`, 46 + r * 80, 212, 72, 34, 28, blue, 'center', 750),
                )}
                {label(c, 'Fast intra-node SUM', 54, 308, 296, 36, 28, green, 'center', 750)}

                {label(c, '[B, s, h]', 386, 212, 128, 34, 28, warm, 'center', 800)}
                {label(c, 'PP edge', 386, 266, 128, 34, 28, warm, 'center', 700)}

                {label(c, 'Node 1: S1 (L40..79)', 532, 126, 332, 36, 28, purple, 'center', 800)}
                {[4, 5, 6, 7].map((r, i) =>
                    label(c, `TP${r}`, 542 + i * 80, 212, 72, 34, 28, purple, 'center', 750),
                )}
                {label(c, 'Fast intra-node SUM', 550, 308, 296, 36, 28, green, 'center', 750)}

                {label(
                    c,
                    'Stage 1 logits -> sample token -> feed Stage 0',
                    42,
                    462,
                    816,
                    36,
                    28,
                    c.textPrimary,
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
