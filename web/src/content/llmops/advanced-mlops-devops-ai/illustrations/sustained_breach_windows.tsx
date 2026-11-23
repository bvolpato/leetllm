import React from 'react'
import { BarChart, Column, LineChart, Scene, defineIllustration } from 'vizmatic'
import { prepareArticleFigure } from '../../../../../tools/illustrations/lib/presentation'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const width = 620
export const height = 760
export const preset = 'engineering'
export const alt =
    'Seven consecutive five-minute p95 TTFT windows showing streak reset at W3=800ms before latching rollback at W6, paired with multi-signal arbitration across rollback, pause, and pass checks.'

const illustration = defineIllustration((c) => {
    const streak = preparePrintTypography(
        prepareArticleFigure(
            LineChart({
                c,
                width: 550,
                height: 295,
                title: '5-Min p95 TTFT (ms): Clean W3 Resets Streak; W6 Triggers Rollback',
                min: 750,
                max: 960,
                showGrid: true,
                showPoints: true,
                directLabels: false,
                format: (v) => String(Math.round(v)),
                labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'],
                series: [
                    {
                        name: 'Observed TTFT (ms)',
                        points: [920, 910, 800, 901, 902, 903, 780],
                        color: 'info',
                        area: true,
                    },
                    {
                        name: '850ms Limit',
                        points: [850, 850, 850, 850, 850, 850, 850],
                        color: 'critical',
                    },
                ],
            }),
            false,
            false,
        ),
        19,
    )

    const arb = preparePrintTypography(
        prepareArticleFigure(
            BarChart({
                c,
                width: 550,
                height: 280,
                title: 'Metric Arbitration Normalized to Limit (100% = Breach)',
                min: 0,
                max: 120,
                showGrid: true,
                showValues: false,
                format: (v) => `${Math.round(v)}%`,
                data: [
                    { label: 'TTFT', value: 107, color: 'critical' },
                    { label: 'Ground', value: 104, color: 'warning' },
                    { label: 'Comp', value: 93, color: 'positive' },
                    { label: 'Toxic', value: 20, color: 'info' },
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
            title="Sustained Breach Streaks and Metric Arbitration"
            subtitle="Transient dips reset the consecutive failure counter, while multi-metric arbitration prioritizes rollback over pause"
            padding={16}
            gap={14}
        >
            <Column style={{ paddingLeft: 14 }}>{streak}</Column>
            <Column style={{ paddingLeft: 14 }}>{arb}</Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
