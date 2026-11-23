import React from 'react'
import {
    IntervalPlot,
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
    'CUPED covariate adjustment across 20,000 simulated units using theta = 0.465 and mean pre-period covariate 0.455: raw lift estimates +4.68 percentage points with 95% CI [3.32, 6.04] and SE 0.70, while CUPED-adjusted lift estimates +4.39 percentage points with tighter 95% CI [3.19, 5.59] and SE 0.61, removing 22.1% of pooled outcome variance.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 1.85)
    return (
        <Scene c={c} density={1.85} padding={12} gap={10} contentWidth={576}>
            <Panel
                c={c}
                title="1. 95% CI width before and after CUPED (20k units)"
                tone="blue"
                width={576}
                padding={10}
                gap={8}
            >
                <IntervalPlot
                    c={c}
                    width={552}
                    height={170}
                    min={2.5}
                    max={6.5}
                    axisLabel="Estimated lift (percentage points)"
                    format={(v) => `${v.toFixed(1)}`}
                    data={[
                        {
                            label: 'Raw (SE 0.70)',
                            low: 3.32,
                            mid: 4.68,
                            high: 6.04,
                            color: 'primary',
                            midLabel: '+4.68',
                        },
                        {
                            label: 'CUPED (SE 0.61)',
                            low: 3.19,
                            mid: 4.39,
                            high: 5.59,
                            color: 'positive',
                            midLabel: '+4.39',
                        },
                    ]}
                />
            </Panel>
            <Panel
                c={c}
                title="2. Pooled outcome variance share (rho = 0.470)"
                tone="green"
                width={576}
                padding={10}
                gap={8}
            >
                <StackedBar
                    c={c}
                    width={552}
                    height={26}
                    showLegend
                    segments={[
                        {
                            label: 'Residual variance kept 77.9%',
                            value: 78,
                            color: 'primary',
                        },
                        { label: 'Removed by X 22.1%', value: 22, color: 'positive' },
                    ]}
                />
                <Row gap={10}>
                    <MetricCard
                        c={c}
                        width={271}
                        label="Pooled theta"
                        value="0.465"
                        detail="Shared across both arms"
                        tone="blue"
                    />
                    <MetricCard
                        c={c}
                        width={271}
                        label="Variance reduction"
                        value="22.1%"
                        detail="Tighter interval without leakage"
                        tone="green"
                    />
                </Row>
            </Panel>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
