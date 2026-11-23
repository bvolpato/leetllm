import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    defineIllustration,
    getReadableToneColor,
    type ThemeColors,
} from 'vizmatic'

export const width = 632
export const height = 692
export const alt =
    'Two separate physical pools hold CPU and CUDA copies of a four-sequence tensor on a discrete GPU. Apple silicon places distinct CPU and MPS copies inside one shared physical pool. Each copy has four rows of eight token positions with sixteen float32 features per position, totaling two KiB.'

function label(
    c: ThemeColors,
    x: number,
    y: number,
    w: number,
    text: string,
    size = 23,
    color = c.textPrimary,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: size + 10,
        children: TextLabel({ c, text, fontSize: size, color, mono: true }),
    })
}

function allocation(c: ThemeColors, x: number, y: number, color: string) {
    return Array.from({ length: 32 }, (_, index) =>
        SvgFrame({
            c,
            x: x + (index % 8) * 22,
            y: y + Math.floor(index / 8) * 16,
            width: 18,
            height: 12,
            rx: 2,
            fill: color,
            stroke: 'transparent',
            opacity: 0.8,
        }),
    )
}

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const purple = getReadableToneColor('purple', c)
    return Scene({
        c,
        padding: 16,
        gap: 0,
        contentWidth: 600,
        background: c.bgSubtle,
        children: Board({
            c,
            width: 600,
            height: 660,
            background: c.bgSubtle,
            children: [
                CanvasItem({
                    x: 0,
                    y: 0,
                    width: 600,
                    height: 660,
                    children: React.createElement(
                        'svg',
                        { width: 600, height: 660, viewBox: '0 0 600 660' },
                        SvgFrame({
                            c,
                            x: 18,
                            y: 141,
                            width: 237,
                            height: 178,
                            fill: c.bg,
                            stroke: blue,
                            strokeWidth: 2,
                        }),
                        SvgFrame({
                            c,
                            x: 345,
                            y: 141,
                            width: 237,
                            height: 178,
                            fill: c.bg,
                            stroke: green,
                            strokeWidth: 2,
                        }),
                        ...allocation(c, 49, 199, blue),
                        ...allocation(c, 376, 199, green),
                        VectorArrow({
                            x1: 266,
                            y1: 233,
                            x2: 334,
                            y2: 233,
                            color: c.textPrimary,
                            strokeWidth: 3,
                            arrowSize: 8,
                        }),
                        SvgFrame({
                            c,
                            x: 18,
                            y: 396,
                            width: 564,
                            height: 221,
                            fill: c.bg,
                            stroke: purple,
                            strokeWidth: 2,
                        }),
                        SvgFrame({
                            c,
                            x: 38,
                            y: 446,
                            width: 199,
                            height: 145,
                            fill: c.bgSubtle,
                            stroke: blue,
                            strokeWidth: 1.5,
                        }),
                        SvgFrame({
                            c,
                            x: 363,
                            y: 446,
                            width: 199,
                            height: 145,
                            fill: c.bgSubtle,
                            stroke: purple,
                            strokeWidth: 1.5,
                        }),
                        ...allocation(c, 49, 495, blue),
                        ...allocation(c, 376, 495, purple),
                        VectorArrow({
                            x1: 249,
                            y1: 523,
                            x2: 351,
                            y2: 523,
                            color: c.textPrimary,
                            strokeWidth: 3,
                            arrowSize: 8,
                        }),
                    ),
                }),
                label(c, 18, 8, 570, 'Where does the tensor copy live?', 27),
                label(c, 18, 48, 570, '4 × 8 × 16 float32 = 2 KiB', 24, c.textSecondary),
                label(c, 18, 99, 570, 'Discrete GPU · two physical pools', 24),
                label(c, 48, 154, 202, 'Host RAM', 23, blue),
                label(c, 376, 154, 202, 'GPU VRAM', 23, green),
                label(c, 49, 275, 200, 'cpu · 2 KiB', 23, blue),
                label(c, 375, 275, 202, 'cuda · 2 KiB', 23, green),
                label(c, 269, 191, 74, 'PCIe', 23, c.textSecondary),
                label(c, 18, 350, 570, 'Apple silicon · one physical pool', 24),
                label(c, 42, 406, 520, 'Shared DRAM · macOS + apps + tensors', 23, purple),
                label(c, 52, 456, 190, 'CPU buffer', 23, blue),
                label(c, 375, 456, 190, 'MPS buffer', 23, purple),
                label(c, 50, 558, 190, 'cpu · 2 KiB', 23, blue),
                label(c, 375, 558, 190, 'mps · 2 KiB', 23, purple),
                label(c, 254, 475, 110, 'copy', 23, c.textSecondary),
                label(
                    c,
                    50,
                    625,
                    530,
                    'Each small cell = 16 float32 features',
                    23,
                    c.textSecondary,
                ),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
