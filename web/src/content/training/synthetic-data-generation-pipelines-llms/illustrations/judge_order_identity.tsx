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
    'Two fixed-vote comparisons keep response identity attached to color while left and right positions swap. For unsafe-tool-refusal, the judge selects left in the forward order and right after reversal, selecting response A twice. For verbose-answer, it selects left in both orders, changing the winner from A to B; the example withholds candidate for audit. These candidate evaluations illustrate position-to-identity remapping.'

type Candidate = 'A' | 'B'
type Vote = 'LEFT' | 'RIGHT'

function slot(c: ThemeColors, position: Vote, candidate: Candidate) {
    return (
        <Column gap={2} align="center" width={75}>
            <TextLabel c={c} text={position} fontSize={11} color={c.textSecondary} align="center" />
            <BadgePill
                c={c}
                text={candidate}
                tone={candidate === 'A' ? 'blue' : 'purple'}
                filled={false}
                fontSize={14}
                width={48}
                height={28}
            />
        </Column>
    )
}

function presentationRow(
    c: ThemeColors,
    order: string,
    leftCandidate: Candidate,
    rightCandidate: Candidate,
    vote: Vote,
) {
    const winner = vote === 'LEFT' ? leftCandidate : rightCandidate
    return (
        <Row gap={8} align="center" justify="space-between">
            <TextLabel c={c} text={order} fontSize={13} width={70} color={c.textPrimary} />
            <Row gap={6} align="center">
                {slot(c, 'LEFT', leftCandidate)}
                <TextLabel c={c} text="vs" fontSize={11} color={c.textSecondary} />
                {slot(c, 'RIGHT', rightCandidate)}
            </Row>
            <BadgePill
                c={c}
                text={`${vote} → ${winner}`}
                tone="warm"
                fontSize={12}
                width={105}
                height={26}
            />
        </Row>
    )
}

function comparison(
    c: ThemeColors,
    title: string,
    stable: boolean,
    firstVote: Vote,
    secondVote: Vote,
    summary: string,
) {
    return (
        <Panel
            c={c}
            title={title}
            tone={stable ? 'green' : 'critical'}
            padding={14}
            gap={10}
            titleFontSize={14}
            width={390}
        >
            <Column gap={8}>
                {presentationRow(c, 'Forward', 'A', 'B', firstVote)}
                <Row justify="center">
                    <FlowArrow c={c} direction="down" tone="neutral" length={12} />
                </Row>
                {presentationRow(c, 'Reversed', 'B', 'A', secondVote)}
                <BadgePill
                    c={c}
                    text={summary}
                    tone={stable ? 'green' : 'critical'}
                    filled={false}
                    fontSize={12}
                    height={28}
                />
            </Column>
        </Panel>
    )
}

const illustration = defineIllustration((c) => (
    <Scene
        c={c}
        title="A judge vote belongs to a response"
        subtitle="Position-swap evaluation pairs · response identity tracking"
        padding={22}
        gap={14}
        contentWidth={816}
    >
        <Column gap={12} align="center">
            <TextLabel
                c={c}
                text="Swapping presentation order detects positional bias. Colors track response identity across slots."
                fontSize={13}
                color={c.textSecondary}
                align="center"
            />
            <Row gap={16} justify="center">
                {comparison(
                    c,
                    'Consistent preference · Invariant',
                    true,
                    'LEFT',
                    'RIGHT',
                    'Response A selected in both orders · ADMIT',
                )}
                {comparison(
                    c,
                    'Position bias detected · Order sensitive',
                    false,
                    'LEFT',
                    'LEFT',
                    'Winner flips from A to B · REJECT / AUDIT',
                )}
            </Row>
            <Card c={c} padding={10} gap={4} width={796}>
                <TextLabel
                    c={c}
                    text="Invariant evaluation requires either consistent selection across permutations or withholding the example."
                    fontSize={12}
                    color={c.textSecondary}
                    align="center"
                />
            </Card>
        </Column>
    </Scene>
))

export const create = illustration.create
export default illustration.default
