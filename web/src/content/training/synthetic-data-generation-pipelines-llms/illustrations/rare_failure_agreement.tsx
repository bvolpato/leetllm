import React from 'react'
import {
    BadgePill,
    Column,
    FlowArrow,
    Grid,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
} from 'vizmatic'

export const width = 860
export const height = 500
export const alt =
    'A 100-row evaluation set contains 98 acceptable and two unacceptable rows. The judge approves all 100. A 10 by 10 grid colors the 98 correct approvals green and the two false admissions red. Overall agreement is 98 percent while both unacceptable rows pass: 2 of 2, or 100 percent. Calibration requires a larger reviewed set.'

const outcomeCells = Array.from({ length: 10 }, (_, row) =>
    Array.from({ length: 10 }, (_, column) => ({
        tone: row * 10 + column < 98 ? ('green' as const) : ('critical' as const),
    })),
)

const illustration = defineIllustration((c) => (
    <Scene
        c={c}
        title="Aggregate agreement can hide every rare failure"
        subtitle="Aggregate accuracy paradox · 100 evaluation samples"
        padding={22}
        gap={12}
        contentWidth={816}
    >
        <Row gap={16} align="center">
            <Panel
                c={c}
                title="Evaluated sample grid (100 rows)"
                tone="cyan"
                padding={12}
                gap={8}
                titleFontSize={14}
                width={340}
            >
                <Column gap={8} align="center">
                    <Grid
                        c={c}
                        rows={outcomeCells}
                        cellWidth={22}
                        cellHeight={22}
                        gap={4}
                        radius={3}
                    />
                    <Row gap={14} align="center" justify="center">
                        <Row gap={4} align="center">
                            <BadgePill
                                c={c}
                                text="98"
                                tone="green"
                                filled
                                fontSize={11}
                                width={26}
                                height={20}
                            />
                            <TextLabel
                                c={c}
                                text="Acceptable"
                                fontSize={11}
                                color={c.textSecondary}
                            />
                        </Row>
                        <Row gap={4} align="center">
                            <BadgePill
                                c={c}
                                text="2"
                                tone="critical"
                                filled
                                fontSize={11}
                                width={22}
                                height={20}
                            />
                            <TextLabel
                                c={c}
                                text="Severe Flaws"
                                fontSize={11}
                                color={c.textSecondary}
                            />
                        </Row>
                    </Row>
                </Column>
            </Panel>

            <Column align="center" gap={4}>
                <FlowArrow c={c} direction="right" tone="neutral" length={20} />
                <TextLabel c={c} text="Judge" fontSize={11} color={c.textSecondary} />
            </Column>

            <Column gap={10} width={400}>
                <Panel
                    c={c}
                    title="Metric breakdown under heavy class imbalance"
                    tone="critical"
                    padding={12}
                    gap={8}
                    titleFontSize={14}
                >
                    <Column gap={8}>
                        <Row gap={10} align="center" justify="space-between">
                            <Column gap={1}>
                                <TextLabel
                                    c={c}
                                    text="Overall Agreement"
                                    fontSize={13}
                                    fontWeight={700}
                                />
                                <TextLabel
                                    c={c}
                                    text="98 correct approvals out of 100"
                                    fontSize={11}
                                    color={c.textSecondary}
                                />
                            </Column>
                            <BadgePill
                                c={c}
                                text="98% (High)"
                                tone="green"
                                filled
                                fontSize={13}
                                width={90}
                                height={28}
                            />
                        </Row>
                        <Row gap={10} align="center" justify="space-between">
                            <Column gap={1}>
                                <TextLabel
                                    c={c}
                                    text="Flawed Row Pass Rate"
                                    fontSize={13}
                                    fontWeight={700}
                                />
                                <TextLabel
                                    c={c}
                                    text="2 false approvals out of 2 bad rows"
                                    fontSize={11}
                                    color={c.textSecondary}
                                />
                            </Column>
                            <BadgePill
                                c={c}
                                text="100% Leaked"
                                tone="critical"
                                filled
                                fontSize={13}
                                width={90}
                                height={28}
                            />
                        </Row>
                    </Column>
                </Panel>

                <Panel
                    c={c}
                    title="Audit implication"
                    tone="neutral"
                    padding={10}
                    gap={4}
                    titleFontSize={13}
                >
                    <TextLabel
                        c={c}
                        text="A naive judge that blindly approves every response achieves 98% nominal agreement on this set."
                        fontSize={11}
                        color={c.textSecondary}
                    />
                    <TextLabel
                        c={c}
                        text="High aggregate scores provide zero safety guarantee against catastrophic tail failures."
                        fontSize={11}
                        color={c.textSecondary}
                    />
                </Panel>
            </Column>
        </Row>
    </Scene>
))

export const create = illustration.create
export default illustration.default
