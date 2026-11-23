import {
    AxisPlot,
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'

export const width = 708
export const height = 452
export const alt =
    'Two equal-scale coordinate plots compare a=[0.5,0.5] and 2a=[1,1] with unit vector u=[1,0]. Both vectors point along the same 45-degree direction. The green segments just below the horizontal axes show projected lengths, and the dot products grow from 0.50 to 1.00 as the vector doubles in length, while cosine similarity stays 1 divided by square root of 2, about 0.707.'

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)

    const plot = (x: number, vector: [number, number]) =>
        CanvasItem({
            x,
            y: 76,
            width: 276,
            height: 252,
            children: AxisPlot({
                c,
                width: 252,
                height: 252,
                xMin: -0.16,
                xMax: 1.28,
                yMin: -0.16,
                yMax: 1.28,
                padding: 20,
                showGrid: true,
                showFrame: false,
                gridCount: 3,
                vectors: [
                    {
                        x1: 0,
                        y1: 0,
                        x2: 1,
                        y2: 0,
                        color: blue,
                        strokeWidth: 2,
                        arrow: true,
                        arrowSize: 4,
                    },
                    {
                        x1: 0,
                        y1: 0,
                        x2: vector[0],
                        y2: vector[1],
                        color: purple,
                        strokeWidth: 3,
                        arrow: true,
                        arrowSize: 4,
                    },
                ],
                paths: [
                    {
                        points: [
                            { x: vector[0], y: vector[1] },
                            { x: vector[0], y: -0.08 },
                        ],
                        color: c.textMuted,
                        dashed: true,
                        strokeWidth: 2,
                    },
                    {
                        points: [
                            { x: 0, y: -0.08 },
                            { x: vector[0], y: -0.08 },
                        ],
                        color: green,
                        strokeWidth: 5,
                    },
                ],
            }),
        })
    const title = (x: number, text: string) =>
        CanvasItem({
            x,
            y: 40,
            width: 290,
            height: 31,
            children: TextLabel({
                c,
                text,
                fontSize: 25,
                fontWeight: 800,
                color: c.textPrimary,
                align: 'center',
            }),
        })
    const result = (x: number, lhs: string, dot: string) => [
        CanvasItem({
            x,
            y: 334,
            width: 290,
            height: 31,
            children: TextLabel({
                c,
                text: `${lhs} · u = ${dot}`,
                fontSize: 25,
                fontWeight: 800,
                color: green,
                align: 'center',
            }),
        }),
        CanvasItem({
            x,
            y: 370,
            width: 290,
            height: 29,
            children: TextLabel({
                c,
                text: 'cos θ ≈ 0.707',
                fontSize: 25,
                color: c.textSecondary,
                align: 'center',
            }),
        }),
    ]

    return Scene({
        c,
        padding: 24,
        gap: 0,
        contentWidth: 660,
        children: Board({
            c,
            width: 660,
            height: 404,
            children: [
                CanvasItem({
                    x: 8,
                    y: 0,
                    width: 644,
                    height: 31,
                    children: TextLabel({
                        c,
                        text: 'u = [1, 0] · unit reference',
                        fontSize: 22,
                        color: blue,
                        align: 'center',
                    }),
                }),
                title(6, 'a = [0.5, 0.5]'),
                title(344, '2a = [1, 1]'),
                plot(18, [0.5, 0.5]),
                plot(356, [1, 1]),
                ...result(8, 'a', '0.50'),
                ...result(346, '2a', '1.00'),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
