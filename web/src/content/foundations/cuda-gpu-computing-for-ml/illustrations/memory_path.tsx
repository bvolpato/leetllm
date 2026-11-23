import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    defineIllustration,
    getReadableTextColor,
    getReadableToneColor,
    getToneFill,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const preset = 'engineering'
export const width = 820
export const height = 532
export const alt =
    'A CPU batch crosses to CUDA device global memory. GPU kernels access model tensors through the device memory system; L2 is shared across SMs, L1 is per SM, shared memory is per block, and registers belong to threads. Below, four equal 4-byte quantities make a simplified 16-byte FP32 Adam budget per parameter: weight, gradient, first moment, and second moment. One billion parameters therefore account for 14.90 GiB before activations, workspaces, and allocator overhead.'

const lbl = (
    c: ThemeColors,
    text: string,
    x: number,
    y: number,
    w: number,
    fontSize = 24,
    color = c.textSecondary,
    align: 'left' | 'center' | 'right' = 'left',
    fontWeight = 550,
) =>
    CanvasItem({
        x,
        y,
        width: w,
        height: fontSize + 10,
        children: TextLabel({ c, text, width: w, fontSize, color, align, fontWeight }),
    })

const illustration = defineIllustration((c: ThemeColors) => {
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const purple = getReadableToneColor('purple', c)
    const tones = ['blue', 'warm', 'purple', 'cyan'] as const
    const budget = ['weight', 'gradient', 'moment m', 'moment v']
    const vramItems = ['weights', 'activations', 'gradients', 'Adam state']

    const shapes: React.ReactNode[] = [
        SvgFrame({
            x: 16,
            y: 98,
            width: 174,
            height: 238,
            c,
            rx: 14,
            fill: c.bgCard,
            stroke: c.borderLight,
            strokeWidth: 1.5,
        }),
        SvgFrame({
            x: 244,
            y: 98,
            width: 222,
            height: 238,
            c,
            rx: 14,
            fill: c.bgSubtle,
            stroke: c.borderLight,
            strokeWidth: 1.5,
        }),
        SvgFrame({
            x: 520,
            y: 98,
            width: 284,
            height: 238,
            c,
            rx: 14,
            fill: c.bgCard,
            stroke: c.borderLight,
            strokeWidth: 1.5,
        }),
        SvgFrame({
            x: 534,
            y: 112,
            width: 256,
            height: 50,
            c,
            rx: 10,
            fill: getToneFill('blue', c),
            stroke: blue,
            strokeWidth: 1.4,
        }),
        ...[0, 1].map((i) =>
            SvgFrame({
                key: `sm-${i}`,
                x: 534 + i * 132,
                y: 176,
                width: 124,
                height: 146,
                c,
                rx: 10,
                fill: c.bgSubtle,
                stroke: green,
                strokeWidth: 1.4,
            }),
        ),
        SvgFrame({
            x: 16,
            y: 398,
            width: 788,
            height: 76,
            c,
            rx: 10,
            fill: c.bgCard,
            stroke: 'none',
        }),
        ...tones.map((t, i) =>
            SvgFrame({
                key: `b-${t}`,
                x: 16 + i * 197,
                y: 398,
                width: 197,
                height: 76,
                c,
                rx: i === 0 || i === 3 ? 10 : 0,
                fill: getToneFill(t, c),
                stroke: getReadableToneColor(t, c),
                strokeWidth: 1.5,
            }),
        ),
        VectorArrow({
            x1: 192,
            y1: 218,
            x2: 240,
            y2: 218,
            color: blue,
            strokeWidth: 3.5,
            arrowSize: 4,
        }),
        VectorArrow({
            x1: 468,
            y1: 218,
            x2: 516,
            y2: 218,
            color: green,
            strokeWidth: 3.5,
            arrowSize: 4,
        }),
    ]

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        children: Board({
            background: 'transparent',
            c,
            width,
            height,
            children: [
                CanvasItem({
                    x: 0,
                    y: 0,
                    width,
                    height,
                    children: React.createElement(
                        'svg',
                        { width, height, viewBox: `0 0 ${width} ${height}` },
                        ...shapes,
                    ),
                }),
                lbl(
                    c,
                    'Where CUDA training bytes live',
                    16,
                    12,
                    788,
                    29,
                    c.textPrimary,
                    'left',
                    760,
                ),
                lbl(c, 'H2D path, SM storage scopes, and FP32 Adam budget.', 16, 50, 788, 24),
                lbl(c, 'CPU RAM', 28, 114, 150, 24, c.textPrimary, 'center', 720),
                lbl(c, 'dataset', 28, 168, 150, 24, c.textSecondary, 'center'),
                lbl(c, '(4, 8, 16)', 28, 204, 150, 24, blue, 'center', 700),
                lbl(c, 'batch', 28, 238, 150, 24, c.textSecondary, 'center'),
                lbl(c, 'H2D', 190, 174, 54, 24, blue, 'center', 720),
                lbl(c, 'GPU VRAM', 256, 114, 198, 24, c.textPrimary, 'center', 720),
                ...vramItems.map((item, idx) =>
                    lbl(
                        c,
                        item,
                        256,
                        162 + idx * 42,
                        198,
                        24,
                        [blue, green, warm, purple][idx],
                        'center',
                        650,
                    ),
                ),
                lbl(
                    c,
                    'L2 cache · all SMs',
                    540,
                    120,
                    244,
                    24,
                    getReadableTextColor(getToneFill('blue', c), c),
                    'center',
                    700,
                ),
                ...[0, 1].flatMap((i) => {
                    const sx = 538 + i * 132
                    return [
                        lbl(c, `SM ${i}`, sx, 184, 116, 24, green, 'center', 720),
                        lbl(c, 'L1 cache', sx, 220, 116, 24, c.textPrimary, 'center'),
                        lbl(c, 'Shared', sx, 252, 116, 24, c.textPrimary, 'center'),
                        lbl(c, 'Registers', sx, 284, 116, 24, c.textPrimary, 'center'),
                    ]
                }),
                lbl(
                    c,
                    'FP32 Adam · 16 bytes per parameter',
                    16,
                    354,
                    788,
                    25,
                    c.textPrimary,
                    'left',
                    740,
                ),
                ...budget.flatMap((name, i) => {
                    const x = 16 + i * 197
                    const color = getReadableTextColor(getToneFill(tones[i]!, c), c)
                    return [
                        lbl(c, '4 B', x + 4, 404, 189, 25, color, 'center', 750),
                        lbl(c, name, x + 4, 438, 189, 24, color, 'center', 650),
                    ]
                }),
                lbl(
                    c,
                    '1B params × 16 B = 16 GB = 14.90 GiB (+ activations & workspaces)',
                    16,
                    486,
                    788,
                    24,
                    warm,
                    'center',
                    720,
                ),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
