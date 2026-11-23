import React from 'react'
import {
    GraphDiagram,
    Scene,
    defineIllustration,
    withDensity,
    type GraphDiagramEdge,
    type GraphDiagramNode,
} from 'vizmatic'

export const width = 720
export const height = 780
export const alt =
    'State diagram for a generation-scoped circuit breaker. Calls start in Closed generation 4 while dependency failures trip Open generation 5. A delayed completion from generation 4 returns to its caller without resetting the newer Open state. After cooldown, a single half-open probe restores traffic to Closed generation 6.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 2.08)

    const nodes: GraphDiagramNode[] = [
        {
            id: 'closed',
            label: 'Closed Gen 4',
            detail: 'Normal calls',
            tone: 'green',
            icon: 'check',
        },
        {
            id: 'stale',
            label: 'Late Gen 4',
            detail: 'Return only',
            tone: 'blue',
            icon: 'network',
        },
        {
            id: 'open',
            label: 'Open Gen 5',
            detail: 'Fail fast 5s',
            tone: 'critical',
            icon: 'lock',
        },
        {
            id: 'half',
            label: 'Half-Open',
            detail: 'Single probe',
            tone: 'warm',
            icon: 'monitor',
        },
        {
            id: 'recover',
            label: 'Closed Gen 6',
            detail: 'Probe passed',
            tone: 'green',
            icon: 'check',
        },
    ]

    const edges: GraphDiagramEdge[] = [
        {
            from: 'closed',
            to: 'open',
            label: 'fail trip',
            kind: 'event',
            tone: 'critical',
        },
        {
            from: 'stale',
            to: 'open',
            label: 'stale gen',
            kind: 'association',
            tone: 'neutral',
            style: 'dashed',
        },
        {
            from: 'open',
            to: 'half',
            label: 'cooldown',
            kind: 'async',
            tone: 'warm',
            emphasis: true,
        },
        {
            from: 'half',
            to: 'recover',
            label: 'success',
            kind: 'sync',
            tone: 'green',
        },
    ]

    return (
        <Scene c={c} density={2.08} padding={12} gap={8}>
            <GraphDiagram
                c={c}
                width={696}
                nodes={nodes}
                edges={edges}
                direction="TB"
                routing="dagre"
                arrowSize={6}
                padding={8}
                nodeWidth={260}
                nodeHeight={56}
                nodeGap={50}
                rankGap={46}
                edgeGap={18}
                labelFontSize={21}
                detailFontSize={19}
                ariaLabel="Generation-scoped circuit breaker state transitions"
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
