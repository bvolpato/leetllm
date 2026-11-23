import React from 'react'
import {
    BadgePill,
    Column,
    FlowArrow,
    Panel,
    Row,
    Scene,
    SvgFrame,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'

export const width = 860
export const height = 520
export const alt =
    'Clause segmentation across chunk boundaries for an access rule. Clause 1 establishes rule setup, Clause 2 defines the 14-day limit, and Clause 3 sets the 48-hour condition. Without overlap, Chunk A contains the first two clauses and misses the condition. With sliding window overlap, Chunk B contains both limits. With parent-child expansion, the retriever matches on the child and passes the full parent context to the generator.'

const illustration = defineIllustration((c) => {
    const cyan = getReadableToneColor('cyan', c)
    const warm = getReadableToneColor('warm', c)
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    const critical = getReadableToneColor('critical', c)

    return (
        <Scene
            c={c}
            title="Chunk Overlap and Parent-Child Boundaries"
            subtitle="Preserving compound policy conditions across text splitting strategies"
            padding={20}
            gap={10}
            contentWidth={820}
        >
            <Column gap={10} align="center">
                {/* 1. Aligned Source Clauses */}
                <Panel
                    c={c}
                    title="Source sentence · 3 semantic clauses"
                    tone="neutral"
                    padding={10}
                    gap={6}
                    titleFontSize={13}
                    width={816}
                >
                    <Row gap={8} align="center" justify="space-between">
                        <Column gap={2} width={340}>
                            <BadgePill
                                c={c}
                                text="Clause 1 · Rule Setup"
                                tone="cyan"
                                filled
                                fontSize={11}
                                height={22}
                            />
                            <TextLabel
                                c={c}
                                text="Stale service-account keys qualify for automated rotation"
                                fontSize={11}
                                color={c.textSecondary}
                            />
                        </Column>
                        <Column gap={2} width={200}>
                            <BadgePill
                                c={c}
                                text="Clause 2 · Time Limit"
                                tone="warm"
                                filled
                                fontSize={11}
                                height={22}
                            />
                            <TextLabel
                                c={c}
                                text="up to 14 days after becoming stale,"
                                fontSize={11}
                                color={c.textSecondary}
                            />
                        </Column>
                        <Column gap={2} width={240}>
                            <BadgePill
                                c={c}
                                text="Clause 3 · Safety Condition"
                                tone="purple"
                                filled
                                fontSize={11}
                                height={22}
                            />
                            <TextLabel
                                c={c}
                                text="provided the risk signal is at most 48h old."
                                fontSize={11}
                                color={c.textSecondary}
                            />
                        </Column>
                    </Row>
                </Panel>

                {/* 2. Three Splitting Strategies */}
                <Row gap={12} align="start" justify="space-between">
                    {/* Strategy A: No Overlap */}
                    <Panel
                        c={c}
                        title="1 · Strict Boundary (No Overlap)"
                        tone="critical"
                        padding={12}
                        gap={8}
                        titleFontSize={13}
                        width={264}
                    >
                        <Column gap={6}>
                            <BadgePill
                                c={c}
                                text="Chunk A: Clause 1 + 2"
                                tone="cyan"
                                filled={false}
                                fontSize={11}
                                height={24}
                            />
                            <BadgePill
                                c={c}
                                text="Chunk B: Clause 3"
                                tone="purple"
                                filled={false}
                                fontSize={11}
                                height={24}
                            />
                            <Row gap={4} align="center">
                                <FlowArrow c={c} direction="down" tone="critical" length={10} />
                                <TextLabel
                                    c={c}
                                    text="If Chunk A is retrieved:"
                                    fontSize={11}
                                    fontWeight={700}
                                    color={critical}
                                />
                            </Row>
                            <TextLabel
                                c={c}
                                text="Critical condition is severed: LLM grants rotation without checking 48h risk signal."
                                fontSize={11}
                                color={c.textSecondary}
                            />
                        </Column>
                    </Panel>

                    {/* Strategy B: Sliding Window Overlap */}
                    <Panel
                        c={c}
                        title="2 · Sliding Window Overlap"
                        tone="warm"
                        padding={12}
                        gap={8}
                        titleFontSize={13}
                        width={264}
                    >
                        <Column gap={6}>
                            <BadgePill
                                c={c}
                                text="Chunk A: Clause 1 + 2"
                                tone="cyan"
                                filled={false}
                                fontSize={11}
                                height={24}
                            />
                            <BadgePill
                                c={c}
                                text="Chunk B′: Clause 2 + 3 (Shared)"
                                tone="warm"
                                filled={false}
                                fontSize={11}
                                height={24}
                            />
                            <Row gap={4} align="center">
                                <FlowArrow c={c} direction="down" tone="warm" length={10} />
                                <TextLabel
                                    c={c}
                                    text="Trade-off:"
                                    fontSize={11}
                                    fontWeight={700}
                                    color={warm}
                                />
                            </Row>
                            <TextLabel
                                c={c}
                                text="B′ contains both conditions, but index size grows and Chunk A remains incomplete."
                                fontSize={11}
                                color={c.textSecondary}
                            />
                        </Column>
                    </Panel>

                    {/* Strategy C: Parent-Child Expansion */}
                    <Panel
                        c={c}
                        title="3 · Parent-Child Expansion"
                        tone="green"
                        padding={12}
                        gap={8}
                        titleFontSize={13}
                        width={264}
                    >
                        <Column gap={6}>
                            <BadgePill
                                c={c}
                                text="Index: Small Child Chunks"
                                tone="blue"
                                filled={false}
                                fontSize={11}
                                height={24}
                            />
                            <BadgePill
                                c={c}
                                text="Serve: Full Parent Document"
                                tone="green"
                                filled
                                fontSize={11}
                                height={24}
                            />
                            <Row gap={4} align="center">
                                <FlowArrow c={c} direction="down" tone="green" length={10} />
                                <TextLabel
                                    c={c}
                                    text="Optimal Recovery:"
                                    fontSize={11}
                                    fontWeight={700}
                                    color={green}
                                />
                            </Row>
                            <TextLabel
                                c={c}
                                text="Dense search hits precise child chunk; generator receives full parent context E1."
                                fontSize={11}
                                color={c.textSecondary}
                            />
                        </Column>
                    </Panel>
                </Row>
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
