import React from 'react'
import {
    DataTable,
    IntervalPlot,
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
    'Launch gate assessment for the worked RAG example: resolution lift +4.0 pp has 95% CI [+1.0, +7.0] above zero and clears the +2.0 pp target, while grounding failures change by +0.05 pp with 95% CI [-0.60, +0.70] crossing the +0.50 pp harm budget. Latency (+80 ms) and human handoff (-0.20 pp) clear point screens, yet unresolved grounding risk holds launch.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 1.85)
    return (
        <Scene c={c} density={1.85} padding={12} gap={10} contentWidth={576}>
            <Panel
                c={c}
                title="1. Uncertainty intervals vs target and harm cutoffs (pp)"
                tone="critical"
                width={576}
                padding={10}
                gap={8}
            >
                <IntervalPlot
                    c={c}
                    width={552}
                    height={150}
                    min={-1.5}
                    max={8.0}
                    axisLabel="Difference (percentage points)"
                    format={(v) => (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1))}
                    data={[
                        {
                            label: 'Resolution',
                            low: 0.97,
                            mid: 4.0,
                            high: 7.03,
                            color: 'positive',
                            midLabel: '+4.0',
                        },
                        {
                            label: 'Grounding',
                            low: -0.6,
                            mid: 0.05,
                            high: 0.7,
                            color: 'critical',
                            midLabel: '+0.05',
                        },
                    ]}
                />
            </Panel>
            <Panel
                c={c}
                title="2. Launch checks (pp unless noted)"
                tone="blue"
                width={576}
                padding={10}
                gap={8}
            >
                <DataTable
                    c={c}
                    width={552}
                    headerRows={1}
                    rows={[
                        ['Check', 'Observed', 'Limit', 'Gate'],
                        ['Lift', '+4.0 [+1.0, +7.0]', '> +2.0', 'Pass'],
                        ['Grounding', '+0.05 [-0.6, +0.7]', '< +0.50', 'Hold'],
                        ['Latency', '+80 ms', '< 150', 'Pass'],
                        ['Handoff', '-0.20 pp', '< +0.50', 'Pass'],
                    ]}
                />
                <Row gap={10}>
                    <MetricCard
                        c={c}
                        width={271}
                        label="Primary OEC"
                        value="+4.0 pp"
                        detail="95% CI [+1.0, +7.0]"
                        tone="green"
                    />
                    <MetricCard
                        c={c}
                        width={271}
                        label="Gate verdict"
                        value="HOLD"
                        detail="+0.70 > +0.50 harm budget"
                        tone="critical"
                    />
                </Row>
            </Panel>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
