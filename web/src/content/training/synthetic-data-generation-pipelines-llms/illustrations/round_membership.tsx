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
    type ThemeColors,
} from 'vizmatic'

export const width = 860
export const height = 500
export const alt =
    'Three real IDs, real-api-01, real-api-02, and real-code-01, remain alongside two synthetic IDs from each of two rounds. Replacement selects only synth-r2-01 and synth-r2-02, yielding two rows and zero real rows. Accumulation retains all seven IDs: three real, two from Round 1, and two from Round 2. The set operation tracks retained membership; training weights and model behavior require separate evaluation.'

function idBadge(c: ThemeColors, text: string, tone: 'blue' | 'cyan' | 'purple') {
    return (
        <BadgePill
            c={c}
            text={text}
            tone={tone}
            filled={false}
            fontSize={12}
            width={104}
            height={26}
        />
    )
}

const illustration = defineIllustration((c) => (
    <Scene
        c={c}
        title="Multi-round dataset membership policies"
        subtitle="Tracking data lineage and real grounding across synthetic generation rounds"
        padding={22}
        gap={12}
        contentWidth={816}
    >
        <Row gap={16} align="start">
            <Panel
                c={c}
                title="Available data pool"
                tone="cyan"
                padding={12}
                gap={8}
                titleFontSize={14}
                width={340}
            >
                <Column gap={8}>
                    <Column gap={4}>
                        <TextLabel
                            c={c}
                            text="REAL ANCHOR EXAMPLES (3)"
                            fontSize={11}
                            fontWeight={700}
                            color={c.textSecondary}
                        />
                        <Row gap={6} wrap>
                            {idBadge(c, 'real-api-01', 'blue')}
                            {idBadge(c, 'real-api-02', 'blue')}
                            {idBadge(c, 'real-code-01', 'blue')}
                        </Row>
                    </Column>
                    <Column gap={4}>
                        <TextLabel
                            c={c}
                            text="SYNTHETIC ROUND 1 (2)"
                            fontSize={11}
                            fontWeight={700}
                            color={c.textSecondary}
                        />
                        <Row gap={6} wrap>
                            {idBadge(c, 'synth-r1-01', 'cyan')}
                            {idBadge(c, 'synth-r1-02', 'cyan')}
                        </Row>
                    </Column>
                    <Column gap={4}>
                        <TextLabel
                            c={c}
                            text="SYNTHETIC ROUND 2 (2)"
                            fontSize={11}
                            fontWeight={700}
                            color={c.textSecondary}
                        />
                        <Row gap={6} wrap>
                            {idBadge(c, 'synth-r2-01', 'purple')}
                            {idBadge(c, 'synth-r2-02', 'purple')}
                        </Row>
                    </Column>
                </Column>
            </Panel>

            <Column gap={10} width={460}>
                <Panel
                    c={c}
                    title="Policy A: Replacement"
                    tone="critical"
                    padding={12}
                    gap={6}
                    titleFontSize={14}
                >
                    <Row gap={10} align="center" justify="space-between">
                        <Column gap={2}>
                            <TextLabel
                                c={c}
                                text="Retains only latest generation (Round 2)"
                                fontSize={12}
                            />
                            <TextLabel
                                c={c}
                                text="Anchor retention: 0 / 3 real rows"
                                fontSize={11}
                                color={c.criticalLight}
                            />
                        </Column>
                        <Row gap={6} align="center">
                            <FlowArrow c={c} direction="right" tone="neutral" length={16} />
                            <BadgePill
                                c={c}
                                text="2 rows total"
                                tone="critical"
                                filled
                                fontSize={12}
                                width={95}
                                height={26}
                            />
                        </Row>
                    </Row>
                    <TextLabel
                        c={c}
                        text="Risk: Discarding real anchors accelerates synthetic model collapse across iterations."
                        fontSize={11}
                        color={c.textSecondary}
                    />
                </Panel>

                <Panel
                    c={c}
                    title="Policy B: Accumulation (Union)"
                    tone="green"
                    padding={12}
                    gap={6}
                    titleFontSize={14}
                >
                    <Row gap={10} align="center" justify="space-between">
                        <Column gap={2}>
                            <TextLabel
                                c={c}
                                text="Unions real anchors with all verified synthetic batches"
                                fontSize={12}
                            />
                            <TextLabel
                                c={c}
                                text="Anchor retention: 3 / 3 real rows preserved"
                                fontSize={11}
                                color={c.positiveLight}
                            />
                        </Column>
                        <Row gap={6} align="center">
                            <FlowArrow c={c} direction="right" tone="neutral" length={16} />
                            <BadgePill
                                c={c}
                                text="7 rows total"
                                tone="green"
                                filled
                                fontSize={12}
                                width={95}
                                height={26}
                            />
                        </Row>
                    </Row>
                    <TextLabel
                        c={c}
                        text="Benefit: Retains real distribution anchors while growing dataset diversity."
                        fontSize={11}
                        color={c.textSecondary}
                    />
                </Panel>

                <Card c={c} padding={8} gap={2}>
                    <TextLabel
                        c={c}
                        text="Note: Membership determines inclusion; sampling mix ratios are tuned independently."
                        fontSize={11}
                        color={c.textSecondary}
                        align="center"
                    />
                </Card>
            </Column>
        </Row>
    </Scene>
))

export const create = illustration.create
export default illustration.default
