import React from 'react'
import {
    BarChart,
    Column,
    Panel,
    Scene,
    defineIllustration,
    getReadableToneColor,
    withDensity,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 660
export const height = 760
export const alt =
    'Two bar charts comparing raw next-token probabilities against renormalized top-p nucleus weights at p=0.85. The top tokens are 0.42, 0.28, 0.16, 0.08, and 0.06. Shifting cumulative probability right before masking keeps the third token (0.16, cumulative 0.86) in the nucleus with renormalized weight 18.6%, whereas masking unshifted cumsum > 0.85 silently drops it.'

const illustration = defineIllustration((raw: ThemeColors) => {
    const c = withDensity(raw, 1.95)
    const warm = getReadableToneColor('warm', c)

    return (
        <Scene c={c} padding={12} gap={12}>
            <Column gap={12} align="stretch">
                <Panel
                    c={c}
                    title="Sorted Next-Token Probabilities"
                    width={636}
                    padding={12}
                    tone="blue"
                >
                    <BarChart
                        c={c}
                        width={608}
                        height={190}
                        subtitle="top_p = 0.85: prior sum at token #3 is 0.70 < 0.85, so #3 stays"
                        min={0}
                        max={0.5}
                        yAxisLabel="P(token)"
                        format="percent"
                        showValues
                        data={[
                            { label: '#1 (0.42)', value: 0.42, color: 'green' },
                            { label: '#2 (0.70)', value: 0.28, color: 'green' },
                            { label: '#3 (0.86)', value: 0.16, color: 'blue' },
                            { label: '#4 (0.94)', value: 0.08, color: 'critical' },
                            { label: '#5 (1.00)', value: 0.06, color: 'critical' },
                        ]}
                    />
                </Panel>
                <Panel
                    c={c}
                    title="Renormalized Nucleus Weights (p = 0.85)"
                    width={636}
                    padding={12}
                    tone="green"
                >
                    <BarChart
                        c={c}
                        width={608}
                        height={190}
                        subtitle="Correct shifted mask keeps #1-#3 (sum = 0.86 -> 48.8%, 32.6%, 18.6%)"
                        min={0}
                        max={0.58}
                        yAxisLabel="Sample prob"
                        format="percent"
                        showValues
                        data={[
                            { label: '#1 kept', value: 0.488, color: 'green' },
                            { label: '#2 kept', value: 0.326, color: 'green' },
                            { label: '#3 kept', value: 0.186, color: warm },
                            { label: '#4 cut', value: 0.0, color: 'critical' },
                            { label: '#5 cut', value: 0.0, color: 'critical' },
                        ]}
                    />
                </Panel>
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
