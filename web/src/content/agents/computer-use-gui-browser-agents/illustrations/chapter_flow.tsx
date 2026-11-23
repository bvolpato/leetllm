import React from 'react'
import {
    GraphDiagram,
    Scene,
    defineIllustration,
    withDensity,
    type GraphDiagramEdge,
    type GraphDiagramNode,
} from 'vizmatic'

export const width = 860
export const height = 520
export const alt =
    'Execution loop for a host-controlled browser agent: capture viewport frame v1, pass host policy checks for origin and action scope, then execute and verify frame v2 while rejecting stale v0 inputs and blocking out-of-scope requests.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 2.12)

    const nodes: GraphDiagramNode[] = [
        {
            id: 'observe',
            label: 'Observe v1',
            detail: 'Fresh screen',
            tone: 'blue',
            icon: 'monitor',
        },
        {
            id: 'gate',
            label: 'Host Policy',
            detail: 'Frame + origin',
            tone: 'blue',
            icon: 'lock',
        },
        {
            id: 'act',
            label: 'Act & Check',
            detail: 'Verify frame v2',
            tone: 'green',
            icon: 'check',
        },
        {
            id: 'stale',
            label: 'Reject v0',
            detail: 'Stale screen',
            tone: 'warm',
            icon: 'warning',
        },
        {
            id: 'block',
            label: 'Deny Target',
            detail: 'Wrong origin',
            tone: 'critical',
            icon: 'firewall',
        },
    ]

    const edges: GraphDiagramEdge[] = [
        {
            from: 'observe',
            to: 'gate',
            label: 'propose',
            kind: 'sync',
            tone: 'blue',
            emphasis: true,
        },
        {
            from: 'gate',
            to: 'act',
            label: 'v1 valid',
            kind: 'event',
            tone: 'green',
        },
        {
            from: 'gate',
            to: 'stale',
            label: 'stale v0',
            kind: 'association',
            tone: 'warm',
            style: 'dashed',
        },
        {
            from: 'gate',
            to: 'block',
            label: 'blocked',
            kind: 'association',
            tone: 'critical',
            style: 'dashed',
        },
    ]

    return (
        <Scene c={c} density={2.12} padding={8} gap={4}>
            <GraphDiagram
                c={c}
                width={844}
                height={500}
                nodes={nodes}
                edges={edges}
                direction="LR"
                routing="dagre"
                arrowSize={5}
                padding={8}
                nodeWidth={150}
                nodeHeight={52}
                nodeGap={16}
                rankGap={42}
                edgeGap={14}
                labelFontSize={18}
                detailFontSize={16}
                ariaLabel="Host-controlled observe check act and verify loop"
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
