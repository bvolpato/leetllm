import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    getToneColor,
    defineIllustration,
} from 'vizmatic'

export const width = 1000
export const height = 790
export const alt =
    'Two visits compute the same four output tiles Y00, Y01, Y10, and Y11. Columns-first order visits 00, 01, 10, 11 and holds each 1 KiB X tile across two steps while replacing the 4 KiB W tile every step: two X loads plus four W loads, or 18 KiB. Rows-first order visits 00, 10, 01, 11 and holds each W tile across two steps: four X loads plus two W loads, or 12 KiB. Each single slot shows load, hit, or replacement, which evicts the prior tile.'

const illustration = defineIllustration((c) => {
    const label = (
        text: string,
        x: number,
        y: number,
        w: number,
        h: number,
        fontSize: number,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
        fontWeight = 600,
        mono = false,
    ) =>
        CanvasItem({
            x,
            y,
            width: w,
            height: h,
            children: TextLabel({
                c,
                text,
                width: '100%',
                fontSize,
                color,
                align,
                fontWeight,
                mono,
            }),
        })

    const cyan = getToneColor('cyan', c)
    const purple = getToneColor('purple', c)
    const tableX = [330, 560, 770]
    const tableW = [220, 200, 200]
    const orders = [
        {
            baseY: 118,
            heading: 'Columns first',
            map: [
                [1, 2],
                [3, 4],
            ],
            visits: ['(0,0)', '(0,1)', '(1,0)', '(1,1)'],
            xs: ['X₀ · L', 'X₀ · H', 'X₁ · R', 'X₁ · H'],
            ws: ['W₀ · L', 'W₁ · R', 'W₀ · R', 'W₁ · R'],
            summary: '2×1 KiB + 4×4 KiB = 18 KiB',
        },
        {
            baseY: 448,
            heading: 'Rows first',
            map: [
                [1, 3],
                [2, 4],
            ],
            visits: ['(0,0)', '(1,0)', '(0,1)', '(1,1)'],
            xs: ['X₀ · L', 'X₁ · R', 'X₀ · R', 'X₁ · R'],
            ws: ['W₀ · L', 'W₀ · H', 'W₁ · R', 'W₁ · H'],
            summary: '4×1 KiB + 2×4 KiB = 12 KiB',
        },
    ]

    const outputTiles = (baseY: number, map: number[][]) =>
        Array.from({ length: 4 }, (_, index) => {
            const row = Math.floor(index / 2)
            const col = index % 2
            const x = 30 + col * 126
            const y = baseY + 62 + row * 110
            const output = ['Y₀₀', 'Y₀₁', 'Y₁₀', 'Y₁₁'][index]
            return [
                SvgFrame({
                    c,
                    x,
                    y,
                    width: 116,
                    height: 100,
                    rx: 3,
                    fill: c.bgCard,
                    stroke: c.border,
                    strokeWidth: 1.5,
                }),
                label(
                    String(map[row][col]),
                    x + 5,
                    y + 9,
                    106,
                    34,
                    34,
                    c.textPrimary,
                    'center',
                    750,
                    true,
                ),
                label(output, x + 5, y + 53, 106, 34, 34, c.textPrimary, 'center', 650, true),
            ]
        }).flat()

    const tableText = (order: (typeof orders)[number]) =>
        order.visits.flatMap((visit, index) => {
            const y = order.baseY + 89 + index * 50
            return [
                label(
                    String(index + 1) + ' · ' + visit,
                    tableX[0] + 8,
                    y,
                    tableW[0] - 16,
                    34,
                    33,
                    c.textPrimary,
                    'left',
                    650,
                    true,
                ),
                label(
                    order.xs[index],
                    tableX[1] + 8,
                    y,
                    tableW[1] - 16,
                    34,
                    33,
                    c.textPrimary,
                    'left',
                    600,
                    true,
                ),
                label(
                    order.ws[index],
                    tableX[2] + 8,
                    y,
                    tableW[2] - 16,
                    34,
                    33,
                    c.textPrimary,
                    'left',
                    600,
                    true,
                ),
            ]
        })

    const tableFrames = orders.flatMap((order) => [
        ...Array.from({ length: 4 }, (_, index) => {
            const y = order.baseY + 84 + index * 50
            return SvgFrame({
                c,
                x: 326,
                y,
                width: 644,
                height: 46,
                rx: 2,
                fill: c.bgSubtle,
                stroke: c.borderLight,
                strokeWidth: 1,
            })
        }),
        SvgFrame({
            c,
            x: 326,
            y: order.baseY + 48,
            width: 224,
            height: 34,
            rx: 2,
            fill: c.bgCard,
            stroke: cyan,
            strokeWidth: 1.5,
        }),
        SvgFrame({
            c,
            x: 556,
            y: order.baseY + 48,
            width: 208,
            height: 34,
            rx: 2,
            fill: c.bgCard,
            stroke: cyan,
            strokeWidth: 1.5,
        }),
        SvgFrame({
            c,
            x: 766,
            y: order.baseY + 48,
            width: 204,
            height: 34,
            rx: 2,
            fill: c.bgCard,
            stroke: purple,
            strokeWidth: 1.5,
        }),
    ])

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        children: Board({
            c,
            width,
            height,
            background: 'transparent',
            children: [
                CanvasItem({
                    x: 0,
                    y: 0,
                    width,
                    height,
                    children: (
                        <svg
                            width={width}
                            height={height}
                            viewBox={'0 0 ' + width + ' ' + height}
                            role="presentation"
                            aria-hidden="true"
                        >
                            {tableFrames}
                            {orders.flatMap((order) =>
                                outputTiles(order.baseY, order.map).filter(
                                    (_, index) => index % 3 === 0,
                                ),
                            )}
                            <line
                                x1="20"
                                y1="440"
                                x2="980"
                                y2="440"
                                stroke={c.border}
                                strokeWidth="1.5"
                            />
                        </svg>
                    ),
                }),
                label(
                    'Grid order changes which tile stays in the slot',
                    20,
                    12,
                    960,
                    40,
                    36,
                    c.textPrimary,
                    'center',
                    750,
                ),
                label(
                    'X slot 1 KiB · W slot 4 KiB',
                    20,
                    52,
                    960,
                    30,
                    34,
                    c.textPrimary,
                    'center',
                    650,
                ),
                label(
                    'L = load · H = hit · R = replace (evict, then load)',
                    20,
                    82,
                    960,
                    28,
                    34,
                    c.textPrimary,
                    'center',
                    600,
                ),
                ...orders.flatMap((order) => [
                    label(
                        order.heading,
                        28,
                        order.baseY + 14,
                        270,
                        38,
                        36,
                        c.textPrimary,
                        'center',
                        750,
                    ),
                    label(
                        'Step · tile',
                        tableX[0] + 10,
                        order.baseY + 48,
                        tableW[0] - 20,
                        34,
                        33,
                        c.textPrimary,
                        'left',
                        700,
                    ),
                    label(
                        'X slot',
                        tableX[1] + 10,
                        order.baseY + 48,
                        tableW[1] - 20,
                        34,
                        33,
                        c.textPrimary,
                        'left',
                        700,
                    ),
                    label(
                        'W slot',
                        tableX[2] + 10,
                        order.baseY + 48,
                        tableW[2] - 20,
                        34,
                        33,
                        c.textPrimary,
                        'left',
                        700,
                    ),
                    ...outputTiles(order.baseY, order.map).filter((_, index) => index % 3 !== 0),
                    ...tableText(order),
                    label(
                        order.summary,
                        326,
                        order.baseY + 287,
                        644,
                        34,
                        34,
                        c.textPrimary,
                        'center',
                        700,
                        true,
                    ),
                ]),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
