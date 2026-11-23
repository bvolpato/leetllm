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
export const height = 790
export const alt =
    'Six observed latencies form groups near 30 and 90 milliseconds. A two-component Gaussian mixture has peaks at 30 and 90 ms, while a single Gaussian centered at the same pooled mean of 60 ms spreads across the gap. The pooled maximum-likelihood variance is 906.67 ms squared. A separate provisional model at 50 ms normalizes weighted densities 0.00605 and 0.00135 into responsibilities 0.818 and 0.182.'

const latencies = [28, 30, 32, 86, 90, 94]
const normal = (x: number, mean: number, variance: number) =>
    Math.exp(-((x - mean) ** 2) / (2 * variance)) / Math.sqrt(2 * Math.PI * variance)
const grid = Array.from({ length: 241 }, (_, i) => i * 0.5)
const pooled = grid.map((x) => ({ x, y: normal(x, 60, 906.67) }))
const mixture = grid.map((x) => ({
    x,
    y: 0.5 * normal(x, 30, 8 / 3) + 0.5 * normal(x, 90, 32 / 3),
}))

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 1.9)
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
                            text: 'One Mean, Two Peaks',
                            fontSize: 23,
                            fontWeight: 700,
                            color: c.textPrimary,
                        }),
                        TextLabel({
                            c,
                            text: 'Six latencies average 60 ms, but none is near 60.',
                            fontSize: 19,
                            color: c.textSecondary,
                        }),
                    ],
                }),
                Panel({
                    c,
                    title: 'Density Fits Over Latency (ms)',
                    padding: 10,
                    children: Column({
                        gap: 4,
                        align: 'stretch',
                        children: [
                            AxisPlot({
                                c,
                                width: 562,
                                height: 170,
                                xMin: 0,
                                xMax: 120,
                                yMin: 0,
                                yMax: 0.13,
                                padding: 12,
                                showFrame: false,
                                showAxes: false,
                                showGrid: true,
                                gridCount: 4,
                                paths: [
                                    { points: pooled, color: c.warning, strokeWidth: 3.5 },
                                    { points: mixture, color: c.primaryLight, strokeWidth: 3.5 },
                                ],
                                points: latencies.map((x) => ({
                                    x,
                                    y: 0.006,
                                    tone: 'green' as const,
                                    r: 7,
                                })),
                                ariaLabel: 'Pooled Gaussian and two-component mixture over latency',
                            }),
                            Row({
                                justify: 'space-between',
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'Blue: mixture',
                                        fontSize: 19,
                                        color: c.primaryLight,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Orange: single Gaussian',
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
                    height: 150,
                    min: 0,
                    title: 'Responsibility of a 50 ms Request (%)',
                    data: [
                        { label: 'Fast peak', value: 81.8, color: 'primary' },
                        { label: 'Slow peak', value: 18.2, color: 'warning' },
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
                                key: 'Single fit',
                                value: 'mean 60 · var 906.67',
                                tone: 'warm',
                            },
                            {
                                key: 'Mixture',
                                value: 'means 30, 90 ms',
                                tone: 'blue',
                            },
                            {
                                key: 'At 50 ms',
                                value: '0.00605 · 0.00135',
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
