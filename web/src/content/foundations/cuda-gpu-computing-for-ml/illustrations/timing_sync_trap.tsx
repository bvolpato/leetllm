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
    getToneFill,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const preset = 'engineering'
export const width = 780
export const height = 436
export const alt =
    'On one elapsed-time axis, Python enqueues CUDA work in 2 ms and returns while device work continues. CUDA events span 40 ms on the GPU stream. A synchronized host timer can report 42 ms in this example because it includes caller overhead and waiting; submission can overlap execution, so 2 plus 40 is not a general rule.'

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
    const purpleFill = getToneFill('purple', c)
    const greenFill = getToneFill('green', c)
    const warmFill = getToneFill('warm', c)
    const x0 = 28
    const x42 = 752
    const scale = (x42 - x0) / 42
    const x2 = x0 + 2 * scale
    const x40 = x0 + 40 * scale

    const shapes: React.ReactNode[] = [
        SvgFrame({
            x: 14,
            y: 82,
            width: 752,
            height: 292,
            c,
            rx: 14,
            fill: c.bgCard,
            stroke: c.borderLight,
            strokeWidth: 1.5,
        }),
        SvgFrame({
            x: x0,
            y: 126,
            width: x2 - x0,
            height: 34,
            c,
            rx: 6,
            fill: warmFill,
            stroke: c.warning,
            strokeWidth: 1.5,
        }),
        VectorArrow({
            x1: x2 + 8,
            y1: 143,
            x2: x40 - 8,
            y2: 143,
            color: c.textMuted,
            strokeWidth: 3,
            arrowSize: 4,
        }),
        SvgFrame({
            x: x0,
            y: 218,
            width: x40 - x0,
            height: 46,
            c,
            rx: 10,
            fill: purpleFill,
            stroke: c.primary,
            strokeWidth: 1.5,
        }),
        SvgFrame({
            x: x0,
            y: 312,
            width: x42 - x0,
            height: 46,
            c,
            rx: 10,
            fill: greenFill,
            stroke: c.positive,
            strokeWidth: 1.5,
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
                    'Python returns before the GPU finishes',
                    28,
                    12,
                    724,
                    29,
                    c.textPrimary,
                    'left',
                    760,
                ),
                lbl(c, '2 ms to enqueue; 40 ms running on the CUDA stream.', 28, 50, 724, 24),
                lbl(
                    c,
                    'Host · enqueue 2 ms → Python continues immediately',
                    28,
                    92,
                    724,
                    24,
                    c.warning,
                    'left',
                    700,
                ),
                lbl(
                    c,
                    'CUDA stream · event-timed work',
                    28,
                    182,
                    724,
                    24,
                    c.textPrimary,
                    'left',
                    700,
                ),
                lbl(
                    c,
                    '40 ms · event interval (start → end)',
                    40,
                    224,
                    x40 - x0 - 24,
                    24,
                    getReadableTextColor(purpleFill, c),
                    'center',
                    740,
                ),
                lbl(
                    c,
                    'Host timer · after explicit synchronize',
                    28,
                    276,
                    724,
                    24,
                    c.textPrimary,
                    'left',
                    700,
                ),
                lbl(
                    c,
                    '42 ms · includes wait & caller overhead',
                    40,
                    318,
                    x42 - x0 - 24,
                    24,
                    getReadableTextColor(greenFill, c),
                    'center',
                    740,
                ),
                lbl(
                    c,
                    'Submission overlaps execution; 2 + 40 is not a rule.',
                    24,
                    384,
                    732,
                    24,
                    c.textSecondary,
                    'center',
                ),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
