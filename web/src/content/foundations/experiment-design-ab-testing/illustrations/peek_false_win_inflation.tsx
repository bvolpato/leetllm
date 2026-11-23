import React from 'react'
import {
    BarChart,
    LineChart,
    MetricCard,
    Panel,
    Row,
    Scene,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 600
export const height = 760
export const alt =
    'A/A peeking simulation across 5,000 null trials: Trial 11 crosses z = +1.96 at look 4 (z = 2.58) yet finishes at look 20 inside the cutoff (z = 1.61). Across 5,000 trials, checking once at the end gives 231 false positives (4.6%), while stopping at first crossing across 5, 10, or 20 looks inflates false wins to 708 (14.2%), 961 (19.2%), and 1,244 (24.9%).'

const z = [
    0.28, 1.11, 1.57, 2.58, 2.05, 2.35, 2.45, 2.4, 2.21, 2.27, 1.78, 2.12, 2.15, 2.19, 2.08, 1.83,
    2.27, 2.07, 1.91, 1.61,
]
const labels = [
    '1',
    '',
    '',
    '',
    '5',
    '',
    '',
    '',
    '',
    '10',
    '',
    '',
    '',
    '',
    '15',
    '',
    '',
    '',
    '',
    '20',
]

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 1.85)
    return (
        <Scene c={c} density={1.85} padding={10} gap={8} contentWidth={580}>
            <Panel
                c={c}
                title="1. Trial #11 null z-trajectory: peek crosses +1.96 at look 4"
                tone="blue"
                width={580}
                padding={8}
                gap={6}
            >
                <LineChart
                    c={c}
                    width={560}
                    height={150}
                    labels={labels}
                    min={-2.5}
                    max={3.0}
                    showPoints={false}
                    directLabels
                    format={(v) => v.toFixed(1)}
                    series={[
                        { name: 'z-score', points: z, color: 'primary' },
                        { name: '+1.96', points: Array(20).fill(1.96), color: 'critical' },
                    ]}
                />
            </Panel>
            <Panel
                c={c}
                title="2. False-win rate out of 5,000 A/A trials by peeking count"
                tone="critical"
                width={580}
                padding={8}
                gap={6}
            >
                <BarChart
                    c={c}
                    width={560}
                    height={135}
                    min={0}
                    max={30}
                    format={(v) => `${Math.round(v)}%`}
                    showValues
                    data={[
                        {
                            label: '1 look',
                            value: 4.6,
                            color: 'positive',
                            valueLabel: '4.6%',
                        },
                        {
                            label: '5 looks',
                            value: 14.2,
                            color: 'warning',
                            valueLabel: '14.2%',
                        },
                        {
                            label: '10 looks',
                            value: 19.2,
                            color: 'warning',
                            valueLabel: '19.2%',
                        },
                        {
                            label: '20 looks',
                            value: 24.9,
                            color: 'critical',
                            valueLabel: '24.9%',
                        },
                    ]}
                />
                <Row gap={8}>
                    <MetricCard
                        c={c}
                        width={276}
                        label="Planned final look"
                        value="231 / 5k"
                        detail="4.6% (near 5% alpha)"
                        tone="green"
                    />
                    <MetricCard
                        c={c}
                        width={276}
                        label="Stop at any of 20 peeks"
                        value="1,244 / 5k"
                        detail="24.9% false-win rate"
                        tone="critical"
                    />
                </Row>
            </Panel>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
