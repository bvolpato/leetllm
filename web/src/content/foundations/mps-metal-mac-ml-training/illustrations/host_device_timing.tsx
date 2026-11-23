import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorSegment,
    defineIllustration,
    getReadableToneColor,
    type ThemeColors,
} from 'vizmatic'

export const width = 632
export const height = 492
export const alt =
    'Shared time axis from zero to 35 milliseconds. The CPU launches GPU work during the first three milliseconds while MPS continues until 35 milliseconds. A launch-only host timer stops at three; a synchronized host timer includes the wait and stops at 35.'

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

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const orange = getReadableToneColor('warm', c)
    const x = (ms: number) => 122 + ms * 12
    return Scene({
        c,
        padding: 16,
        gap: 0,
        contentWidth: 600,
        background: c.bgSubtle,
        children: Board({
            c,
            width: 600,
            height: 460,
            background: c.bgSubtle,
            children: [
                CanvasItem({
                    x: 0,
                    y: 0,
                    width: 600,
                    height: 460,
                    children: React.createElement(
                        'svg',
                        { width: 600, height: 460, viewBox: '0 0 600 460' },
                        ...[0, 10, 20, 30, 35].map((ms) =>
                            VectorSegment({
                                x1: x(ms),
                                y1: 131,
                                x2: x(ms),
                                y2: 301,
                                color: c.borderSubtle,
                                strokeWidth: 1,
                                showStartDot: false,
                                showEndDot: false,
                            }),
                        ),
                        SvgFrame({
                            c,
                            x: x(0),
                            y: 150,
                            width: x(3) - x(0),
                            height: 38,
                            rx: 3,
                            fill: blue,
                            stroke: 'transparent',
                        }),
                        SvgFrame({
                            c,
                            x: x(3),
                            y: 150,
                            width: x(35) - x(3),
                            height: 38,
                            rx: 3,
                            fill: c.bg,
                            stroke: orange,
                            strokeWidth: 2,
                        }),
                        SvgFrame({
                            c,
                            x: x(0),
                            y: 244,
                            width: x(35) - x(0),
                            height: 38,
                            rx: 3,
                            fill: green,
                            stroke: 'transparent',
                        }),
                        VectorSegment({
                            x1: x(3),
                            y1: 104,
                            x2: x(3),
                            y2: 303,
                            color: blue,
                            strokeWidth: 2,
                            showStartDot: false,
                            showEndDot: false,
                        }),
                    ),
                }),
                label(c, 18, 8, 570, 'When does the work finish?', 27),
                label(c, 18, 50, 570, 'Warmed-up execution · milliseconds', 23, c.textSecondary),
                label(c, 18, 153, 95, 'CPU', 24, blue),
                label(c, 18, 248, 95, 'MPS', 24, green),
                label(c, x(3) + 10, 102, 405, '3 ms · host call returns', 23, blue),
                label(c, 240, 153, 300, 'wait for completion', 23, orange),
                ...[0, 10, 20, 30, 35].map((ms) =>
                    label(c, x(ms) - 15, 305, 49, String(ms), 23, c.textSecondary),
                ),
                label(c, 230, 204, 320, 'GPU kernels continue', 23, green),
                label(c, 430, 342, 140, 'time (ms)', 23, c.textSecondary),
                label(c, 18, 387, 570, 'Launch-only timer: 3 ms', 24, blue),
                label(c, 18, 423, 570, 'Timer + synchronize(): 35 ms', 24, green),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
