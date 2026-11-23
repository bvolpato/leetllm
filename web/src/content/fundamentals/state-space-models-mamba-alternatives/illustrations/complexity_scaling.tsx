import React from 'react'
import { BarChart, Column, LineChart, Panel, Scene, defineIllustration } from 'vizmatic'

export const width = 760
export const height = 780

export const alt =
    'Per-request cache memory across 128 to 64K context tokens: 32-layer attention KV cache climbs to 32 GiB and a 4-attention plus 28-SSM hybrid reaches 4.004 GiB, while a pure 32-layer SSM holds constant at 5 MiB.'

const illustration = defineIllustration((c) => (
    <Scene c={c} density={2.3} padding={10} gap={8} background="transparent">
        <Column gap={8} align="stretch">
            <Panel c={c} title="Per-request memory scaling (128 to 64K)" padding={8} gap={4}>
                <LineChart
                    c={c}
                    width={640}
                    height={195}
                    labels={['128', '512', '2K', '8K', '64K']}
                    min={0}
                    max={32}
                    format="decimal"
                    yAxisLabel="GiB"
                    directLabels={false}
                    series={[
                        {
                            name: 'Attn (32 GiB)',
                            points: [0.0625, 0.25, 1.0, 4.0, 32.0],
                            color: c.critical,
                            area: true,
                        },
                        {
                            name: 'Hybrid (4 GiB)',
                            points: [0.012, 0.036, 0.129, 0.504, 4.004],
                            color: c.warning,
                        },
                        {
                            name: 'SSM (5 MiB)',
                            points: [0.005, 0.005, 0.005, 0.005, 0.005],
                            color: c.positive,
                        },
                    ]}
                />
            </Panel>

            <Panel c={c} title="32-SSM constant state (0 to 10 MiB zoom)" padding={8} gap={4}>
                <BarChart
                    c={c}
                    width={640}
                    height={165}
                    min={0}
                    max={10}
                    format="integer"
                    yAxisLabel="MiB"
                    data={[
                        { label: '128', value: 5, valueLabel: '5', color: c.positive },
                        { label: '512', value: 5, valueLabel: '5', color: c.positive },
                        { label: '2K', value: 5, valueLabel: '5', color: c.positive },
                        { label: '8K', value: 5, valueLabel: '5', color: c.positive },
                        { label: '64K', value: 5, valueLabel: '5', color: c.positive },
                    ]}
                />
            </Panel>
        </Column>
    </Scene>
))

export const create = illustration.create
export default illustration.default
