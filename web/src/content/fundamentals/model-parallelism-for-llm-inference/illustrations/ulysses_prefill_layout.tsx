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
    'DeepSpeed Ulysses prefill projects local sequence slices to Q, K, and V, runs a first All-to-All collective to transpose tensors into full-sequence head shards, computes local FlashAttention per head slice, and runs a second All-to-All back to sequence slices before output projection W_O.'

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
    const green = c.positive
    const warm = c.warning

    const cols = [blue, purple, green, warm]

    // Matrix cell strip helper (4 rows x 4 cols)
    const makeTile = (tx: number, ty: number, byRow: boolean) => {
        const items = []
        for (let r = 0; r < 4; r++) {
            for (let col = 0; col < 4; col++) {
                const fill = byRow ? cols[r] : cols[col]
                items.push(
                    SvgFrame({
                        c,
                        x: tx + col * 38,
                        y: ty + r * 38,
                        width: 34,
                        height: 34,
                        rx: 4,
                        fill,
                        stroke: fill,
                        strokeWidth: 1,
                    }),
                )
            }
        }
        return items
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
            // Stage 1 card: Seq shards (rows = ranks)
            SvgFrame({
                c,
                x: 20,
                y: 112,
                width: 214,
                height: 340,
                rx: 12,
                fill: c.bgCard,
                stroke: blue,
                strokeWidth: 2,
            }),
            ...makeTile(51, 212, true),

            VectorArrow({
                x1: 238,
                y1: 282,
                x2: 338,
                y2: 282,
                color: warm,
                strokeWidth: 4,
                arrowSize: 4,
            }),

            // Stage 2 card: Head shards (cols = ranks)
            SvgFrame({
                c,
                x: 342,
                y: 112,
                width: 214,
                height: 340,
                rx: 12,
                fill: c.bgCard,
                stroke: purple,
                strokeWidth: 2,
            }),
            ...makeTile(373, 212, false),

            VectorArrow({
                x1: 560,
                y1: 282,
                x2: 660,
                y2: 282,
                color: warm,
                strokeWidth: 4,
                arrowSize: 4,
            }),

            // Stage 3 card: Seq shards restored + W_O
            SvgFrame({
                c,
                x: 664,
                y: 112,
                width: 214,
                height: 340,
                rx: 12,
                fill: c.bgCard,
                stroke: green,
                strokeWidth: 2,
            }),
            ...makeTile(695, 212, true),

            // Footer
            SvgFrame({
                c,
                x: 20,
                y: 472,
                width: 858,
                height: 82,
                rx: 12,
                fill: c.bgCardAlt,
                stroke: c.border,
                strokeWidth: 2,
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
                    'Ulysses transposes seq shards to head shards',
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
                    'Rows = S/4 | Cols = H/4; colors follow rank',
                    20,
                    56,
                    860,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}

                {label(c, '1. Seq slices', 26, 126, 202, 34, 28, blue, 'center', 800)}
                {label(c, 'Local Q, K, V', 26, 166, 202, 34, 28, c.textSecondary, 'center', 650)}
                {label(c, 'All heads, S/4', 26, 392, 202, 34, 28, c.textPrimary, 'center', 700)}

                {label(c, 'All2All', 238, 232, 100, 34, 28, warm, 'center', 800)}
                {label(c, '#1', 238, 294, 100, 34, 28, warm, 'center', 750)}

                {label(c, '2. Head slices', 348, 126, 202, 34, 28, purple, 'center', 800)}
                {label(c, 'FlashAttention', 348, 166, 202, 34, 28, c.textSecondary, 'center', 650)}
                {label(c, 'Full seq, H/4', 348, 392, 202, 34, 28, c.textPrimary, 'center', 700)}

                {label(c, 'All2All', 560, 232, 100, 34, 28, warm, 'center', 800)}
                {label(c, '#2', 560, 294, 100, 34, 28, warm, 'center', 750)}

                {label(c, '3. Out proj', 670, 126, 202, 34, 28, green, 'center', 800)}
                {label(c, 'Apply W_O', 670, 166, 202, 34, 28, c.textSecondary, 'center', 650)}
                {label(c, 'All heads, S/4', 670, 392, 202, 34, 28, c.textPrimary, 'center', 700)}

                {label(
                    c,
                    'Requires head count divisible across ranks (or KV copy).',
                    34,
                    496,
                    832,
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
