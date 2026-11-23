import React from 'react'
import {
    BarChart,
    Flow,
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
    'Temporal issuance timeline across January 2026: Jan 12-25 builds the empirical +/-3 error band from 14 prior errors, Jan 23 records 132 baseline jobs, Jan 29 issues the Friday forecast [129, 132, 135] before observation, and Jan 30 observes 160 jobs for a +28 error above the 3-job half-width.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 1.85)
    return (
        <Scene c={c} density={1.85} padding={12} gap={10} contentWidth={576}>
            <Panel
                c={c}
                title="1. Issuance clock: past -> forecast -> observe"
                tone="blue"
                width={576}
                padding={10}
                gap={8}
            >
                <Flow
                    c={c}
                    direction="horizontal"
                    gap={6}
                    connectorLength={16}
                    connectorTone="blue"
                    stages={[
                        {
                            eyebrow: 'JAN 12-25',
                            title: '+/-3',
                            lines: ['14 prior errors'],
                            tone: 'blue',
                            width: 162,
                            padding: 10,
                        },
                        {
                            eyebrow: 'JAN 29',
                            title: '132',
                            lines: ['Lag Jan 23 (132)'],
                            tone: 'purple',
                            width: 162,
                            padding: 10,
                        },
                        {
                            eyebrow: 'JAN 30',
                            title: '160',
                            lines: ['+28 -> Review'],
                            tone: 'critical',
                            width: 162,
                            padding: 10,
                        },
                    ]}
                />
            </Panel>
            <Panel
                c={c}
                title="2. Friday band [129, 135] vs observed 160"
                tone="critical"
                width={576}
                padding={10}
                gap={6}
            >
                <BarChart
                    c={c}
                    width={552}
                    height={145}
                    min={0}
                    max={180}
                    format={(v) => String(Math.round(v))}
                    showValues
                    data={[
                        { label: 'Band low', value: 129, color: 'neutral', valueLabel: '129' },
                        { label: 'Forecast', value: 132, color: 'primary', valueLabel: '132' },
                        { label: 'Band high', value: 135, color: 'neutral', valueLabel: '135' },
                        {
                            label: 'Actual Jan 30',
                            value: 160,
                            color: 'critical',
                            valueLabel: '160',
                        },
                    ]}
                />
            </Panel>
            <Row gap={10}>
                <MetricCard
                    c={c}
                    width={283}
                    label="Calibration band"
                    value="132 +/- 3"
                    detail="Issued prior to Jan 30"
                    tone="blue"
                />
                <MetricCard
                    c={c}
                    width={283}
                    label="Holdout residual"
                    value="+28 jobs"
                    detail="Exceeds +/-3 cutoff"
                    tone="critical"
                />
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
