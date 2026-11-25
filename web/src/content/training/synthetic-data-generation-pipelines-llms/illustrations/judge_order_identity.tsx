import React from 'react'
import {
    BadgePill,
    BarChart,
    Column,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    getToneColor,
} from 'vizmatic'

export const width = 880
export const height = 430
export const alt =
    'Paired bar charts comparing LLM-judge response win rates across A-first (A, B) and B-first (B, A) presentation orders. Left chart (unsafe-tool-refusal) shows order-stable consensus: response A wins 88% when shown first and 84% when shown second, so A is admitted. Right chart (verbose-answer) exposes position bias: response A wins 74% when placed first, but drops to 28% when placed second as response B jumps to 72%; the pair flips and is withheld for review.'

const illustration = defineIllustration((c) => {
    const cA = getToneColor('blue', c)
    const cB = getToneColor('purple', c)

    return (
        <Scene
            c={c}
            title="Order-Reversal Verification: Consensus vs. Position Bias Flip"
            padding={16}
            gap={12}
            contentWidth={848}
        >
            <Row gap={16} align="stretch">
                <Column gap={10} width={416} align="center">
                    <BarChart
                        c={c}
                        width={416}
                        height={316}
                        title="Order-Stable: unsafe-tool-refusal"
                        subtitle="Response A wins in both (A, B) and (B, A) orders"
                        yAxisLabel="Judge win rate (%)"
                        min={0}
                        max={100}
                        format={(v) => `${Math.round(v)}%`}
                        showGrid
                        showValues
                        data={[
                            { label: 'A in (A,B)', value: 88, valueLabel: '88%', color: cA },
                            { label: 'B in (A,B)', value: 12, valueLabel: '12%', color: cB },
                            { label: 'A in (B,A)', value: 84, valueLabel: '84%', color: cA },
                            { label: 'B in (B,A)', value: 16, valueLabel: '16%', color: cB },
                        ]}
                    />
                    <BadgePill
                        c={c}
                        text="Consensus: A wins both orders (Admit A)"
                        tone="green"
                        filled
                        fontSize={12}
                    />
                </Column>

                <Column gap={10} width={416} align="center">
                    <BarChart
                        c={c}
                        width={416}
                        height={316}
                        title="Position Bias: verbose-answer"
                        subtitle="Slot-1 preference flips winner from A to B on swap"
                        yAxisLabel="Judge win rate (%)"
                        min={0}
                        max={100}
                        format={(v) => `${Math.round(v)}%`}
                        showGrid
                        showValues
                        data={[
                            { label: 'A in (A,B)', value: 74, valueLabel: '74%', color: cA },
                            { label: 'B in (A,B)', value: 26, valueLabel: '26%', color: cB },
                            { label: 'A in (B,A)', value: 28, valueLabel: '28%', color: cA },
                            { label: 'B in (B,A)', value: 72, valueLabel: '72%', color: cB },
                        ]}
                    />
                    <BadgePill
                        c={c}
                        text="Flip: A then B wins slot 1 (Withhold)"
                        tone="red"
                        filled
                        fontSize={12}
                    />
                </Column>
            </Row>

            <Row gap={20} justify="center" align="center" width={848}>
                <TextLabel
                    c={c}
                    text="Blue = Response A win rate"
                    fontSize={12}
                    fontWeight={700}
                    color={getReadableToneColor('blue', c)}
                />
                <TextLabel
                    c={c}
                    text="Purple = Response B win rate"
                    fontSize={12}
                    fontWeight={700}
                    color={getReadableToneColor('purple', c)}
                />
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
