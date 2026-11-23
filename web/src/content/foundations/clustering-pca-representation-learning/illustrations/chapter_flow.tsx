import React from 'react'
import {
    AxisPlot,
    BadgePill,
    Card,
    Column,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    withDensity,
} from 'vizmatic'
import type { ToneName } from 'vizmatic'

export const width = 620
export const height = 740
export const alt =
    'Scatter geometry of six two-dimensional corpus embeddings. Euclidean links pair finance vectors fin_A and fin_B at distance 0.82, vision vectors vis_A and vis_B at 1.08, and systems vectors sys_A and sys_B at 1.28, alongside each document excerpt.'

type Point = readonly [number, number]
interface GroupSpec {
    topic: string
    tone: ToneName
    pair: readonly [Point, Point]
    names: readonly [string, string]
    excerpt: string
}

const groups: GroupSpec[] = [
    {
        topic: 'Finance',
        tone: 'blue',
        pair: [
            [1.0, 1.0],
            [1.2, 1.8],
        ],
        names: ['fin_A', 'fin_B'],
        excerpt: 'Yields & bonds',
    },
    {
        topic: 'Vision',
        tone: 'purple',
        pair: [
            [4.0, 4.2],
            [5.0, 3.8],
        ],
        names: ['vis_A', 'vis_B'],
        excerpt: 'Residual & conv',
    },
    {
        topic: 'Systems',
        tone: 'green',
        pair: [
            [8.0, 1.0],
            [9.0, 1.8],
        ],
        names: ['sys_A', 'sys_B'],
        excerpt: 'Cache & warps',
    },
]

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 1.9)
    const links = groups.map((g) => ({
        x1: g.pair[0][0],
        y1: g.pair[0][1],
        x2: g.pair[1][0],
        y2: g.pair[1][1],
        tone: g.tone,
        strokeWidth: 4,
    }))
    const points = groups.flatMap((g) =>
        g.pair.map(([x, y]) => ({
            x,
            y,
            tone: g.tone,
            r: 8,
            stroke: c.bgCard,
            strokeWidth: 2,
        })),
    )

    return Scene({
        c,
        background: c.bg,
        padding: 18,
        children: Column({
            gap: 12,
            align: 'stretch',
            children: [
                Column({
                    gap: 4,
                    children: [
                        TextLabel({
                            c,
                            text: 'Geometric Neighbors in 2D Embedding Space',
                            fontSize: 23,
                            fontWeight: 700,
                            color: c.textPrimary,
                        }),
                        TextLabel({
                            c,
                            text: 'Euclidean distance pairs three themes before labels enter.',
                            fontSize: 19,
                            color: c.textSecondary,
                        }),
                    ],
                }),
                Panel({
                    c,
                    title: 'Six Corpus Vectors (x in [0, 10], y in [0, 5])',
                    padding: 12,
                    children: Column({
                        gap: 6,
                        align: 'stretch',
                        children: [
                            AxisPlot({
                                c,
                                width: 558,
                                height: 270,
                                xMin: 0,
                                xMax: 10,
                                yMin: 0,
                                yMax: 5.2,
                                padding: 18,
                                showFrame: false,
                                showAxes: false,
                                showGrid: true,
                                gridCount: 4,
                                vectors: links,
                                points,
                                ariaLabel: 'Six corpus vectors grouped into three nearest pairs',
                            }),
                            Row({
                                justify: 'space-between',
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'x = 0',
                                        fontSize: 19,
                                        color: c.textSecondary,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'x = 5',
                                        fontSize: 19,
                                        color: c.textSecondary,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'x = 10',
                                        fontSize: 19,
                                        color: c.textSecondary,
                                    }),
                                ],
                            }),
                        ],
                    }),
                }),
                Row({
                    gap: 10,
                    align: 'stretch',
                    children: groups.map((g) => {
                        const dist = Math.hypot(
                            g.pair[0][0] - g.pair[1][0],
                            g.pair[0][1] - g.pair[1][1],
                        )
                        return Card({
                            c,
                            width: 188,
                            tone: g.tone,
                            padding: 12,
                            children: Column({
                                gap: 6,
                                children: [
                                    BadgePill({ c, text: g.topic, tone: g.tone }),
                                    TextLabel({
                                        c,
                                        text: `d = ${dist.toFixed(2)}`,
                                        fontSize: 21,
                                        fontWeight: 700,
                                        color: c.textPrimary,
                                    }),
                                    TextLabel({
                                        c,
                                        text: `${g.names[0]}, ${g.names[1]}`,
                                        fontSize: 19,
                                        fontWeight: 600,
                                        color: c.textSecondary,
                                    }),
                                    TextLabel({
                                        c,
                                        text: g.excerpt,
                                        fontSize: 19,
                                        color: c.textSecondary,
                                    }),
                                ],
                            }),
                        })
                    }),
                }),
                TextLabel({
                    c,
                    text: 'Coordinate closeness suggests structure; reading text checks coherence.',
                    fontSize: 19,
                    color: c.textSecondary,
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
