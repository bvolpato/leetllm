import React from 'react'
import {
    AxisPlot,
    BarChart,
    Card,
    Column,
    KeyValueList,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 620
export const height = 795
export const alt =
    'IVF coarse routing query at (2.8, 2.71) falls inside C1 because C1 at (4.5, 4.0) is distance 2.134 away versus 2.146 to C0. Scanning nprobe=1 misses true nearest neighbor fin_B in pruned C0 at distance 1.841; probing nprobe=2 recovers it.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 1.9)
    const docs = [
        { x: 1.0, y: 1.0, tone: 'blue' as const, r: 7 },
        { x: 1.2, y: 1.8, tone: 'blue' as const, r: 10, stroke: c.positive, strokeWidth: 3 },
        { x: 4.0, y: 4.2, tone: 'purple' as const, r: 7 },
        { x: 5.0, y: 3.8, tone: 'purple' as const, r: 7 },
        { x: 8.0, y: 1.0, tone: 'green' as const, r: 7 },
        { x: 9.0, y: 1.8, tone: 'green' as const, r: 7 },
    ]
    const centroids = [
        { x: 1.1, y: 1.4, tone: 'blue' as const, r: 9, stroke: c.textPrimary, strokeWidth: 2 },
        { x: 4.5, y: 4.0, tone: 'purple' as const, r: 9, stroke: c.textPrimary, strokeWidth: 2 },
        { x: 8.5, y: 1.4, tone: 'green' as const, r: 9, stroke: c.textPrimary, strokeWidth: 2 },
    ]
    const query = { x: 2.8, y: 2.71, fill: c.warning, r: 10, stroke: c.textPrimary, strokeWidth: 2 }

    return Scene({
        c,
        background: c.bg,
        padding: 18,
        children: Column({
            gap: 10,
            align: 'stretch',
            children: [
                Column({
                    gap: 4,
                    children: [
                        TextLabel({
                            c,
                            text: 'IVF Routing Near a Voronoi Border',
                            fontSize: 23,
                            fontWeight: 700,
                            color: c.textPrimary,
                        }),
                        TextLabel({
                            c,
                            text: 'Query (2.8, 2.71) routes to C1 while fin_B sits in C0.',
                            fontSize: 19,
                            color: c.textSecondary,
                        }),
                    ],
                }),
                Panel({
                    c,
                    title: 'Voronoi Bisector vs Exact Neighbor',
                    padding: 10,
                    children: Column({
                        gap: 4,
                        align: 'stretch',
                        children: [
                            AxisPlot({
                                c,
                                width: 562,
                                height: 120,
                                xMin: 0,
                                xMax: 10,
                                yMin: 0,
                                yMax: 5.2,
                                padding: 10,
                                showFrame: false,
                                showAxes: false,
                                showGrid: true,
                                gridCount: 4,
                                paths: [
                                    {
                                        points: [
                                            { x: 0.9, y: 5.18 },
                                            { x: 4.86, y: 0.0 },
                                        ],
                                        color: c.textSecondary,
                                        dashed: true,
                                        strokeWidth: 2.5,
                                    },
                                ],
                                vectors: [
                                    {
                                        x1: 2.8,
                                        y1: 2.71,
                                        x2: 4.5,
                                        y2: 4.0,
                                        tone: 'purple',
                                        strokeWidth: 3,
                                    },
                                    {
                                        x1: 2.8,
                                        y1: 2.71,
                                        x2: 1.2,
                                        y2: 1.8,
                                        tone: 'green',
                                        strokeWidth: 3.5,
                                    },
                                ],
                                points: [...docs, ...centroids, query],
                                ariaLabel:
                                    'Voronoi border between C0 and C1 relative to query and fin_B',
                            }),
                            Row({
                                justify: 'space-between',
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'Dashed: C0/C1 bisector',
                                        fontSize: 19,
                                        color: c.textSecondary,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Gold q -> green fin_B (1.84)',
                                        fontSize: 19,
                                        color: c.warning,
                                    }),
                                ],
                            }),
                        ],
                    }),
                }),
                BarChart({
                    c,
                    width: 584,
                    height: 125,
                    min: 0,
                    title: 'Distances from Query (2.8, 2.71)',
                    data: [
                        { label: 'fin_B (C0)', value: 1.841, color: 'positive' },
                        { label: 'C1 center', value: 2.134, color: 'violet' },
                        { label: 'C0 center', value: 2.146, color: 'warning' },
                    ],
                    format: 'decimal',
                    showGrid: false,
                    showValues: true,
                }),
                Card({
                    c,
                    padding: 10,
                    children: KeyValueList({
                        c,
                        rows: [
                            {
                                key: 'nprobe = 1',
                                value: 'Scans C1 · 5 dists · Recall@1 = 0',
                                tone: 'red',
                            },
                            {
                                key: 'nprobe = 2',
                                value: 'C1 + C0 · hits fin_B · 7 dists',
                                tone: 'green',
                            },
                            {
                                key: 'Flat scan',
                                value: 'All 6 docs · exact fin_B',
                                tone: 'neutral',
                            },
                        ],
                    }),
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
