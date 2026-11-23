import React from 'react'
import { BarChart, Column, Flow, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 680
export const height = 660
export const autoSize = false
export const alt =
    'Four-stage ranking funnel showing document pool size on a base-10 log scale: 1,000,000 eligible documents (log10 = 6), 1,000 retrieved candidates (log10 = 3), 100 scored results (log10 = 2), and 10 displayed items (log10 = 1). Each stage reduces volume by an order of magnitude or more so heavier models score fewer items.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.0)

    return (
        <Scene c={c} padding={12} gap={14} contentWidth={656}>
            <Column gap={14} width={656}>
                <Flow
                    c={c}
                    direction="horizontal"
                    gap={4}
                    connectorLength={14}
                    stages={[
                        {
                            title: 'Eligible',
                            subtitle: 'Access / fresh',
                            tone: 'neutral',
                            width: 142,
                        },
                        { title: 'Retrieve', subtitle: 'BM25 / ANN', tone: 'blue', width: 142 },
                        { title: 'Score', subtitle: 'Joint model', tone: 'purple', width: 140 },
                        { title: 'Display', subtitle: 'Rules & caps', tone: 'green', width: 142 },
                    ]}
                />
                <BarChart
                    c={c}
                    width={656}
                    height={330}
                    title="Pool Volume by Funnel Stage (log₁₀ Document Count)"
                    subtitle="Cheap stages filter millions; expensive models rank dozens"
                    min={0}
                    max={7.0}
                    format={(v) => `10^${Math.round(v)}`}
                    showValues
                    showGrid={false}
                    ariaLabel="Log10 pool sizes drop from 6 (1,000,000) to 3 (1,000), 2 (100), and 1 (10)"
                    data={[
                        { label: 'Eligible', value: 6, valueLabel: '1,000,000', color: 'neutral' },
                        { label: 'Retrieve', value: 3, valueLabel: '1,000', color: 'primary' },
                        { label: 'Score', value: 2, valueLabel: '100', color: 'warning' },
                        { label: 'Display', value: 1, valueLabel: '10', color: 'positive' },
                    ]}
                />
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
