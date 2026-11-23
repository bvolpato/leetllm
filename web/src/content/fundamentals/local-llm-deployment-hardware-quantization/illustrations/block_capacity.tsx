import React from 'react'
import { AxisPlot, Board, CanvasItem, Scene, SvgFrame, TextLabel, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 900
export const height = 560
export const alt =
    'A uniform-block worksheet places 32 transformer blocks of 0.3 GB beside 3.2 GB fixed head and buffer use. A 16 GB budget fits all 32 blocks, while an 8 GB budget fits 16 blocks and leaves 16 on CPU. Below, llama.cpp -ngl 24 on 40 blocks selects trailing blocks 17 to 39 plus the output head slot, keeping layer 0..16 and embeddings on CPU.'

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

    const x0 = 230
    const fixW = 100
    const blkW = 16
    const b16 = Array.from({ length: 32 }, (_, i) =>
        SvgFrame({
            c,
            x: x0 + fixW + i * blkW,
            y: 158,
            width: blkW - 2,
            height: 36,
            rx: 2,
            fill: blue,
            stroke: blue,
            strokeWidth: 1,
        }),
    )
    const b8 = Array.from({ length: 32 }, (_, i) =>
        SvgFrame({
            c,
            x: x0 + fixW + i * blkW,
            y: 256,
            width: blkW - 2,
            height: 36,
            rx: 2,
            fill: i < 16 ? green : c.bgCardAlt,
            stroke: i < 16 ? green : warm,
            strokeWidth: 1,
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
            SvgFrame({
                c,
                x: x0,
                y: 158,
                width: fixW - 4,
                height: 36,
                rx: 4,
                fill: purple,
                stroke: purple,
                strokeWidth: 1,
            }),
            ...b16,
            SvgFrame({
                c,
                x: x0,
                y: 256,
                width: fixW - 4,
                height: 36,
                rx: 4,
                fill: purple,
                stroke: purple,
                strokeWidth: 1,
            }),
            ...b8,

            // Bottom card: llama.cpp -ngl 24 on 40 blocks
            SvgFrame({
                c,
                x: 24,
                y: 342,
                width: 852,
                height: 196,
                rx: 12,
                fill: c.bgCard,
                stroke: c.border,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 44,
                y: 406,
                width: 280,
                height: 50,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: warm,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 336,
                y: 406,
                width: 374,
                height: 50,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: blue,
                strokeWidth: 2,
            }),
            SvgFrame({
                c,
                x: 722,
                y: 406,
                width: 134,
                height: 50,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: purple,
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
                    'Equal-block fit vs. versioned -ngl offload placement',
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
                    '32 blocks x 0.3 GB + 3.2 GB fixed; compare trailing -ngl 24 rule',
                    20,
                    56,
                    860,
                    36,
                    28,
                    c.textSecondary,
                    'center',
                    650,
                )}

                {label(c, '16 GB VRAM', 42, 118, 176, 34, 28, blue, 'left', 800)}
                {label(
                    c,
                    '32 / 32 GPU blocks fit',
                    230,
                    118,
                    500,
                    34,
                    28,
                    c.textPrimary,
                    'left',
                    700,
                )}
                {label(c, '3.2 GB', 42, 160, 176, 34, 28, purple, 'left', 700)}
                {label(c, '8 GB VRAM', 42, 214, 176, 34, 28, warm, 'left', 800)}
                {label(
                    c,
                    '16 GPU + 16 CPU blocks',
                    230,
                    214,
                    500,
                    34,
                    28,
                    c.textPrimary,
                    'left',
                    700,
                )}
                {label(c, '3.2 GB', 42, 258, 176, 34, 28, purple, 'left', 700)}

                {label(
                    c,
                    'llama.cpp (40 blocks): -ngl 24 offloads 17..39 + output',
                    42,
                    356,
                    816,
                    36,
                    28,
                    c.textPrimary,
                    'left',
                    800,
                )}
                {label(c, '0..16 CPU (17)', 50, 414, 268, 34, 28, warm, 'center', 750)}
                {label(c, '17..39 GPU (23)', 342, 414, 362, 34, 28, blue, 'center', 750)}
                {label(c, 'Output', 726, 414, 126, 34, 28, purple, 'center', 750)}
                {label(
                    c,
                    'Input layer stays on CPU; check installed offload logs.',
                    42,
                    476,
                    816,
                    34,
                    28,
                    c.textSecondary,
                    'left',
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
