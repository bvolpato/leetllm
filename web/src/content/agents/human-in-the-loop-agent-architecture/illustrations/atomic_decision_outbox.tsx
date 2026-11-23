import React from 'react'
import {
    GraphDiagram,
    Scene,
    defineIllustration,
    withDensity,
    type GraphDiagramEdge,
    type GraphDiagramNode,
} from 'vizmatic'

export const width = 640
export const height = 660
export const alt =
    'State diagram showing two concurrent reviewers competing on approval apr_123 at version 3 inside SQLite BEGIN IMMEDIATE. The first transaction updates status to authorized and writes outbox key apr_123:v3 atomically. The second transaction matches zero pending rows and returns 409 Conflict. An executor reads the committed outbox token and dispatches once with op_key.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 1.95)

    const nodes: GraphDiagramNode[] = [
        {
            id: 'clicks',
            label: 'Two Clicks v3',
            detail: 'Concurrent approve',
            tone: 'blue',
            icon: 'user',
        },
        {
            id: 'tx',
            label: 'BEGIN IMMEDIATE',
            detail: 'SQLite write lock',
            tone: 'warm',
            icon: 'lock',
        },
        {
            id: 'win',
            label: 'Winner Commits',
            detail: 'Set v4 + outbox',
            tone: 'green',
            icon: 'database',
        },
        {
            id: 'lose',
            label: 'Loser Blocked',
            detail: '0 rows -> 409',
            tone: 'critical',
            icon: 'warning',
        },
        {
            id: 'poll',
            label: 'Executor Poll',
            detail: 'Run op_key once',
            tone: 'green',
            icon: 'check',
        },
    ]

    const edges: GraphDiagramEdge[] = [
        { from: 'clicks', to: 'tx', label: 'race on v3', kind: 'event' },
        {
            from: 'tx',
            to: 'win',
            label: 'rowcount = 1',
            kind: 'sync',
            tone: 'green',
            emphasis: true,
        },
        {
            from: 'tx',
            to: 'lose',
            label: 'rowcount = 0',
            kind: 'association',
            tone: 'critical',
            style: 'dashed',
        },
        {
            from: 'win',
            to: 'poll',
            label: 'apr_123:v3',
            kind: 'async',
            tone: 'green',
        },
    ]

    return (
        <Scene c={c} density={1.95} padding={6} gap={4}>
            <GraphDiagram
                c={c}
                nodes={nodes}
                edges={edges}
                direction="TB"
                routing="dagre"
                arrowSize={6}
                padding={6}
                nodeWidth={260}
                nodeHeight={52}
                nodeGap={36}
                rankGap={14}
                edgeGap={10}
                labelFontSize={22}
                detailFontSize={19}
                ariaLabel="Atomic conditional approval decision and outbox transaction diagram"
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
