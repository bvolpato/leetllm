import React from 'react'
import { KeyValueList, LineChart, Row, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 700
export const height = 810
export const alt =
    'Line chart of unbiased pass@k across k=1, 3, 5, and 10 for baseline, v2, and v3 paired with side-by-side panels showing interactive UI filters leave full-suite release hold status unchanged.'

const illustration = defineIllustration((base) => {
    const c = withDensity(base, 2.05)

    return (
        <Scene c={c} density={2.05} padding={10} gap={8}>
            <LineChart
                c={c}
                width={680}
                height={350}
                title="Unbiased pass@k Scaling (n=12 samples)"
                labels={['k=1', 'k=3', 'k=5', 'k=10']}
                min={0.35}
                max={1.0}
                format="percent"
                showGrid
                showPoints
                directLabels
                yAxisLabel="pass@k"
                series={[
                    {
                        name: 'v3 (0.72 sel@1)',
                        points: [0.7, 0.925, 0.976, 0.999],
                        color: 'positive',
                    },
                    {
                        name: 'v2 (0.60 sel@1)',
                        points: [0.567, 0.808, 0.896, 0.98],
                        color: 'warning',
                    },
                    {
                        name: 'base (0.44 sel@1)',
                        points: [0.433, 0.68, 0.768, 0.837],
                        color: 'neutral',
                    },
                ]}
                footer="Oracle pass@k climbs with k; safety gates stay full-suite."
            />
            <Row gap={10}>
                <KeyValueList
                    c={c}
                    title="Locked Gate (v2)"
                    width={335}
                    keyWidth={118}
                    gap={4}
                    divider
                    rows={[
                        {
                            key: 'Decision',
                            value: 'hold_candidate',
                            tone: 'red',
                            valueMono: true,
                        },
                        {
                            key: 'Safety',
                            value: '0.680 (<0.90)',
                            tone: 'red',
                            valueMono: true,
                        },
                        {
                            key: 'ECE gap',
                            value: '0.083 (>0.06)',
                            tone: 'red',
                            valueMono: true,
                        },
                    ]}
                />
                <KeyValueList
                    c={c}
                    title="UI View Filter"
                    width={335}
                    keyWidth={118}
                    gap={4}
                    divider
                    rows={[
                        {
                            key: 'Slice',
                            value: 'paraphrase ok',
                            tone: 'blue',
                            valueMono: true,
                        },
                        {
                            key: 'Visible',
                            value: '1.000 (28/28)',
                            tone: 'blue',
                            valueMono: true,
                        },
                        {
                            key: 'Gate',
                            value: 'hold_candidate',
                            tone: 'warm',
                            valueMono: true,
                        },
                    ]}
                />
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
