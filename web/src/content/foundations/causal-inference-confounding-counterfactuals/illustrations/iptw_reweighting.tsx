import React from 'react'
import {
    BarChart,
    KeyValueList,
    MetricCard,
    Panel,
    Row,
    Scene,
    StackedBar,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 600
export const height = 760
export const alt =
    'Inverse probability of treatment weighting (IPTW) on 200 logged queries. Observed arms are imbalanced (RAG: 10 short, 90 long; Base: 90 short, 10 long). Multiplying rare strata by 10 and common strata by 10/9 yields 100 weighted mass per stratum per arm (total weight 200, actual queries 100, effective sample size 36 per arm). Weighted pass rates become 70% vs 60% (+10 pp) on the logged 50/50 mix, matching the +10 pp target standardization gap.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 1.85)
    return (
        <Scene c={c} density={1.85} padding={12} gap={10} contentWidth={576}>
            <Panel
                c={c}
                title="1. Imbalanced counts and IPTW weights"
                tone="blue"
                width={576}
                padding={10}
                gap={8}
            >
                <Row gap={10}>
                    <StackedBar
                        c={c}
                        width={271}
                        height={24}
                        title="RAG: 10 short, 90 long"
                        showLegend={false}
                        segments={[
                            { label: 'S', value: 10, color: 'secondary', valueLabel: '10' },
                            { label: 'L', value: 90, color: 'warning', valueLabel: '90' },
                        ]}
                    />
                    <StackedBar
                        c={c}
                        width={271}
                        height={24}
                        title="Base: 90 short, 10 long"
                        showLegend={false}
                        segments={[
                            { label: 'S', value: 90, color: 'secondary', valueLabel: '90' },
                            { label: 'L', value: 10, color: 'warning', valueLabel: '10' },
                        ]}
                    />
                </Row>
                <KeyValueList
                    c={c}
                    width={552}
                    keyWidth={310}
                    rows={[
                        {
                            key: 'Propensity e(short), e(long)',
                            value: '0.10, 0.90',
                            tone: 'purple',
                        },
                        {
                            key: 'Weights (short, long): RAG / Base',
                            value: '10, 1.11 / 1.11, 10',
                            tone: 'blue',
                        },
                    ]}
                />
            </Panel>
            <Panel
                c={c}
                title="2. Reweighted pass rates and ESS collapse"
                tone="green"
                width={576}
                padding={10}
                gap={8}
            >
                <BarChart
                    c={c}
                    width={552}
                    height={145}
                    min={0}
                    format={(v) => `${Math.round(v)}%`}
                    showValues
                    data={[
                        { label: 'IPTW RAG', value: 70, color: 'positive', valueLabel: '70%' },
                        { label: 'IPTW Base', value: 60, color: 'secondary', valueLabel: '60%' },
                        { label: 'Std RAG', value: 78, color: 'positive', valueLabel: '78%' },
                        { label: 'Std Base', value: 68, color: 'secondary', valueLabel: '68%' },
                    ]}
                />
                <Row gap={8}>
                    <MetricCard
                        c={c}
                        width={178}
                        label="Actual n"
                        value="100"
                        detail="per arm"
                        tone="blue"
                    />
                    <MetricCard
                        c={c}
                        width={178}
                        label="Mass sum"
                        value="200"
                        detail="100 / tier"
                        tone="purple"
                    />
                    <MetricCard
                        c={c}
                        width={180}
                        label="Weight ESS"
                        value="36"
                        detail="per arm"
                        tone="warm"
                    />
                </Row>
            </Panel>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
