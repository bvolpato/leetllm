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
export const height = 500
export const alt =
    'Pre-retrieval access control filtering on four scored documents for an ops-team caller. Signing-key runbook scores 0.94 but requires security-team permissions and is blocked. Incident checklist scores 0.71 with tenant-wide permission and is admitted. Ops escalation FAQ scores 0.48 with ops-team permission and is admitted. Acquisition plan scores 0.35 with executives permission and is blocked. Only the two authorized documents enter the model context.'

const illustration = defineIllustration((c) => {
    const green = getReadableToneColor('green', c)
    const critical = getReadableToneColor('critical', c)
    const blue = getReadableToneColor('blue', c)

    return (
        <Scene
            c={c}
            title="Pre-Retrieval Role-Based Access Control (RBAC)"
            subtitle="Principal role evaluation and security boundary enforcement before context entry"
            padding={20}
            gap={12}
            contentWidth={820}
        >
            <Row gap={16} align="center" justify="space-between">
                {/* 1. Candidate Documents & Scores */}
                <Panel
                    c={c}
                    title="1 · Candidate documents & scores"
                    tone="blue"
                    padding={12}
                    gap={8}
                    titleFontSize={13}
                    width={280}
                >
                    <Column gap={6}>
                        <Column gap={2}>
                            <Row gap={6} align="center" justify="space-between">
                                <TextLabel
                                    c={c}
                                    text="Signing-key Runbook"
                                    fontSize={11}
                                    fontWeight={700}
                                />
                                <BadgePill
                                    c={c}
                                    text="cos: 0.94"
                                    tone="blue"
                                    filled={false}
                                    fontSize={10}
                                    height={20}
                                />
                            </Row>
                            <BadgePill
                                c={c}
                                text="Requires: security-team"
                                tone="critical"
                                filled={false}
                                fontSize={10}
                                height={18}
                            />
                        </Column>

                        <Column gap={2}>
                            <Row gap={6} align="center" justify="space-between">
                                <TextLabel
                                    c={c}
                                    text="Incident Checklist"
                                    fontSize={11}
                                    fontWeight={700}
                                />
                                <BadgePill
                                    c={c}
                                    text="cos: 0.71"
                                    tone="blue"
                                    filled={false}
                                    fontSize={10}
                                    height={20}
                                />
                            </Row>
                            <BadgePill
                                c={c}
                                text="Requires: tenant-wide"
                                tone="green"
                                filled={false}
                                fontSize={10}
                                height={18}
                            />
                        </Column>

                        <Column gap={2}>
                            <Row gap={6} align="center" justify="space-between">
                                <TextLabel
                                    c={c}
                                    text="Ops Escalation FAQ"
                                    fontSize={11}
                                    fontWeight={700}
                                />
                                <BadgePill
                                    c={c}
                                    text="cos: 0.48"
                                    tone="blue"
                                    filled={false}
                                    fontSize={10}
                                    height={20}
                                />
                            </Row>
                            <BadgePill
                                c={c}
                                text="Requires: ops-team"
                                tone="green"
                                filled={false}
                                fontSize={10}
                                height={18}
                            />
                        </Column>

                        <Column gap={2}>
                            <Row gap={6} align="center" justify="space-between">
                                <TextLabel
                                    c={c}
                                    text="Acquisition Plan"
                                    fontSize={11}
                                    fontWeight={700}
                                />
                                <BadgePill
                                    c={c}
                                    text="cos: 0.35"
                                    tone="blue"
                                    filled={false}
                                    fontSize={10}
                                    height={20}
                                />
                            </Row>
                            <BadgePill
                                c={c}
                                text="Requires: executives"
                                tone="critical"
                                filled={false}
                                fontSize={10}
                                height={18}
                            />
                        </Column>
                    </Column>
                </Panel>

                {/* 2. Authorization Filter Gate */}
                <Column gap={6} align="center" width={180}>
                    <BadgePill
                        c={c}
                        text="Caller: ops-team"
                        tone="purple"
                        filled
                        fontSize={12}
                        width={130}
                        height={28}
                    />
                    <FlowArrow c={c} direction="right" tone="purple" length={24} />
                    <BadgePill
                        c={c}
                        text="ACL Filter Gate"
                        tone="purple"
                        filled={false}
                        fontSize={11}
                        width={115}
                        height={24}
                    />
                    <TextLabel
                        c={c}
                        text="Relevance score alone never overrides permissions."
                        fontSize={10}
                        color={c.textSecondary}
                        align="center"
                    />
                </Column>

                {/* 3. Permitted Context Passed to LLM */}
                <Panel
                    c={c}
                    title="2 · Context admitted to prompt"
                    tone="green"
                    padding={12}
                    gap={8}
                    titleFontSize={13}
                    width={300}
                >
                    <Column gap={8}>
                        <Column gap={2}>
                            <Row gap={6} align="center" justify="space-between">
                                <TextLabel
                                    c={c}
                                    text="Incident Checklist"
                                    fontSize={11}
                                    fontWeight={700}
                                />
                                <BadgePill
                                    c={c}
                                    text="ADMITTED"
                                    tone="green"
                                    filled
                                    fontSize={10}
                                    height={20}
                                />
                            </Row>
                            <TextLabel
                                c={c}
                                text="Tenant-wide access matches caller scope."
                                fontSize={10}
                                color={c.textSecondary}
                            />
                        </Column>

                        <Column gap={2}>
                            <Row gap={6} align="center" justify="space-between">
                                <TextLabel
                                    c={c}
                                    text="Ops Escalation FAQ"
                                    fontSize={11}
                                    fontWeight={700}
                                />
                                <BadgePill
                                    c={c}
                                    text="ADMITTED"
                                    tone="green"
                                    filled
                                    fontSize={10}
                                    height={20}
                                />
                            </Row>
                            <TextLabel
                                c={c}
                                text="Explicit ops-team grant matches caller role."
                                fontSize={10}
                                color={c.textSecondary}
                            />
                        </Column>

                        <Card c={c} padding={6} gap={2}>
                            <TextLabel
                                c={c}
                                text="Signing-key runbook (0.94) and Acquisition plan (0.35) dropped before prompt generation."
                                fontSize={10}
                                color={c.textSecondary}
                            />
                        </Card>
                    </Column>
                </Panel>
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
