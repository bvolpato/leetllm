import React from 'react'
import { BarChart, Column, LineChart, Scene, defineIllustration } from 'vizmatic'
import { prepareArticleFigure } from '../../../../../tools/illustrations/lib/presentation'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const width = 620
export const height = 760
export const preset = 'engineering'
export const alt =
    'Cost comparison over 10,000 queries showing $40 fresh baseline versus $17.94 cached routing, paired with mean versus p95 tail latency across cache hit ratios.'

const illustration = defineIllustration((c) => {
    const costBars = preparePrintTypography(
        prepareArticleFigure(
            BarChart({
                c,
                width: 550,
                height: 290,
                title: '10,000-Query Spend Comparison ($)',
                min: 0,
                max: 45,
                showGrid: true,
                showValues: false,
                format: (v) => `$${Math.round(v)}`,
                data: [
                    { label: 'FreshAll', value: 40.0, color: 'critical' },
                    { label: 'Hit57%', value: 17.94, color: 'info' },
                    { label: 'Hit80%', value: 8.8, color: 'positive' },
                    { label: 'Lookup', value: 0.8, color: 'violet' },
                    { label: 'Saved', value: 22.06, color: 'positive' },
                ],
            }),
            false,
            false,
        ),
        19,
    )

    const latencyCurve = preparePrintTypography(
        prepareArticleFigure(
            LineChart({
                c,
                width: 550,
                height: 295,
                title: 'Mean vs p95 Latency (ms) Across Cache Hit Rate',
                min: 0,
                max: 1150,
                showGrid: true,
                showPoints: true,
                directLabels: false,
                format: (v) => String(Math.round(v)),
                labels: ['0%', '25%', '57%', '80%', '94%', '96%'],
                series: [
                    {
                        name: 'p95 Latency (ms)',
                        points: [1000, 1020, 1020, 1020, 1020, 30],
                        color: 'warning',
                    },
                    {
                        name: 'Mean Latency (ms)',
                        points: [1000, 770, 449, 230, 89, 69],
                        color: 'positive',
                        area: true,
                    },
                ],
            }),
            false,
            false,
        ),
        19,
    )

    return (
        <Scene
            c={c}
            title="Cache Economics and Tail Latency Inertia"
            subtitle="Mean latency drops linearly with hit rate while p95 stays at miss speed until safe hits top 95%"
            padding={16}
            gap={14}
        >
            <Column style={{ paddingLeft: 14 }}>{costBars}</Column>
            <Column style={{ paddingLeft: 14 }}>{latencyCurve}</Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
