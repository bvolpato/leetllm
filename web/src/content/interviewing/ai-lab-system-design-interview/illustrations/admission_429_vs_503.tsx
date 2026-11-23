import React from 'react'
import {
    BarChart,
    Column,
    LineChart,
    Panel,
    Scene,
    defineIllustration,
    withDensity,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 660
export const height = 760
export const alt =
    'Dual chart comparing unbounded queueing versus load shedding at a 0.25-second TTFT limit. On the top line chart, p95 wait in an unbounded queue rises past 0.25 s above 85% load up to 0.56 s at 98% utilization, whereas load shedding caps accepted waits below 0.24 s by fast-failing excess callers with 503. On the bottom bar chart for a 125k tok/s cluster, caller RPM exhaustion returns 429 before queueing (0.00 s wait), 20k queued tokens clear at 0.16 s, 31.25k hits the 0.25 s SLO cap, and 50k fails with 503 at 0.40 s.'

const illustration = defineIllustration((raw: ThemeColors) => {
    const c = withDensity(raw, 1.95)

    return (
        <Scene c={c} padding={12} gap={12}>
            <Column gap={12} align="stretch">
                <Panel
                    c={c}
                    title="Queue Wait Across Fleet Load"
                    width={636}
                    padding={12}
                    tone="blue"
                >
                    <LineChart
                        c={c}
                        width={608}
                        height={190}
                        subtitle="Load shedding protects accepted p95 wait under the 0.25 s SLO budget"
                        labels={['60%', '70%', '80%', '88%', '94%', '98%']}
                        min={0}
                        max={0.62}
                        yAxisLabel="Wait p95 (s)"
                        directLabels
                        showPoints
                        format="decimal"
                        series={[
                            {
                                name: 'Unbounded',
                                points: [0.06, 0.09, 0.15, 0.27, 0.41, 0.56],
                                color: 'critical',
                                area: true,
                            },
                            {
                                name: 'Shed >0.25s',
                                points: [0.06, 0.09, 0.15, 0.21, 0.23, 0.24],
                                color: 'green',
                            },
                        ]}
                    />
                </Panel>
                <Panel
                    c={c}
                    title="429 Caller Limit vs 503 Queue Cap"
                    width={636}
                    padding={12}
                    tone="purple"
                >
                    <BarChart
                        c={c}
                        width={608}
                        height={190}
                        subtitle="125k tok/s cluster: caller RPM fails fast before queueing; backlog enforces SLO"
                        min={0}
                        max={0.48}
                        yAxisLabel="Wait (s)"
                        format="decimal"
                        showValues
                        data={[
                            { label: 'RPM 429', value: 0.0, color: 'warm' },
                            { label: '20k OK', value: 0.16, color: 'green' },
                            { label: 'SLO cap', value: 0.25, color: 'blue' },
                            { label: '50k 503', value: 0.4, color: 'critical' },
                        ]}
                    />
                </Panel>
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
