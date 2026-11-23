import React from 'react'
import {
    BadgePill,
    Column,
    FlowArrow,
    Matrix,
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
    'A decision matrix evaluates candidate records against four criteria: tenant access permission, document freshness, key rotation relevance, and compound limit satisfaction. Only the EU key rotation rule satisfies all four and is packed as E1. Candidate queries at 10 days and 48 hours qualify; requests at 15 days or 49 hours fail; missing evidence triggers an abstention.'

const illustration = defineIllustration((c) => {
    const data = [
        [1, 1, 1, 1],
        [1, 1, 0, 0],
        [0, 1, 1, 0],
    ]
    const labels = data.map((row) => row.map((val) => (val ? 'YES' : 'NO')))

    return (
        <Scene
            c={c}
            title="Multi-Criteria Candidate Gating in Production RAG"
            subtitle="Evaluating tenant permissions, freshness, and policy conditions before context packing"
            padding={20}
            gap={12}
            contentWidth={820}
        >
            <Row gap={16} align="start" justify="space-between">
                {/* 1. Decision Matrix */}
                <Panel
                    c={c}
                    title="Candidate gate evaluation matrix"
                    tone="cyan"
                    padding={12}
                    gap={8}
                    titleFontSize={14}
                    width={440}
                >
                    <Column gap={8}>
                        <Matrix
                            c={c}
                            data={data}
                            labels={labels}
                            rowLabels={['EU Key v2', 'EU Session', 'Admin Override']}
                            colLabels={['Allowed', 'Fresh', 'Key Topic', 'Both Limits']}
                            cellWidth={64}
                            cellHeight={32}
                            rowLabelWidth={115}
                            colorize
                            colorScale="strength"
                            colorDomain={[0, 1]}
                            fontSize={11}
                        />
                        <Row gap={6} align="center">
                            <BadgePill
                                c={c}
                                text="E1 Selected"
                                tone="green"
                                filled
                                fontSize={11}
                                height={22}
                            />
                            <TextLabel
                                c={c}
                                text="Only EU Key v2 satisfies all 4 gates. Admin row blocked by ACL."
                                fontSize={11}
                                color={c.textSecondary}
                            />
                        </Row>
                    </Column>
                </Panel>

                {/* 2. Generation & Grounding Outcomes */}
                <Column gap={10} width={360}>
                    <Panel
                        c={c}
                        title="Grounding outcomes from packed E1"
                        tone="green"
                        padding={12}
                        gap={8}
                        titleFontSize={14}
                    >
                        <Column gap={6}>
                            <Row gap={6} align="center" justify="space-between">
                                <TextLabel c={c} text="10d age + 48h signal:" fontSize={11} />
                                <BadgePill
                                    c={c}
                                    text="Eligible [E1]"
                                    tone="green"
                                    filled
                                    fontSize={11}
                                    height={22}
                                />
                            </Row>
                            <Row gap={6} align="center" justify="space-between">
                                <TextLabel c={c} text="15d age or 49h signal:" fontSize={11} />
                                <BadgePill
                                    c={c}
                                    text="Ineligible [E1]"
                                    tone="warm"
                                    filled
                                    fontSize={11}
                                    height={22}
                                />
                            </Row>
                            <Row gap={6} align="center" justify="space-between">
                                <TextLabel c={c} text="Missing permitted rule:" fontSize={11} />
                                <BadgePill
                                    c={c}
                                    text="Abstain"
                                    tone="neutral"
                                    filled={false}
                                    fontSize={11}
                                    height={22}
                                />
                            </Row>
                        </Column>
                    </Panel>

                    <Panel
                        c={c}
                        title="Engineering guarantee"
                        tone="neutral"
                        padding={10}
                        gap={4}
                        titleFontSize={13}
                    >
                        <TextLabel
                            c={c}
                            text="Numerical conditions are verified by application logic or explicit extraction."
                            fontSize={11}
                            color={c.textSecondary}
                        />
                        <TextLabel
                            c={c}
                            text="Never allow the generator to invent facts when required conditions are absent."
                            fontSize={11}
                            color={c.textSecondary}
                        />
                    </Panel>
                </Column>
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
