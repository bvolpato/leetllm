import React from 'react'
import {
    BadgePill,
    BarChart,
    Card,
    Column,
    Row,
    Scene,
    StackedBar,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    getToneColor,
} from 'vizmatic'

export const width = 880
export const height = 400
export const alt =
    'Quantitative decomposition of weighted memory retrieval (0.50 similarity + 0.30 recency + 0.20 importance). Record A (1.7h old, sim 0.90, rec 0.906, imp 0.80) totals 0.882 from 0.450 similarity, 0.272 recency, and 0.160 importance. Record B (24h old, sim 0.95, rec 0.250, imp 0.30) totals 0.610 from 0.475 similarity, 0.075 recency, and 0.060 importance. A companion bar chart contrasts raw cosine similarity against weighted total, showing Record A overtaking Record B.'

const illustration = defineIllustration((c) => {
    const cSim = getToneColor('blue', c)
    const cRec = getToneColor('green', c)
    const cImp = getToneColor('purple', c)
    const cSimText = getReadableToneColor('blue', c)
    const cRecText = getReadableToneColor('green', c)
    const cImpText = getReadableToneColor('purple', c)

    const barMaxWidth = 440

    return (
        <Scene
            c={c}
            title="Multi-Factor Retrieval Score Decomposition"
            padding={16}
            gap={12}
            contentWidth={848}
        >
            <Row gap={16} align="stretch">
                <Card
                    c={c}
                    width={492}
                    padding={16}
                    gap={12}
                    title="Weighted Score Contributions"
                    subtitle="score = 0.50 sim + 0.30 recency + 0.20 importance (0.0 to 1.0 scale)"
                >
                    <Column gap={12}>
                        <Column gap={6}>
                            <Row justify="space-between" align="center" width={barMaxWidth}>
                                <TextLabel
                                    c={c}
                                    text="Record A (1.7h old, fresh trace)"
                                    fontSize={13}
                                    fontWeight={700}
                                />
                                <BadgePill
                                    c={c}
                                    text="Total 0.882"
                                    tone="green"
                                    filled
                                    fontSize={12}
                                />
                            </Row>
                            <StackedBar
                                c={c}
                                width={barMaxWidth}
                                height={30}
                                showLegend={false}
                                segments={[
                                    { label: 'Sim', value: 0.45, color: cSim, valueLabel: '0.450' },
                                    { label: 'Rec', value: 0.272, color: cRec, valueLabel: '0.272' },
                                    { label: 'Imp', value: 0.16, color: cImp, valueLabel: '0.160' },
                                    { label: 'Headroom', value: 0.118, color: c.border, valueLabel: '' },
                                ]}
                            />
                            <Row justify="space-between" width={barMaxWidth}>
                                <TextLabel c={c} text="Sim 0.50×0.90 = 0.450" fontSize={11} color={cSimText} mono />
                                <TextLabel c={c} text="Rec 0.30×0.91 = 0.272" fontSize={11} color={cRecText} mono />
                                <TextLabel c={c} text="Imp 0.20×0.80 = 0.160" fontSize={11} color={cImpText} mono />
                            </Row>
                        </Column>

                        <Column gap={6}>
                            <Row justify="space-between" align="center" width={barMaxWidth}>
                                <TextLabel
                                    c={c}
                                    text="Record B (24h old, 2 half-lives)"
                                    fontSize={13}
                                    fontWeight={700}
                                />
                                <BadgePill
                                    c={c}
                                    text="Total 0.610"
                                    tone="warm"
                                    filled={false}
                                    fontSize={12}
                                />
                            </Row>
                            <StackedBar
                                c={c}
                                width={barMaxWidth}
                                height={30}
                                showLegend={false}
                                segments={[
                                    { label: 'Sim', value: 0.475, color: cSim, valueLabel: '0.475' },
                                    { label: 'Rec', value: 0.075, color: cRec, valueLabel: '' },
                                    { label: 'Imp', value: 0.06, color: cImp, valueLabel: '' },
                                    { label: 'Headroom', value: 0.39, color: c.border, valueLabel: '' },
                                ]}
                            />
                            <Row justify="space-between" width={barMaxWidth}>
                                <TextLabel c={c} text="Sim 0.50×0.95 = 0.475" fontSize={11} color={cSimText} mono />
                                <TextLabel c={c} text="Rec 0.30×0.25 = 0.075" fontSize={11} color={cRecText} mono />
                                <TextLabel c={c} text="Imp 0.20×0.30 = 0.060" fontSize={11} color={cImpText} mono />
                            </Row>
                        </Column>

                        <Row justify="space-between" width={barMaxWidth} align="center">
                            {['0.00', '0.25', '0.50', '0.75', '1.00'].map((tick) => (
                                <TextLabel
                                    key={tick}
                                    c={c}
                                    text={tick}
                                    fontSize={11}
                                    color={c.textMuted}
                                    mono
                                />
                            ))}
                        </Row>
                    </Column>
                </Card>

                <BarChart
                    c={c}
                    width={340}
                    height={304}
                    title="Cosine Only vs. Multi-Factor"
                    subtitle="Rank reverses once recency & importance apply"
                    yAxisLabel="Normalized score"
                    min={0}
                    max={1.0}
                    format={(v) => v.toFixed(2)}
                    showGrid
                    showValues
                    data={[
                        { label: 'A cosine', value: 0.9, valueLabel: '0.90', color: cSim },
                        { label: 'B cosine', value: 0.95, valueLabel: '0.95', color: getToneColor('warm', c) },
                        { label: 'A total', value: 0.882, valueLabel: '0.882', color: cRec },
                        { label: 'B total', value: 0.61, valueLabel: '0.610', color: getToneColor('warm', c) },
                    ]}
                />
            </Row>

            <Row gap={18} justify="center" align="center" width={848}>
                <TextLabel c={c} text="Similarity (0.50)" fontSize={12} fontWeight={700} color={cSimText} />
                <TextLabel c={c} text="Recency 0.5^(dt/12h) (0.30)" fontSize={12} fontWeight={700} color={cRecText} />
                <TextLabel c={c} text="Clamped Importance [0,1] (0.20)" fontSize={12} fontWeight={700} color={cImpText} />
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
