import React from 'react'
import {
    Card,
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
export const height = 520
export const alt =
    'A four-stage production RAG pipeline architecture. Stage 1 enforces caller tenant and ACL authorization before scoring. Stage 2 executes hybrid sparse and dense retrieval. Stage 3 applies cross-encoder reranking and expands selected child chunks to verified parent documents. Stage 4 packs the token budget, streams model generation, and verifies citation grounding.'

const illustration = defineIllustration((c) => {
    const purple = getReadableToneColor('purple', c)
    const cyan = getReadableToneColor('cyan', c)
    const warm = getReadableToneColor('warm', c)
    const green = getReadableToneColor('green', c)

    return (
        <Scene
            c={c}
            title="Four-Stage Production RAG Architecture"
            subtitle="Secure ingestion, hybrid retrieval, cross-encoder reranking, and citation-grounded generation"
            padding={20}
            gap={10}
            contentWidth={820}
        >
            <Row gap={10} align="start" justify="space-between">
                {/* Stage 1: Auth & Scope Pre-Filter */}
                <Panel
                    c={c}
                    title="1 · Auth Pre-Filter"
                    tone="purple"
                    padding={10}
                    gap={6}
                    titleFontSize={13}
                    width={195}
                >
                    <Column gap={5} align="center">
                        <BadgePill
                            c={c}
                            text="Caller Identity"
                            tone="purple"
                            filled
                            fontSize={10}
                            width={100}
                            height={20}
                        />
                        <FlowArrow c={c} direction="down" tone="purple" length={8} />
                        <BadgePill
                            c={c}
                            text="Tenant & Scope"
                            tone="purple"
                            filled={false}
                            fontSize={10}
                            width={110}
                            height={22}
                        />
                        <TextLabel
                            c={c}
                            text="Filters corpus before indexing or scoring. Blocked docs never leak into search."
                            fontSize={10}
                            color={c.textSecondary}
                            align="center"
                        />
                    </Column>
                </Panel>

                {/* Stage 2: Hybrid Retrieval */}
                <Panel
                    c={c}
                    title="2 · Hybrid Retrieval"
                    tone="cyan"
                    padding={10}
                    gap={6}
                    titleFontSize={13}
                    width={195}
                >
                    <Column gap={5} align="center">
                        <Row gap={4} align="center">
                            <BadgePill
                                c={c}
                                text="BM25"
                                tone="cyan"
                                filled={false}
                                fontSize={10}
                                width={50}
                                height={20}
                            />
                            <TextLabel c={c} text="+" fontSize={11} />
                            <BadgePill
                                c={c}
                                text="Dense"
                                tone="cyan"
                                filled={false}
                                fontSize={10}
                                width={55}
                                height={20}
                            />
                        </Row>
                        <FlowArrow c={c} direction="down" tone="cyan" length={8} />
                        <BadgePill
                            c={c}
                            text="RRF Fusion (Top-K)"
                            tone="cyan"
                            filled
                            fontSize={10}
                            width={120}
                            height={22}
                        />
                        <TextLabel
                            c={c}
                            text="High recall retrieval across exact keywords and semantic similarity."
                            fontSize={10}
                            color={c.textSecondary}
                            align="center"
                        />
                    </Column>
                </Panel>

                {/* Stage 3: Reranking & Expansion */}
                <Panel
                    c={c}
                    title="3 · Rerank & Expand"
                    tone="warm"
                    padding={10}
                    gap={6}
                    titleFontSize={13}
                    width={195}
                >
                    <Column gap={5} align="center">
                        <BadgePill
                            c={c}
                            text="Cross-Encoder"
                            tone="warm"
                            filled
                            fontSize={10}
                            width={105}
                            height={20}
                        />
                        <FlowArrow c={c} direction="down" tone="warm" length={8} />
                        <BadgePill
                            c={c}
                            text="Parent Expansion"
                            tone="warm"
                            filled={false}
                            fontSize={10}
                            width={115}
                            height={22}
                        />
                        <TextLabel
                            c={c}
                            text="Joint attention reorders top-K; child chunk expands to full parent section E1."
                            fontSize={10}
                            color={c.textSecondary}
                            align="center"
                        />
                    </Column>
                </Panel>

                {/* Stage 4: Grounded Generation */}
                <Panel
                    c={c}
                    title="4 · Generation & Trace"
                    tone="green"
                    padding={10}
                    gap={6}
                    titleFontSize={13}
                    width={195}
                >
                    <Column gap={5} align="center">
                        <BadgePill
                            c={c}
                            text="Context Packing"
                            tone="green"
                            filled={false}
                            fontSize={10}
                            width={110}
                            height={20}
                        />
                        <FlowArrow c={c} direction="down" tone="green" length={8} />
                        <BadgePill
                            c={c}
                            text="Citations [E1]"
                            tone="green"
                            filled
                            fontSize={10}
                            width={100}
                            height={22}
                        />
                        <TextLabel
                            c={c}
                            text="Strict token budgeting, streaming generation, and audit trace emission."
                            fontSize={10}
                            color={c.textSecondary}
                            align="center"
                        />
                    </Column>
                </Panel>
            </Row>

            <Card c={c} padding={8} gap={2} width={816}>
                <TextLabel
                    c={c}
                    text="Every stage enforces distinct invariants: authorization preserves privacy, retrieval preserves recall, reranking maximizes precision, and expansion guarantees complete grounding."
                    fontSize={11}
                    color={c.textSecondary}
                    align="center"
                />
            </Card>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
