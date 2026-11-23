import React from 'react'
import {
    GraphDiagram,
    Scene,
    defineIllustration,
    withDensity,
    type GraphDiagramEdge,
    type GraphDiagramNode,
} from 'vizmatic'

export const width = 680
export const height = 820
export const alt =
    'Flow diagram showing evidence-age gating during fallback when the live controller is unreachable. Observations within the 30-second policy limit can report dated past state such as queued 10 seconds ago, while stale 900-second or missing snapshots are blocked from claiming present completion and routed to explicit human handoff.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 2.15)

    const nodes: GraphDiagramNode[] = [
        {
            id: 'gate',
            label: 'Outage: Check Age',
            detail: 'Max age <= 30s',
            tone: 'blue',
            icon: 'cache',
        },
        {
            id: 'fresh',
            label: 'Fresh Read (10s)',
            detail: 'Report dated status',
            tone: 'green',
            icon: 'check',
        },
        {
            id: 'stale',
            label: 'Stale Read (900s)',
            detail: 'Block completion',
            tone: 'critical',
            icon: 'warning',
        },
        {
            id: 'handoff',
            label: 'Human Handoff',
            detail: 'Date + op_key',
            tone: 'warm',
            icon: 'user',
        },
    ]

    const edges: GraphDiagramEdge[] = [
        {
            from: 'gate',
            to: 'fresh',
            label: 'age <= 30s',
            kind: 'sync',
            tone: 'green',
            emphasis: true,
        },
        {
            from: 'gate',
            to: 'stale',
            label: 'age > 30s',
            kind: 'association',
            tone: 'critical',
            style: 'dashed',
        },
        {
            from: 'stale',
            to: 'handoff',
            label: 'escalate',
            kind: 'async',
            tone: 'warm',
        },
    ]

    return (
        <Scene c={c} density={2.15} padding={12} gap={8}>
            <GraphDiagram
                c={c}
                nodes={nodes}
                edges={edges}
                direction="TB"
                routing="dagre"
                arrowSize={6}
                padding={10}
                nodeWidth={276}
                nodeHeight={72}
                nodeGap={44}
                rankGap={90}
                edgeGap={20}
                labelFontSize={22}
                detailFontSize={21}
                ariaLabel="Evidence freshness gate and human handoff fallback diagram"
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
