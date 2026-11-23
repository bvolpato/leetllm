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
export const height = 407
export const alt =
    'Three valid MPS availability states. With built false and available false, the example selects CPU. Built true and available false also selects CPU. Built true and available true selects MPS. The two checks distinguish support in the installed wheel from access on this machine.'

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
    const yes = getReadableToneColor('green', c)
    const no = getReadableToneColor('warm', c)
    const states = [
        [false, false],
        [true, false],
        [true, true],
    ]
    return Scene({
        c,
        padding: 16,
        gap: 0,
        contentWidth: 600,
        background: c.bgSubtle,
        children: Board({
            c,
            width: 600,
            height: 375,
            background: c.bgSubtle,
            children: [
                CanvasItem({
                    x: 0,
                    y: 0,
                    width: 600,
                    height: 375,
                    children: React.createElement(
                        'svg',
                        { width: 600, height: 375, viewBox: '0 0 600 375' },
                        ...states.flatMap(([built, available], i) => {
                            const y = 140 + i * 80
                            return [
                                SvgFrame({
                                    c,
                                    x: 25,
                                    y,
                                    width: 155,
                                    height: 54,
                                    fill: c.bg,
                                    stroke: built ? yes : no,
                                    strokeWidth: 2,
                                }),
                                SvgFrame({
                                    c,
                                    x: 225,
                                    y,
                                    width: 195,
                                    height: 54,
                                    fill: c.bg,
                                    stroke: available ? yes : no,
                                    strokeWidth: 2,
                                }),
                                SvgFrame({
                                    c,
                                    x: 485,
                                    y,
                                    width: 95,
                                    height: 54,
                                    fill: c.bg,
                                    stroke: available ? yes : no,
                                    strokeWidth: 2,
                                }),
                                VectorArrow({
                                    x1: 431,
                                    y1: y + 27,
                                    x2: 473,
                                    y2: y + 27,
                                    color: available ? yes : no,
                                    strokeWidth: 3,
                                    arrowSize: 8,
                                }),
                            ]
                        }),
                    ),
                }),
                label(c, 18, 8, 570, 'Two checks, three possible states', 27),
                label(c, 25, 60, 180, 'Wheel', 24, c.textSecondary),
                label(c, 225, 60, 230, 'Machine', 24, c.textSecondary),
                label(c, 485, 60, 100, 'Select', 24, c.textSecondary),
                label(c, 25, 99, 185, 'is_built()', 23),
                label(c, 225, 99, 230, 'is_available()', 23),
                ...states.flatMap(([built, available], i) => {
                    const y = 153 + i * 80
                    return [
                        label(c, 60, y, 110, built ? 'True' : 'False', 23, built ? yes : no),
                        label(
                            c,
                            280,
                            y,
                            125,
                            available ? 'True' : 'False',
                            23,
                            available ? yes : no,
                        ),
                        label(c, 511, y, 75, available ? 'mps' : 'cpu', 23, available ? yes : no),
                    ]
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
