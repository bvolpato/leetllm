import React from 'react'
import {
    Column,
    GraphDiagram,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    withDensity,
    type ThemeColors,
} from 'vizmatic'

export const width = 600
export const height = 760
export const alt =
    'Three canonical DAG junctions comparing unconditioned and conditioned states. Top: Chain A to M to Y starts open and is blocked by conditioning on mediator M. Middle: Fork A from C to Y starts open and is blocked by conditioning on confounder C. Bottom: Collider A to K from Y starts blocked and opens when conditioning on K or its descendant.'

function junctionRow(
    c: ThemeColors,
    title: string,
    tone: 'blue' | 'purple' | 'warm',
    midId: string,
    midLabel: string,
    edges: Array<{ from: string; to: string }>,
    isCollider: boolean,
) {
    const baseNodes = [
        { id: 'A', label: 'A', detail: 'RAG', tone: 'blue' as const, x: 0.14, y: 0.5 },
        { id: midId, label: midId, detail: midLabel, tone: 'neutral' as const, x: 0.5, y: 0.5 },
        { id: 'Y', label: 'Y', detail: 'Pass', tone: 'green' as const, x: 0.86, y: 0.5 },
    ]
    const condNodes = [
        { id: 'A', label: 'A', detail: 'RAG', tone: 'blue' as const, x: 0.14, y: 0.5 },
        { id: midId, label: `${midId}*`, detail: 'cond.', tone: 'purple' as const, x: 0.5, y: 0.5 },
        { id: 'Y', label: 'Y', detail: 'Pass', tone: 'green' as const, x: 0.86, y: 0.5 },
    ]
    const openLeft = !isCollider
    const openRight = isCollider
    return (
        <Panel c={c} title={title} tone={tone} width={572} padding={12} gap={6}>
            <Row gap={12}>
                <Column gap={4}>
                    <TextLabel
                        c={c}
                        text={openLeft ? 'Uncond: OPEN' : 'Uncond: BLOCKED'}
                        fontSize={18}
                        fontWeight={700}
                        color={openLeft ? c.positive : c.critical}
                    />
                    <GraphDiagram
                        c={c}
                        layout="manual"
                        width={266}
                        height={118}
                        nodeWidth={68}
                        nodeHeight={46}
                        arrowSize={6}
                        padding={6}
                        nodes={baseNodes}
                        edges={edges.map((e) => ({
                            ...e,
                            tone: openLeft ? 'green' : 'neutral',
                            dashed: !openLeft,
                            emphasis: openLeft,
                        }))}
                    />
                </Column>
                <Column gap={4}>
                    <TextLabel
                        c={c}
                        text={openRight ? `Cond ${midId}: OPEN` : `Cond ${midId}: BLOCKED`}
                        fontSize={18}
                        fontWeight={700}
                        color={openRight ? c.positive : c.critical}
                    />
                    <GraphDiagram
                        c={c}
                        layout="manual"
                        width={266}
                        height={118}
                        nodeWidth={68}
                        nodeHeight={46}
                        arrowSize={6}
                        padding={6}
                        nodes={condNodes}
                        edges={edges.map((e) => ({
                            ...e,
                            tone: openRight ? 'green' : 'critical',
                            dashed: !openRight,
                            emphasis: openRight,
                        }))}
                    />
                </Column>
            </Row>
        </Panel>
    )
}

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 1.85)
    return (
        <Scene c={c} density={1.85} padding={14} gap={10} contentWidth={572}>
            {junctionRow(
                c,
                '1. Chain (mediator): A -> M -> Y',
                'blue',
                'M',
                'trace',
                [
                    { from: 'A', to: 'M' },
                    { from: 'M', to: 'Y' },
                ],
                false,
            )}
            {junctionRow(
                c,
                '2. Fork (confounder): A <- C -> Y',
                'purple',
                'C',
                'ctx',
                [
                    { from: 'C', to: 'A' },
                    { from: 'C', to: 'Y' },
                ],
                false,
            )}
            {junctionRow(
                c,
                '3. Collider (selection): A -> K <- Y',
                'warm',
                'K',
                'audit',
                [
                    { from: 'A', to: 'K' },
                    { from: 'Y', to: 'K' },
                ],
                true,
            )}
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
