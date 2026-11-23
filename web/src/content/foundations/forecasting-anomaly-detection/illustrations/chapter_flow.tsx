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
    'Holdout week batch-job counts from Monday Jan 26 through Sunday Feb 1 comparing same-weekday forecasts [104, 110, 119, 116, 132, 83, 78] against observed counts [103, 113, 117, 117, 160, 84, 77]. Absolute errors [1, 3, 2, 1, 28, 1, 1] show six normal days at or below the +/-3 calibration band and Friday jumping +28 jobs outside it.'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 1.85)
    return (
        <Scene c={c} density={1.85} padding={10} gap={8} contentWidth={580}>
            <Panel
                c={c}
                title="1. Holdout week: forecast vs observed batch jobs"
                tone="blue"
                width={580}
                padding={8}
                gap={6}
            >
                <LineChart
                    c={c}
                    width={560}
                    height={155}
                    labels={days}
                    min={70}
                    max={170}
                    showPoints
                    directLabels
                    format={(v) => String(Math.round(v))}
                    series={[
                        {
                            name: 'Forecast',
                            points: [104, 110, 119, 116, 132, 83, 78],
                            color: 'primary',
                        },
                        {
                            name: 'Observed',
                            points: [103, 113, 117, 117, 160, 84, 77],
                            color: 'critical',
                        },
                    ]}
                />
            </Panel>
            <Panel
                c={c}
                title="2. Error magnitude |actual - forecast| (band = 3)"
                tone="critical"
                width={580}
                padding={8}
                gap={6}
            >
                <BarChart
                    c={c}
                    width={560}
                    height={145}
                    min={0}
                    max={30}
                    format={(v) => String(Math.round(v))}
                    showValues
                    data={[
                        { label: 'Mon', value: 1, color: 'positive', valueLabel: '-1' },
                        { label: 'Tue', value: 3, color: 'positive', valueLabel: '+3' },
                        { label: 'Wed', value: 2, color: 'positive', valueLabel: '-2' },
                        { label: 'Thu', value: 1, color: 'positive', valueLabel: '+1' },
                        { label: 'Fri', value: 28, color: 'critical', valueLabel: '+28' },
                        { label: 'Sat', value: 1, color: 'positive', valueLabel: '+1' },
                        { label: 'Sun', value: 1, color: 'positive', valueLabel: '-1' },
                    ]}
                />
                <Row gap={8}>
                    <MetricCard
                        c={c}
                        width={276}
                        label="Normal days (6 of 7)"
                        value="<= 3"
                        detail="Normal-day MAE 1.5 jobs"
                        tone="green"
                    />
                    <MetricCard
                        c={c}
                        width={276}
                        label="Fri Jan 30 (launch_event)"
                        value="+28 jobs"
                        detail="160 obs vs 132 forecast"
                        tone="critical"
                    />
                </Row>
            </Panel>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
