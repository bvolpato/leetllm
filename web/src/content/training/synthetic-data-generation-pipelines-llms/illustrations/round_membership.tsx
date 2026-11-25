import React from 'react'
import {
    BadgePill,
    Card,
    Column,
    LineChart,
    Row,
    Scene,
    StackedBar,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    getToneColor,
} from 'vizmatic'

export const width = 900
export const height = 390
export const alt =
    'Recursive synthetic training comparison across 10 generations (n=80 per generation, 400 trials). Left line chart plots distribution variance: accumulating verified synthetic rounds alongside real data preserves variance near 0.988 through generation 10, whereas 100% synthetic replacement drops steadily from 0.990 to 0.911. Right stacked bars compare Round 2 training pool composition: replacement trains on 2 synthetic rows with 0% real anchors, while accumulation unions 3 real anchors (43%) with 2 Round 1 (29%) and 2 Round 2 (29%) rows.'

const illustration = defineIllustration((c) => {
    const cAcc = getToneColor('green', c)
    const cRep = getToneColor('red', c)
    const cReal = getToneColor('blue', c)
    const cR1 = getToneColor('cyan', c)
    const cR2 = getToneColor('purple', c)

    return (
        <Scene
            c={c}
            title="Recursive Synthetic Training: Variance Collapse vs. Real-Data Accumulation"
            padding={16}
            gap={12}
            contentWidth={868}
        >
            <Row gap={16} align="stretch">
                <LineChart
                    c={c}
                    width={480}
                    height={316}
                    title="Distribution Variance Across Generations"
                    subtitle="N(0, 1) recursive loop (n = 80, mean over 400 trials)"
                    yAxisLabel="Learned variance"
                    labels={['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10']}
                    min={0.89}
                    max={1.01}
                    format={(v) => v.toFixed(2)}
                    showGrid
                    showPoints
                    directLabels
                    series={[
                        {
                            name: 'Accumulate (0.988)',
                            points: [0.9898, 0.9871, 0.9891, 0.988, 0.9875, 0.987, 0.9878, 0.9867, 0.9869, 0.9878],
                            color: cAcc,
                        },
                        {
                            name: 'Replace (0.911)',
                            points: [0.9898, 0.9776, 0.9757, 0.964, 0.9502, 0.9371, 0.9317, 0.9149, 0.9058, 0.9112],
                            color: cRep,
                            area: true,
                        },
                    ]}
                />

                <Card
                    c={c}
                    width={372}
                    padding={16}
                    gap={12}
                    title="Round 2 Pool Composition"
                    subtitle="Retained source mix entering training"
                >
                    <Column gap={14}>
                        <Column gap={6}>
                            <Row justify="space-between" align="center" width={332}>
                                <TextLabel c={c} text="Replacement (2 rows)" fontSize={13} fontWeight={700} />
                                <BadgePill c={c} text="0% real anchors" tone="red" filled fontSize={11} />
                            </Row>
                            <StackedBar
                                c={c}
                                width={332}
                                height={32}
                                showLegend={false}
                                segments={[
                                    { label: 'Synth R2', value: 2, color: cRep, valueLabel: '100% Synth R2 (2)' },
                                ]}
                            />
                            <TextLabel
                                c={c}
                                text="Tail events vanish: p=0.1 missed 59% in 5 draws"
                                fontSize={12}
                                color={getReadableToneColor('red', c)}
                            />
                        </Column>

                        <Column gap={6}>
                            <Row justify="space-between" align="center" width={332}>
                                <TextLabel c={c} text="Accumulation (7 rows)" fontSize={13} fontWeight={700} />
                                <BadgePill c={c} text="43% real retained" tone="green" filled fontSize={11} />
                            </Row>
                            <StackedBar
                                c={c}
                                width={332}
                                height={32}
                                showLegend={false}
                                segments={[
                                    { label: 'Real', value: 3, color: cReal, valueLabel: 'Real (3)' },
                                    { label: 'Synth R1', value: 2, color: cR1, valueLabel: 'R1 (2)' },
                                    { label: 'Synth R2', value: 2, color: cR2, valueLabel: 'R2 (2)' },
                                ]}
                            />
                            <TextLabel
                                c={c}
                                text="Real anchors bound variance; tune mix separately"
                                fontSize={12}
                                color={getReadableToneColor('green', c)}
                            />
                        </Column>

                        <Row gap={14} justify="center" width={332}>
                            <TextLabel c={c} text="Real anchors" fontSize={12} fontWeight={700} color={getReadableToneColor('blue', c)} />
                            <TextLabel c={c} text="Synth R1" fontSize={12} fontWeight={700} color={getReadableToneColor('cyan', c)} />
                            <TextLabel c={c} text="Synth R2" fontSize={12} fontWeight={700} color={getReadableToneColor('purple', c)} />
                        </Row>
                    </Column>
                </Card>
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
