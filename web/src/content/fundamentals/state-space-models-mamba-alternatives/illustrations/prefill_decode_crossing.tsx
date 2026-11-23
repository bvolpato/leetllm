import React from 'react'
import { BarChart, Column, LineChart, Panel, Scene, defineIllustration } from 'vizmatic'

export const width = 740
export const height = 780

export const alt =
    'Total generation latency comparing attention (120 ms prefill plus 3.2 ms per decode token) and SSM (150 ms prefill plus 1.8 ms per decode token): lines cross at 22.43 tokens, with attention ahead at 16 tokens (168 ms vs 177 ms) and SSM ahead at 256 tokens (609 ms vs 936 ms).'

const attnTotal = (n: number) => 120 + (n - 1) * 3.2
const ssmTotal = (n: number) => 150 + (n - 1) * 1.8
const gridN = [1, 12, 23, 34, 45]

const illustration = defineIllustration((c) => (
    <Scene c={c} density={2.3} padding={10} gap={8} background="transparent">
        <Column gap={8} align="stretch">
            <Panel c={c} title="Latency crossover at N = 22.43 tokens" padding={10} gap={4}>
                <LineChart
                    c={c}
                    width={680}
                    height={195}
                    labels={gridN.map(String)}
                    min={100}
                    max={275}
                    format="integer"
                    yAxisLabel="ms"
                    directLabels={false}
                    series={[
                        {
                            name: 'Attn (120 + 3.2/tok)',
                            points: gridN.map(attnTotal),
                            color: c.info,
                        },
                        {
                            name: 'SSM (150 + 1.8/tok)',
                            points: gridN.map(ssmTotal),
                            color: c.positive,
                        },
                    ]}
                />
            </Panel>

            <Panel c={c} title="Total latency at N=16 vs N=256" padding={10} gap={4}>
                <BarChart
                    c={c}
                    width={680}
                    height={165}
                    min={0}
                    max={1000}
                    format="integer"
                    yAxisLabel="ms"
                    data={[
                        { label: 'A @ 16', value: 168, valueLabel: '168', color: c.info },
                        {
                            label: 'S @ 16',
                            value: 177,
                            valueLabel: '177',
                            color: c.positive,
                        },
                        { label: 'A @ 256', value: 936, valueLabel: '936', color: c.info },
                        {
                            label: 'S @ 256',
                            value: 609,
                            valueLabel: '609',
                            color: c.positive,
                        },
                    ]}
                />
            </Panel>
        </Column>
    </Scene>
))

export const create = illustration.create
export default illustration.default
