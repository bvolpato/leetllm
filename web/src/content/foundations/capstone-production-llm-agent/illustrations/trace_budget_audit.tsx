import React from 'react'
import { BarChart, Column, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 640
export const height = 780
export const autoSize = false
export const alt =
    'Pre-execution budget enforcement on a five-step trajectory with a 900-token and 1200-millisecond ceiling. Steps 1 through 4 reach 850 tokens and 1080 milliseconds and run cleanly, whereas Step 5 would hit 1010 tokens and 1320 milliseconds and is aborted before dispatch.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 1.9)
    return Scene({
        c,
        padding: 12,
        gap: 10,
        contentWidth: 616,
        children: Column({
            gap: 10,
            children: [
                BarChart({
                    c,
                    width: 616,
                    height: 170,
                    title: 'Cumulative Token Consumption (Cap = 900 Tokens)',
                    subtitle:
                        'Pre-call check blocks Step 5 cleanly at 850 tokens before reaching 1010',
                    max: 1180,
                    showGrid: false,
                    showValues: true,
                    data: [
                        { label: 'S1', value: 170, valueLabel: '170', color: 'info' },
                        { label: 'S2', value: 380, valueLabel: '380', color: 'info' },
                        { label: 'S3', value: 660, valueLabel: '660', color: 'info' },
                        {
                            label: 'S4 Pass',
                            value: 850,
                            valueLabel: '850',
                            color: 'positive',
                        },
                        {
                            label: 'S5 Stop',
                            value: 1010,
                            valueLabel: '1010',
                            color: 'critical',
                        },
                    ],
                }),
                BarChart({
                    c,
                    width: 616,
                    height: 170,
                    title: 'Cumulative Latency Consumption (Cap = 1200 ms)',
                    subtitle:
                        'Step 4 completes at 1080 ms; Step 5 (1320 ms) aborts prior to execution',
                    max: 1560,
                    showGrid: false,
                    showValues: true,
                    data: [
                        { label: 'S1', value: 210, valueLabel: '210', color: 'info' },
                        { label: 'S2', value: 500, valueLabel: '500', color: 'info' },
                        { label: 'S3', value: 860, valueLabel: '860', color: 'info' },
                        {
                            label: 'S4 Pass',
                            value: 1080,
                            valueLabel: '1080',
                            color: 'positive',
                        },
                        {
                            label: 'S5 Stop',
                            value: 1320,
                            valueLabel: '1320',
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
