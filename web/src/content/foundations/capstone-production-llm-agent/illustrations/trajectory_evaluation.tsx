import React from 'react'
import { BarChart, Column, LineChart, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 640
export const height = 780
export const autoSize = false
export const alt =
    'Trajectory evaluation across 25 stochastic rollouts per scenario. Top line chart tracks unbiased pass@k under schema corruption from k=1 to k=5: guarded retry achieves 1.000 at pass@1 while single-shot rises from 0.280 at k=1 to 0.839 at k=5. Bottom bar chart shows mean steps per rollout: duplicate-call loop guarding halts stalled loops at 2.00 steps versus 5.00 steps unguarded.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 1.9)
    return Scene({
        c,
        padding: 12,
        gap: 12,
        contentWidth: 616,
        children: Column({
            gap: 14,
            children: [
                LineChart({
                    c,
                    width: 616,
                    height: 185,
                    title: 'Unbiased pass@k Under Schema Errors (n = 25 Rollouts)',
                    subtitle: 'Error-feedback retry repairs arguments to 1.000 on pass@1',
                    labels: ['k=1', 'k=2', 'k=3', 'k=4', 'k=5'],
                    min: 0.0,
                    max: 1.12,
                    showGrid: true,
                    showPoints: true,
                    directLabels: false,
                    yAxisLabel: 'pass@k',
                    series: [
                        {
                            name: 'Guarded Retry',
                            points: [1.0, 1.0, 1.0, 1.0, 1.0],
                            color: 'positive',
                        },
                        {
                            name: 'Single-Shot',
                            points: [0.28, 0.49, 0.645, 0.758, 0.839],
                            color: 'warning',
                        },
                    ],
                }),
                BarChart({
                    c,
                    width: 616,
                    height: 170,
                    title: 'Mean Steps Spent Across Scenarios (Cap = 5 Steps)',
                    subtitle: 'Loop guard stops duplicate stalls at 2.00 steps vs 5.00 unguarded',
                    max: 5.8,
                    showGrid: false,
                    showValues: true,
                    data: [
                        {
                            label: 'Clean Task',
                            value: 3.04,
                            valueLabel: '3.04',
                            color: 'info',
                        },
                        {
                            label: 'Schema Retry',
                            value: 2.72,
                            valueLabel: '2.72',
                            color: 'positive',
                        },
                        {
                            label: 'AB Stats',
                            value: 2.12,
                            valueLabel: '2.12',
                            color: 'positive',
                        },
                        {
                            label: 'Loop Guard',
                            value: 2.0,
                            valueLabel: '2.00',
                            color: 'positive',
                        },
                        {
                            label: 'No Guard Loop',
                            value: 5.0,
                            valueLabel: '5.00',
                            color: 'critical',
                        },
                    ],
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
