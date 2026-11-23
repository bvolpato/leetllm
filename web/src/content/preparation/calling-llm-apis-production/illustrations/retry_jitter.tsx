import React from 'react'
import {
    BarChart,
    Column,
    LineChart,
    Panel,
    Scene,
    defineIllustration,
    getReadableToneColor,
    withDensity,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 640
export const height = 740
export const alt =
    'Top chart compares synchronized backoff against full jitter across 12 workers in 0.5-second buckets: fixed delays spike 12 workers simultaneously at 1.0s and 3.0s while full jitter spreads retries to 1 to 3 workers per window. Bottom chart compares remaining 1.8s task budget against a 2.0s Retry-After floor, 0.4s jitter, and 1.5s call duration totaling 3.9s.'

const illustration = defineIllustration((raw: ThemeColors) => {
    const c = withDensity(raw, 1.95)
    const warm = getReadableToneColor('warm', c)
    return (
        <Scene c={c} padding={12} gap={12}>
            <Column gap={12} align="stretch">
                <Panel
                    c={c}
                    title="Fixed Backoff Collision vs. Full Jitter"
                    width={616}
                    padding={12}
                    tone="purple"
                >
                    <LineChart
                        c={c}
                        width={588}
                        height={186}
                        subtitle="12 concurrent workers retrying over a 3.5 s horizon"
                        labels={['0.5s', '1.0s', '1.5s', '2.0s', '2.5s', '3.0s', '3.5s']}
                        min={0}
                        max={13}
                        yAxisLabel="Workers"
                        directLabels
                        showPoints
                        format="integer"
                        series={[
                            { name: 'Fixed', points: [0, 12, 0, 0, 0, 12, 0], color: 'critical' },
                            {
                                name: 'Jitter',
                                points: [3, 2, 2, 2, 1, 1, 1],
                                color: 'green',
                                area: true,
                            },
                        ]}
                    />
                </Panel>
                <Panel
                    c={c}
                    title="Retry-After vs. Remaining Deadline"
                    width={616}
                    padding={12}
                    tone="neutral"
                >
                    <BarChart
                        c={c}
                        width={588}
                        height={186}
                        subtitle="Stop retrying when floor + jitter + call exceeds budget"
                        min={0}
                        max={4.5}
                        yAxisLabel="Seconds"
                        showValues
                        data={[
                            { label: 'Budget', value: 1.8, color: 'green' },
                            { label: 'Floor', value: 2.0, color: warm },
                            { label: 'Jitter', value: 0.4, color: 'blue' },
                            { label: 'Call', value: 1.5, color: 'purple' },
                            { label: 'Needed', value: 3.9, color: 'critical' },
                        ]}
                    />
                </Panel>
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
