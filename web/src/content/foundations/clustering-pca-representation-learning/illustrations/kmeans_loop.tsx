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
import type { ToneName } from 'vizmatic'

export const width = 620
export const height = 795
export const alt =
    'One Lloyd k-means iteration on the six corpus vectors. Initial seeds at (1.0, 1.0), (4.0, 4.2), and (8.0, 1.0) attract pairs fin_A/fin_B, vis_A/vis_B, and sys_A/sys_B, then update to centroids (1.1, 1.4), (4.5, 4.0), and (8.5, 1.4), dropping inertia from 3.48 to 1.74.'

interface ClusterStep {
    label: string
    tone: ToneName
    seed: readonly [number, number]
    center: readonly [number, number]
    members: readonly [readonly [number, number], readonly [number, number]]
    summary: string
}

const clusters: ClusterStep[] = [
    {
        label: 'C0 Finance',
        tone: 'blue',
        seed: [1.0, 1.0],
        center: [1.1, 1.4],
        members: [
            [1.0, 1.0],
            [1.2, 1.8],
        ],
        summary: '[1.1, 1.4]  (fin_A, fin_B)',
    },
    {
        label: 'C1 Vision',
        tone: 'purple',
        seed: [4.0, 4.2],
        center: [4.5, 4.0],
        members: [
            [4.0, 4.2],
            [5.0, 3.8],
        ],
        summary: '[4.5, 4.0]  (vis_A, vis_B)',
    },
    {
        label: 'C2 Systems',
        tone: 'green',
        seed: [8.0, 1.0],
        center: [8.5, 1.4],
        members: [
            [8.0, 1.0],
            [9.0, 1.8],
        ],
        summary: '[8.5, 1.4]  (sys_A, sys_B)',
    },
]

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 1.9)
    const memberLinks = clusters.flatMap((cl) =>
        cl.members.map(([x, y]) => ({
            x1: x,
            y1: y,
            x2: cl.center[0],
            y2: cl.center[1],
            tone: cl.tone,
            strokeWidth: 2.5,
            opacity: 0.65,
        })),
    )
    const seedShifts = clusters.map((cl) => ({
        x1: cl.seed[0],
        y1: cl.seed[1],
        x2: cl.center[0],
        y2: cl.center[1],
        color: c.warning,
        strokeWidth: 3.5,
        arrow: true,
        arrowSize: 8,
    }))
    const points = [
        ...clusters.flatMap((cl) =>
            cl.members.map(([x, y]) => ({
                x,
                y,
                tone: cl.tone,
                r: 7,
                opacity: 0.85,
            })),
        ),
        ...clusters.map((cl) => ({
            x: cl.center[0],
            y: cl.center[1],
            tone: cl.tone,
            r: 10,
            stroke: c.textPrimary,
            strokeWidth: 2.5,
        })),
    ]

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
                            text: "Lloyd's Update: Seeds Shift to Cluster Means",
                            fontSize: 23,
                            fontWeight: 700,
                            color: c.textPrimary,
                        }),
                        TextLabel({
                            c,
                            text: 'Assign to nearest centers, then average each group into a new center.',
                            fontSize: 19,
                            color: c.textSecondary,
                        }),
                    ],
                }),
                Panel({
                    c,
                    title: 'Centroid Movement (1st Iteration)',
                    padding: 10,
                    children: Column({
                        gap: 4,
                        align: 'stretch',
                        children: [
                            AxisPlot({
                                c,
                                width: 562,
                                height: 140,
                                xMin: 0,
                                xMax: 10,
                                yMin: 0,
                                yMax: 5.2,
                                padding: 12,
                                showFrame: false,
                                showAxes: false,
                                showGrid: true,
                                gridCount: 4,
                                vectors: [...memberLinks, ...seedShifts],
                                points,
                                ariaLabel: 'Seed shifts to updated cluster centroids',
                            }),
                            Row({
                                justify: 'space-between',
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'Arrows: seed -> mean',
                                        fontSize: 19,
                                        color: c.warning,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Ringed dots: updated means',
                                        fontSize: 19,
                                        color: c.textSecondary,
                                    }),
                                ],
                            }),
                        ],
                    }),
                }),
                BarChart({
                    c,
                    width: 584,
                    height: 145,
                    min: 0,
                    title: 'Within-Cluster Inertia J (Squared Distance Sum)',
                    data: [
                        { label: 'Initial Seeds', value: 3.48, color: 'warning' },
                        { label: 'After Mean Update', value: 1.74, color: 'positive' },
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
                        rows: clusters.map((cl) => ({
                            key: cl.label,
                            value: cl.summary,
                            tone: cl.tone,
                        })),
                    }),
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
