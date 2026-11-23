import React from 'react'
import {
    BarChart,
    Panel,
    Row,
    Scene,
    defineIllustration,
    getReadableToneColor,
    withDensity,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 960
export const height = 460
export const alt =
    'Candidate token weights 1, 3, and 2 normalize to probabilities 1/6, 1/2, and 1/3. Removing illegal token B leaves weights 1, 0, and 2, which normalize to 1/3, 0, and 2/3.'

const weights = [1, 3, 2]
const masked = weights.map((weight, i) => (i === 1 ? 0 : weight))
const probability = (values: number[]) =>
    values.map((value) => value / values.reduce((a, b) => a + b, 0))
const illustration = defineIllustration((raw: ThemeColors) => {
    const c = withDensity(raw, 1.7)
    return (
        <Scene c={c} padding={18} gap={0}>
            <Row gap={16} align="stretch">
                <Panel c={c} title="Before: total weight 6" width={454} padding={12} tone="blue">
                    <BarChart
                        c={c}
                        width={430}
                        height={290}
                        min={0}
                        max={1}
                        yAxisLabel="Probability"
                        format="percent"
                        showValues
                        data={probability(weights).map((value, i) => ({
                            label: ['A', 'B (illegal)', 'C'][i],
                            value,
                            color: getReadableToneColor(i === 1 ? 'critical' : 'blue', c),
                        }))}
                    />
                </Panel>
                <Panel c={c} title="After: total weight 3" width={454} padding={12} tone="green">
                    <BarChart
                        c={c}
                        width={430}
                        height={290}
                        min={0}
                        max={1}
                        yAxisLabel="Probability"
                        format="percent"
                        showValues
                        data={probability(masked).map((value, i) => ({
                            label: ['A', 'B (removed)', 'C'][i],
                            value,
                            color: getReadableToneColor(i === 1 ? 'neutral' : 'green', c),
                        }))}
                    />
                </Panel>
            </Row>
        </Scene>
    )
})
export const create = illustration.create
export default illustration.default
