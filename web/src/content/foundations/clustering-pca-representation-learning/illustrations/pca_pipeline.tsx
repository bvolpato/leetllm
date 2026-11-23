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
    'PCA on the six centered embeddings keeps 85.2% of total variance on PC1 along direction [1.00, -0.02] through mean (4.70, 2.27). Orthogonal residuals to the PC1 line sum to squared reconstruction error 9.72.'

const coords: ReadonlyArray<readonly [number, number]> = [
    [1.0, 1.0],
    [1.2, 1.8],
    [4.0, 4.2],
    [5.0, 3.8],
    [8.0, 1.0],
    [9.0, 1.8],
]
const meanX = coords.reduce((acc, p) => acc + p[0], 0) / coords.length
const meanY = coords.reduce((acc, p) => acc + p[1], 0) / coords.length
const pc1: readonly [number, number] = [0.99987, -0.01604]

const projected = coords.map(([x, y]) => {
    const score = (x - meanX) * pc1[0] + (y - meanY) * pc1[1]
    return [meanX + score * pc1[0], meanY + score * pc1[1]] as const
})

const linePoint = (x: number) => ({
    x,
    y: meanY + ((x - meanX) / pc1[0]) * pc1[1],
})

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 1.9)
    const residuals = coords.map(([x, y], i) => ({
        x1: x,
        y1: y,
        x2: projected[i][0],
        y2: projected[i][1],
        color: c.warning,
        strokeWidth: 2.5,
        opacity: 0.85,
    }))
    const points = [
        ...coords.map(([x, y]) => ({ x, y, tone: 'blue' as const, r: 8 })),
        ...projected.map(([x, y]) => ({ x, y, tone: 'green' as const, r: 6 })),
        { x: meanX, y: meanY, fill: c.warning, r: 9, stroke: c.textPrimary, strokeWidth: 2 },
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
                            text: 'PCA Compresses 2D Embeddings onto PC1',
                            fontSize: 23,
                            fontWeight: 700,
                            color: c.textPrimary,
                        }),
                        TextLabel({
                            c,
                            text: 'Maximizing projected variance minimizes orthogonal residual squares.',
                            fontSize: 19,
                            color: c.textSecondary,
                        }),
                    ],
                }),
                Panel({
                    c,
                    title: 'Centering and Orthogonal Projection',
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
                                paths: [
                                    {
                                        points: [linePoint(0.4), linePoint(9.6)],
                                        color: c.primaryLight,
                                        strokeWidth: 3.5,
                                    },
                                ],
                                vectors: residuals,
                                points,
                                ariaLabel: 'Orthogonal projections of six vectors onto PC1',
                            }),
                            Row({
                                justify: 'space-between',
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'Blue: data  Green: 1D proj',
                                        fontSize: 19,
                                        color: c.textSecondary,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Orange: residuals & mean',
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
                    height: 145,
                    min: 0,
                    title: 'Sample Covariance Variance Share (%)',
                    data: [
                        { label: 'PC1 Kept', value: 85.2, color: 'positive' },
                        { label: 'PC2 Dropped', value: 14.8, color: 'warning' },
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
                                key: 'Mean & PC1',
                                value: '[4.70, 2.27] · [1.00, -0.02]',
                                tone: 'cyan',
                            },
                            {
                                key: 'Eigenvalues',
                                value: 'lam1 = 11.182 · lam2 = 1.944',
                                tone: 'neutral',
                            },
                            {
                                key: '1-PC Error',
                                value: 'Squared residuals sum = 9.72',
                                tone: 'warm',
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
