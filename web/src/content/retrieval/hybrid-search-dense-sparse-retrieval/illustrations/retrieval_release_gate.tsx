import React from 'react'
import {
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
    'Evaluation of three queries across BM25, Dense, and Hybrid RRF retrieval lanes for target key-rotation rule K and distractor session rule S. Query 1 using exact keyword code hits K in BM25 and Hybrid, but misses in Dense. Query 2 using semantic paraphrase misses in BM25, but hits K in Dense and Hybrid. Query 3 using natural language hits K in all three lanes. Recall across queries is 2 of 3 for BM25, 2 of 3 for Dense, and 3 of 3 (100 percent) for Hybrid RRF.'

const illustration = defineIllustration((c) => {
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)

    return (
        <Scene
            c={c}
            title="Multi-Lane Retrieval Recall Evaluation"
            subtitle="Comparing BM25 sparse, dense vector, and hybrid RRF recall across distinct query types"
            padding={20}
            gap={10}
            contentWidth={820}
        >
            <Row gap={12} align="start" justify="space-between">
                {/* Query 1: Exact code */}
                <Panel
                    c={c}
                    title="Query 1 · Exact Code 'KROT-14'"
                    tone="blue"
                    padding={10}
                    gap={6}
                    titleFontSize={12}
                    width={260}
                >
                    <Column gap={4}>
                        <Row gap={4} align="center" justify="space-between">
                            <TextLabel c={c} text="BM25:" fontSize={11} />
                            <BadgePill
                                c={c}
                                text="HIT: [K]"
                                tone="green"
                                filled
                                fontSize={10}
                                height={20}
                            />
                        </Row>
                        <Row gap={4} align="center" justify="space-between">
                            <TextLabel c={c} text="Dense:" fontSize={11} />
                            <BadgePill
                                c={c}
                                text="MISS: [ ]"
                                tone="critical"
                                filled={false}
                                fontSize={10}
                                height={20}
                            />
                        </Row>
                        <Row gap={4} align="center" justify="space-between">
                            <TextLabel c={c} text="Hybrid RRF:" fontSize={11} fontWeight={700} />
                            <BadgePill
                                c={c}
                                text="HIT: [K]"
                                tone="green"
                                filled
                                fontSize={10}
                                height={20}
                            />
                        </Row>
                        <TextLabel
                            c={c}
                            text="BM25 succeeds on rare identifier."
                            fontSize={10}
                            color={c.textSecondary}
                        />
                    </Column>
                </Panel>

                {/* Query 2: Paraphrase */}
                <Panel
                    c={c}
                    title="Query 2 · Paraphrase 'refresh credential'"
                    tone="purple"
                    padding={10}
                    gap={6}
                    titleFontSize={12}
                    width={260}
                >
                    <Column gap={4}>
                        <Row gap={4} align="center" justify="space-between">
                            <TextLabel c={c} text="BM25:" fontSize={11} />
                            <BadgePill
                                c={c}
                                text="MISS: [ ]"
                                tone="critical"
                                filled={false}
                                fontSize={10}
                                height={20}
                            />
                        </Row>
                        <Row gap={4} align="center" justify="space-between">
                            <TextLabel c={c} text="Dense:" fontSize={11} />
                            <BadgePill
                                c={c}
                                text="HIT: [K, S]"
                                tone="green"
                                filled
                                fontSize={10}
                                height={20}
                            />
                        </Row>
                        <Row gap={4} align="center" justify="space-between">
                            <TextLabel c={c} text="Hybrid RRF:" fontSize={11} fontWeight={700} />
                            <BadgePill
                                c={c}
                                text="HIT: [K, S]"
                                tone="green"
                                filled
                                fontSize={10}
                                height={20}
                            />
                        </Row>
                        <TextLabel
                            c={c}
                            text="Dense succeeds on semantic synonym."
                            fontSize={10}
                            color={c.textSecondary}
                        />
                    </Column>
                </Panel>

                {/* Query 3: Standard natural language */}
                <Panel
                    c={c}
                    title="Query 3 · Natural 'key rotation 14 days'"
                    tone="cyan"
                    padding={10}
                    gap={6}
                    titleFontSize={12}
                    width={260}
                >
                    <Column gap={4}>
                        <Row gap={4} align="center" justify="space-between">
                            <TextLabel c={c} text="BM25:" fontSize={11} />
                            <BadgePill
                                c={c}
                                text="HIT: [K, S]"
                                tone="green"
                                filled
                                fontSize={10}
                                height={20}
                            />
                        </Row>
                        <Row gap={4} align="center" justify="space-between">
                            <TextLabel c={c} text="Dense:" fontSize={11} />
                            <BadgePill
                                c={c}
                                text="HIT: [K, S]"
                                tone="green"
                                filled
                                fontSize={10}
                                height={20}
                            />
                        </Row>
                        <Row gap={4} align="center" justify="space-between">
                            <TextLabel c={c} text="Hybrid RRF:" fontSize={11} fontWeight={700} />
                            <BadgePill
                                c={c}
                                text="HIT: [K, S]"
                                tone="green"
                                filled
                                fontSize={10}
                                height={20}
                            />
                        </Row>
                        <TextLabel
                            c={c}
                            text="Both lanes find shared wording."
                            fontSize={10}
                            color={c.textSecondary}
                        />
                    </Column>
                </Panel>
            </Row>

            {/* Summary Recall Metric Banner */}
            <Panel
                c={c}
                title="Aggregate Evaluation Recall"
                tone="green"
                padding={10}
                gap={6}
                titleFontSize={13}
                width={816}
            >
                <Row gap={16} align="center" justify="space-around">
                    <Column gap={2} align="center">
                        <TextLabel
                            c={c}
                            text="BM25 Sparse Recall"
                            fontSize={11}
                            color={c.textSecondary}
                        />
                        <BadgePill
                            c={c}
                            text="2 / 3 (66.7%)"
                            tone="blue"
                            filled={false}
                            fontSize={12}
                            height={24}
                        />
                    </Column>
                    <Column gap={2} align="center">
                        <TextLabel
                            c={c}
                            text="Dense Vector Recall"
                            fontSize={11}
                            color={c.textSecondary}
                        />
                        <BadgePill
                            c={c}
                            text="2 / 3 (66.7%)"
                            tone="purple"
                            filled={false}
                            fontSize={12}
                            height={24}
                        />
                    </Column>
                    <Column gap={2} align="center">
                        <TextLabel
                            c={c}
                            text="Hybrid RRF Recall"
                            fontSize={11}
                            fontWeight={700}
                            color={green}
                        />
                        <BadgePill
                            c={c}
                            text="3 / 3 (100.0%)"
                            tone="green"
                            filled
                            fontSize={13}
                            height={26}
                        />
                    </Column>
                </Row>
            </Panel>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
