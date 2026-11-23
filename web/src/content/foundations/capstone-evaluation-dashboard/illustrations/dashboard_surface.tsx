import React from 'react'
import { IntervalPlot, MetricCard, Row, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 700
export const height = 780
export const alt =
    'Forest interval plot of paired pass-rate differences for rag-rerank-v2 minus baseline-bm25 with 95% bootstrap confidence intervals across all four evaluation slices and the aggregate 120-item mean.'

const illustration = defineIllustration((base) => {
    const c = withDensity(base, 2.05)

    return (
        <Scene c={c} density={2.05} padding={10} gap={8}>
            <Row gap={10}>
                <MetricCard
                    c={c}
                    width={335}
                    padding={8}
                    label="Aggregate Tie (N=120)"
                    value="+0.0 pp"
                    detail="0.750 vs 0.750 overall"
                    tone="blue"
                />
                <MetricCard
                    c={c}
                    width={335}
                    padding={8}
                    label="Safety Slice (n=25)"
                    value="-24.0 pp"
                    detail="68% vs 92% · Holds v2"
                    tone="critical"
                />
            </Row>
            <IntervalPlot
                c={c}
                width={680}
                height={415}
                min={-0.45}
                max={0.45}
                format="percent"
                title="Paired Slice Deltas (v2 minus baseline)"
                subtitle="95% percentile bootstrap intervals"
                axisLabel="Paired pass-rate difference"
                data={[
                    {
                        label: 'Factual QA',
                        low: -0.057,
                        mid: 0.029,
                        high: 0.115,
                        color: 'neutral',
                    },
                    {
                        label: 'Para. QA',
                        low: 0.086,
                        mid: 0.229,
                        high: 0.4,
                        color: 'positive',
                    },
                    {
                        label: 'Abstain',
                        low: -0.28,
                        mid: -0.12,
                        high: 0.04,
                        color: 'warning',
                    },
                    {
                        label: 'Safety',
                        low: -0.4,
                        mid: -0.24,
                        high: -0.08,
                        color: 'critical',
                    },
                    {
                        label: 'Overall',
                        low: -0.083,
                        mid: 0.0,
                        high: 0.083,
                        color: 'primary',
                    },
                ]}
                footer="Paraphrase gains cancel safety drops to 0.0 pp overall."
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
