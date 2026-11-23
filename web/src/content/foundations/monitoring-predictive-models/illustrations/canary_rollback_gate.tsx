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
    'A simulated release routes five of one hundred stable hash buckets, covering 48 of 1,000 sample jobs, to candidate v4. Fast canary metrics over 500 requests use 40% of the error limit (0.2% vs 0.5%), 88% of the latency budget (44 ms vs 50 ms), and 90% of the queue budget (72% vs 80%), passing promotion to v4. Later, 500 mature rows record 10 false positives at cost 2 and 2 false negatives at cost 10, totaling 40 cost units or 80 per 1,000 above the 50 limit, rolling back to job-risk-v3.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 1.85)
    return (
        <Scene c={c} density={1.85} padding={12} gap={10} contentWidth={576}>
            <Panel
                c={c}
                title="1. Release path: canary -> promote -> delayed revert"
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
                            eyebrow: '5% BUCKETS',
                            title: '48 / 1k',
                            lines: ['Stable hash'],
                            tone: 'blue',
                            width: 162,
                            padding: 10,
                        },
                        {
                            eyebrow: 'FAST GATE',
                            title: 'v3 -> v4',
                            lines: ['500 reqs ok'],
                            tone: 'green',
                            width: 162,
                            padding: 10,
                        },
                        {
                            eyebrow: 'MATURE GATE',
                            title: 'v4 -> v3',
                            lines: ['80/1k > 50/1k'],
                            tone: 'critical',
                            width: 162,
                            padding: 10,
                        },
                    ]}
                />
            </Panel>
            <Panel
                c={c}
                title="2. Fast canary budget usage (% of cutoff)"
                tone="purple"
                width={576}
                padding={10}
                gap={6}
            >
                <BarChart
                    c={c}
                    width={552}
                    height={115}
                    min={0}
                    format={(v) => `${Math.round(v)}%`}
                    showValues
                    data={[
                        { label: 'Err 0.2/0.5%', value: 40, color: 'positive', valueLabel: '40%' },
                        { label: 'p95 44/50ms', value: 88, color: 'primary', valueLabel: '88%' },
                        { label: 'Queue 72/80%', value: 90, color: 'warning', valueLabel: '90%' },
                    ]}
                />
            </Panel>
            <Row gap={10}>
                <MetricCard
                    c={c}
                    width={283}
                    label="500 mature rows"
                    value="80 / 1k"
                    detail="10 FP(2) + 2 FN(10)"
                    tone="critical"
                />
                <MetricCard
                    c={c}
                    width={283}
                    label="Rollback (limit 50/1k)"
                    value="v3"
                    detail="job-risk-v3 restored"
                    tone="warm"
                />
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
