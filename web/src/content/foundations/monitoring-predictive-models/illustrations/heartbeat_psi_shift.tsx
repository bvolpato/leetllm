import React from 'react'
import {
    BarChart,
    MetricCard,
    Panel,
    Row,
    Scene,
    StackedBar,
    TextLabel,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 640
export const height = 790
export const alt =
    'Comparison of two 100-request heartbeat-age windows across fixed buckets 0-4h, 4-12h, 12-24h, and 24h+. Reference shares 50%, 30%, 15%, and 5% shift to current shares 30%, 25%, 25%, and 20%. Per-bucket PSI terms are 0.102, 0.009, 0.051, and 0.208, summing to 0.370 above the 0.20 inspection cutoff, with the 24h+ bucket driving 56% of total divergence.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 1.85)
    return (
        <Scene c={c} density={1.85} padding={10} gap={8} contentWidth={576}>
            <Panel
                c={c}
                title="1. Heartbeat age windows (100 requests each)"
                tone="blue"
                width={576}
                padding={8}
                gap={4}
            >
                <TextLabel
                    c={c}
                    text="Reference window e (historical baseline)"
                    variant="small"
                    color={c.textSecondary}
                />
                <StackedBar
                    c={c}
                    width={552}
                    height={20}
                    showLegend
                    segments={[
                        { label: '0-4h', value: 50, color: 'primary' },
                        { label: '4-12h', value: 30, color: 'positive' },
                        { label: '12-24h', value: 15, color: 'warning' },
                        { label: '24h+', value: 5, color: 'critical' },
                    ]}
                />
                <TextLabel
                    c={c}
                    text="Current window a (live accepted requests)"
                    variant="small"
                    color={c.textSecondary}
                />
                <StackedBar
                    c={c}
                    width={552}
                    height={20}
                    showLegend
                    segments={[
                        { label: '0-4h', value: 30, color: 'primary' },
                        { label: '4-12h', value: 25, color: 'positive' },
                        { label: '12-24h', value: 25, color: 'warning' },
                        { label: '24h+', value: 20, color: 'critical' },
                    ]}
                />
            </Panel>
            <Panel
                c={c}
                title="2. Per-bucket PSI = (a - e) ln(a / e)"
                tone="critical"
                width={576}
                padding={8}
                gap={4}
            >
                <BarChart
                    c={c}
                    width={552}
                    height={112}
                    min={0}
                    max={0.3}
                    format={(v) => v.toFixed(2)}
                    showValues
                    data={[
                        { label: '0-4h', value: 0.102, color: 'primary', valueLabel: '0.102' },
                        { label: '4-12h', value: 0.009, color: 'positive', valueLabel: '0.009' },
                        { label: '12-24h', value: 0.051, color: 'warning', valueLabel: '0.051' },
                        { label: '24h+', value: 0.208, color: 'critical', valueLabel: '0.208' },
                    ]}
                />
                <Row gap={10}>
                    <MetricCard
                        c={c}
                        width={271}
                        label="Total PSI (cutoff 0.20)"
                        value="0.370"
                        detail="inspect shift"
                        tone="critical"
                    />
                    <MetricCard
                        c={c}
                        width={271}
                        label="24h+ bucket share"
                        value="56%"
                        detail="0.208 of 0.370"
                        tone="warm"
                    />
                </Row>
            </Panel>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
