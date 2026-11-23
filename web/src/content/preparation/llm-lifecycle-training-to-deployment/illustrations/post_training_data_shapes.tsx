import React from 'react'
import {
    BarChart,
    Column,
    Matrix,
    Panel,
    Scene,
    defineIllustration,
    getReadableToneColor,
    withDensity,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 660
export const height = 800
export const alt =
    'Top panel shows a loss mask matrix comparing Pre-Train (loss weight 1.00 on sys, usr, out, and eos tokens) against SFT Mask (0.00 on sys and usr prompt tokens, 1.00 only on assistant out and eos tokens). Bottom panel shows DPO preference optimization keeping Chosen Cited NLL at 4.0 nats while raising Rejected Guess NLL from 5.0 to 6.0 nats.'

const illustration = defineIllustration((raw: ThemeColors) => {
    const c = withDensity(raw, 1.95)
    const warm = getReadableToneColor('warm', c)
    return (
        <Scene c={c} padding={12} gap={10}>
            <Column gap={10} align="stretch">
                <Panel
                    c={c}
                    title="Loss Mask by Token Role (1 = Backprop Loss)"
                    width={636}
                    padding={12}
                    tone="purple"
                >
                    <Matrix
                        c={c}
                        cellSize={72}
                        data={[
                            [1, 1, 1, 1],
                            [0, 0, 1, 1],
                        ]}
                        rowLabels={['Pre-Train', 'SFT Mask']}
                        colLabels={['sys', 'usr', 'out', 'eos']}
                    />
                </Panel>
                <Panel
                    c={c}
                    title="DPO Preference Update (Negative Log-Likelihood, Nats)"
                    width={636}
                    padding={12}
                    tone="green"
                >
                    <BarChart
                        c={c}
                        width={608}
                        height={196}
                        subtitle="Widening chosen-vs-rejected gap without shifting the reference anchor"
                        min={0}
                        max={7}
                        yAxisLabel="-log p"
                        showValues
                        data={[
                            { label: 'Chosen Cited', value: 4.0, color: 'green' },
                            { label: 'Init Rejected', value: 5.0, color: warm },
                            { label: 'Trained Rejected', value: 6.0, color: 'critical' },
                        ]}
                    />
                </Panel>
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
