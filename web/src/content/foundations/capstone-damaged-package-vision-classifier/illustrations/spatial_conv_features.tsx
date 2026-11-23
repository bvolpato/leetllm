import React from 'react'
import {
    Column,
    FlowArrow,
    Heatmap,
    Matrix,
    Panel,
    PixelGrid,
    Row,
    Scene,
    TextLabel,
    crossCorrelate2d,
    defineIllustration,
    getReadableToneColor,
    withDensity,
    type RgbPixel,
} from 'vizmatic'

export const width = 640
export const height = 740
export const autoSize = false
export const alt =
    'A 6x6 crushed cardboard corner patch convolved with a 3x3 diagonal crease kernel to produce a 4x4 ReLU feature map highlighting the damage crease.'

const cornerLum: number[][] = [
    [0.72, 0.71, 0.7, 0.67, 0.54, 0.42],
    [0.71, 0.7, 0.67, 0.56, 0.36, 0.28],
    [0.7, 0.66, 0.52, 0.32, 0.24, 0.21],
    [0.68, 0.58, 0.38, 0.25, 0.22, 0.2],
    [0.67, 0.61, 0.51, 0.44, 0.41, 0.38],
    [0.66, 0.64, 0.58, 0.52, 0.49, 0.47],
]

const cornerPixels: RgbPixel[][] = cornerLum.map((row) =>
    row.map(
        (v) =>
            [
                Math.round(v * 245),
                Math.round(v * 198),
                Math.round(v * 145),
            ] as const,
    ),
)

const creaseKernel: number[][] = [
    [1, 1, 0],
    [1, 0, -1],
    [0, -1, -1],
]

const rawConv = crossCorrelate2d(cornerLum, creaseKernel, { padding: 'valid' })
const reluMap = rawConv.map((row) =>
    row.map((val) => Number(Math.max(0, val).toFixed(1))),
)

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 1.9)
    return Scene({
        c,
        padding: 12,
        gap: 12,
        contentWidth: 616,
        children: Column({
            gap: 12,
            children: [
                Row({
                    gap: 10,
                    align: 'stretch',
                    justify: 'space-between',
                    children: [
                        Panel({
                            c,
                            width: 280,
                            padding: 12,
                            title: '1. Input Crop (6x6)',
                            subtitle: 'Crushed corner fold',
                            children: Column({
                                gap: 8,
                                align: 'center',
                                children: [
                                    PixelGrid({
                                        pixels: cornerPixels,
                                        c,
                                        width: 144,
                                        height: 144,
                                        region: {
                                            row: 1,
                                            column: 1,
                                            rows: 3,
                                            columns: 3,
                                        },
                                    }),
                                    TextLabel({
                                        text: '3x3 active window',
                                        fontSize: 19,
                                        color: getReadableToneColor('blue', c),
                                        c,
                                    }),
                                ],
                            }),
                        }),
                        FlowArrow({ c, direction: 'right', length: 24 }),
                        Panel({
                            c,
                            width: 280,
                            padding: 12,
                            title: '2. Crease Kernel',
                            subtitle: 'Crease polarity weights',
                            children: Column({
                                gap: 8,
                                align: 'center',
                                children: [
                                    Matrix({
                                        data: creaseKernel,
                                        c,
                                        cellWidth: 68,
                                        cellHeight: 48,
                                        fontSize: 20,
                                        colorize: true,
                                        colorScale: 'strength',
                                        colorDomain: [-1, 1],
                                    }),
                                    TextLabel({
                                        text: 'Light corner vs dark fold',
                                        fontSize: 19,
                                        c,
                                    }),
                                ],
                            }),
                        }),
                    ],
                }),
                Panel({
                    c,
                    width: 616,
                    padding: 12,
                    tone: 'blue',
                    title: '3. ReLU Feature Map (4x4 Valid Output)',
                    subtitle: `Largest response: ${Math.max(...reluMap.flat()).toFixed(1)}`,
                    children: Row({
                        gap: 16,
                        align: 'center',
                        justify: 'space-between',
                        children: [
                            Heatmap({
                                data: reluMap,
                                xLabels: ['c0', 'c1', 'c2', 'c3'],
                                yLabels: ['r0', 'r1', 'r2', 'r3'],
                                c,
                                cellWidth: 54,
                                cellHeight: 46,
                                fontSize: 19,
                                labels: reluMap.map((row) =>
                                    row.map((val) => val.toFixed(1)),
                                ),
                                colorScale: 'heat',
                                colorDomain: [0, 1.2],
                            }),
                            Column({
                                gap: 10,
                                children: [
                                    'Window (1, 1)',
                                    '0.70 + 0.67 + 0.66',
                                    '− 0.32 − 0.38 − 0.25',
                                    '= 1.08 → ReLU 1.08',
                                ].map((text) => TextLabel({ text, fontSize: 21, width: 280, c })),
                            }),
                        ],
                    }),
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
