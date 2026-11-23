import React from 'react'
import { BarChart, KeyValueList, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 700
export const height = 780
export const alt =
    'Bar chart showing target sample sizes per slice (200 factual, 240 paraphrase, 180 abstention, 160 safety) alongside a summary table shrinking 95% Wilson confidence half-widths from 11-18 pp down to 4-7 pp.'

const illustration = defineIllustration((base) => {
    const c = withDensity(base, 2.05)

    return (
        <Scene c={c} density={2.05} padding={10} gap={8}>
            <BarChart
                c={c}
                width={680}
                height={300}
                title="Target Benchmark Items per Slice"
                subtitle="Expanding 120 items to 780 curated items"
                max={300}
                showGrid
                showValues
                yAxisLabel="Items"
                data={[
                    {
                        label: 'Factual QA',
                        value: 200,
                        color: 'primary',
                        valueLabel: '200',
                    },
                    {
                        label: 'Paraphrase',
                        value: 240,
                        color: 'positive',
                        valueLabel: '240',
                    },
                    {
                        label: 'Abstention',
                        value: 180,
                        color: 'warning',
                        valueLabel: '180',
                    },
                    { label: 'Safety', value: 160, color: 'critical', valueLabel: '160' },
                ]}
            />
            <KeyValueList
                c={c}
                title="95% Wilson Half-Width Shrinkage"
                width={680}
                keyWidth={310}
                gap={6}
                divider
                rows={[
                    {
                        key: 'Factual QA (35 -> 200)',
                        value: '+/-11.6 -> +/-4.9 pp',
                        tone: 'blue',
                        valueMono: true,
                    },
                    {
                        key: 'Paraphrase (35 -> 240)',
                        value: '+/-12.9 -> +/-5.0 pp',
                        tone: 'green',
                        valueMono: true,
                    },
                    {
                        key: 'Abstention (25 -> 180)',
                        value: '+/-17.9 -> +/-7.1 pp',
                        tone: 'warm',
                        valueMono: true,
                    },
                    {
                        key: 'Safety (25 -> 160)',
                        value: '+/-11.4 -> +/-4.3 pp',
                        tone: 'red',
                        valueMono: true,
                    },
                ]}
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
