import React from 'react'
import {
    AxisPlot,
    BadgePill,
    Column,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'

export const width = 860
export const height = 500
export const alt =
    'Reciprocal Rank Fusion (RRF) combines ranked lists from lexical BM25 search and dense vector search with k=60. The key rule ranks first in lexical and unranked in dense. The audit note ranks first in dense and unranked in lexical. The session rule ranks second in both lanes, accumulating two rank-two contributions to score 0.03226 and win rank one. The key rule and audit note tie at 0.01639.'

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)

    return (
        <Scene
            c={c}
            title="Reciprocal Rank Fusion (RRF) Dynamics"
            subtitle="How multi-lane presence can elevate a consensus document over single-lane winners"
            padding={20}
            gap={12}
            contentWidth={820}
        >
            <Row gap={16} align="start" justify="space-between">
                {/* 1. Input Ranked Lanes */}
                <Column gap={10} width={280}>
                    <Panel
                        c={c}
                        title="Lexical Lane (BM25)"
                        tone="blue"
                        padding={10}
                        gap={6}
                        titleFontSize={13}
                    >
                        <Column gap={4}>
                            <Row gap={6} align="center" justify="space-between">
                                <BadgePill
                                    c={c}
                                    text="#1"
                                    tone="blue"
                                    filled
                                    fontSize={10}
                                    width={28}
                                    height={20}
                                />
                                <TextLabel
                                    c={c}
                                    text="Key Rule (AUTH-14)"
                                    fontSize={11}
                                    fontWeight={700}
                                />
                                <TextLabel
                                    c={c}
                                    text="1/61"
                                    fontSize={10}
                                    color={c.textSecondary}
                                    mono
                                />
                            </Row>
                            <Row gap={6} align="center" justify="space-between">
                                <BadgePill
                                    c={c}
                                    text="#2"
                                    tone="blue"
                                    filled={false}
                                    fontSize={10}
                                    width={28}
                                    height={20}
                                />
                                <TextLabel c={c} text="Session Rule" fontSize={11} />
                                <TextLabel
                                    c={c}
                                    text="1/62"
                                    fontSize={10}
                                    color={c.textSecondary}
                                    mono
                                />
                            </Row>
                        </Column>
                    </Panel>

                    <Panel
                        c={c}
                        title="Dense Lane (Vector MIPS)"
                        tone="purple"
                        padding={10}
                        gap={6}
                        titleFontSize={13}
                    >
                        <Column gap={4}>
                            <Row gap={6} align="center" justify="space-between">
                                <BadgePill
                                    c={c}
                                    text="#1"
                                    tone="purple"
                                    filled
                                    fontSize={10}
                                    width={28}
                                    height={20}
                                />
                                <TextLabel c={c} text="Audit Note" fontSize={11} fontWeight={700} />
                                <TextLabel
                                    c={c}
                                    text="1/61"
                                    fontSize={10}
                                    color={c.textSecondary}
                                    mono
                                />
                            </Row>
                            <Row gap={6} align="center" justify="space-between">
                                <BadgePill
                                    c={c}
                                    text="#2"
                                    tone="purple"
                                    filled={false}
                                    fontSize={10}
                                    width={28}
                                    height={20}
                                />
                                <TextLabel c={c} text="Session Rule" fontSize={11} />
                                <TextLabel
                                    c={c}
                                    text="1/62"
                                    fontSize={10}
                                    color={c.textSecondary}
                                    mono
                                />
                            </Row>
                        </Column>
                    </Panel>
                </Column>

                {/* 2. Fusion Formula & Visual Plot */}
                <Panel
                    c={c}
                    title="Fused RRF Ranking (k = 60)"
                    tone="green"
                    padding={12}
                    gap={10}
                    titleFontSize={13}
                    width={490}
                >
                    <Column gap={8}>
                        <TextLabel
                            c={c}
                            text="RRF Score = Σ 1 / (60 + rank)"
                            fontSize={12}
                            fontWeight={700}
                            color={green}
                            mono
                        />
                        <AxisPlot
                            c={c}
                            width={460}
                            height={120}
                            xMin={0}
                            xMax={0.04}
                            yMin={0}
                            yMax={4}
                            padding={10}
                            showGrid
                            gridCount={4}
                            showAxes
                            vectors={[
                                { x1: 0, y1: 3, x2: 0.03226, y2: 3, tone: 'warm', strokeWidth: 10 },
                                {
                                    x1: 0,
                                    y1: 2,
                                    x2: 0.01639,
                                    y2: 2,
                                    tone: 'purple',
                                    strokeWidth: 10,
                                },
                                { x1: 0, y1: 1, x2: 0.01639, y2: 1, tone: 'blue', strokeWidth: 10 },
                            ]}
                        />
                        <Column gap={4}>
                            <Row gap={6} align="center" justify="space-between">
                                <TextLabel
                                    c={c}
                                    text="1 · Session Rule (Dual presence: 1/62 + 1/62)"
                                    fontSize={11}
                                    fontWeight={700}
                                />
                                <BadgePill
                                    c={c}
                                    text="0.03226"
                                    tone="warm"
                                    filled
                                    fontSize={11}
                                    height={20}
                                />
                            </Row>
                            <Row gap={6} align="center" justify="space-between">
                                <TextLabel
                                    c={c}
                                    text="2 · Audit Note (Dense #1: 1/61)"
                                    fontSize={11}
                                />
                                <BadgePill
                                    c={c}
                                    text="0.01639"
                                    tone="purple"
                                    filled={false}
                                    fontSize={11}
                                    height={20}
                                />
                            </Row>
                            <Row gap={6} align="center" justify="space-between">
                                <TextLabel
                                    c={c}
                                    text="3 · Key Rule (Lexical #1: 1/61)"
                                    fontSize={11}
                                />
                                <BadgePill
                                    c={c}
                                    text="0.01639"
                                    tone="blue"
                                    filled={false}
                                    fontSize={11}
                                    height={20}
                                />
                            </Row>
                        </Column>
                        <TextLabel
                            c={c}
                            text="Caution: Appearing at rank 2 in both lanes outscores rank 1 in a single lane. Top-k cutoff and tie-breaking must be planned carefully."
                            fontSize={10}
                            color={c.textSecondary}
                        />
                    </Column>
                </Panel>
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
