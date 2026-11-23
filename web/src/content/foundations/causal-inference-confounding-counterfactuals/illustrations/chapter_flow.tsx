import React from 'react'
import {
    BarChart,
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
    'Simpson reversal in query routing: the RAG policy leads inside short-context queries (90% vs 80%, +10 pp) and long-context queries (50% vs 40%, +10 pp). Because RAG receives 90% long-context queries while Base receives 90% short-context queries, the raw aggregate flips to 54% vs 76% (-22 pp). Standardizing both arms to a 70% short / 30% long target distribution restores 78% vs 68% (+10 pp).'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 1.85)
    return (
        <Scene c={c} density={1.85} padding={12} gap={10} contentWidth={576}>
            <Panel
                c={c}
                title="1. Stratified pass rates and traffic mix"
                tone="blue"
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
                        { label: 'Short RAG', value: 90, color: 'positive', valueLabel: '9/10' },
                        { label: 'Short Base', value: 80, color: 'secondary', valueLabel: '72/90' },
                        { label: 'Long RAG', value: 50, color: 'positive', valueLabel: '45/90' },
                        { label: 'Long Base', value: 40, color: 'secondary', valueLabel: '4/10' },
                    ]}
                />
                <Row gap={10}>
                    <StackedBar
                        c={c}
                        width={271}
                        height={24}
                        title="RAG: 10% short, 90% long"
                        showLegend={false}
                        segments={[
                            { label: 'S', value: 10, color: 'primary', valueLabel: '10' },
                            { label: 'L', value: 90, color: 'warning', valueLabel: '90' },
                        ]}
                    />
                    <StackedBar
                        c={c}
                        width={271}
                        height={24}
                        title="Base: 90% short, 10% long"
                        showLegend={false}
                        segments={[
                            { label: 'S', value: 90, color: 'primary', valueLabel: '90' },
                            { label: 'L', value: 10, color: 'warning', valueLabel: '10' },
                        ]}
                    />
                </Row>
            </Panel>
            <Panel
                c={c}
                title="2. Raw aggregate vs 70/30 target"
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
                        { label: 'Raw RAG', value: 54, color: 'critical', valueLabel: '54%' },
                        { label: 'Raw Base', value: 76, color: 'secondary', valueLabel: '76%' },
                        { label: '70/30 RAG', value: 78, color: 'positive', valueLabel: '78%' },
                        { label: '70/30 Base', value: 68, color: 'secondary', valueLabel: '68%' },
                    ]}
                />
                <Row gap={10}>
                    <MetricCard
                        c={c}
                        width={271}
                        label="Raw log gap"
                        value="-22 pp"
                        detail="54% vs 76% pooled"
                        tone="critical"
                    />
                    <MetricCard
                        c={c}
                        width={271}
                        label="Target 70/30 gap"
                        value="+10 pp"
                        detail="78% vs 68% balanced"
                        tone="green"
                    />
                </Row>
            </Panel>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
