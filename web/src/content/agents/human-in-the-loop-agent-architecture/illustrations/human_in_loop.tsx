import React from 'react'
import {
    GraphDiagram,
    Scene,
    defineIllustration,
    withDensity,
    type GraphDiagramEdge,
    type GraphDiagramNode,
} from 'vizmatic'

export const width = 620
export const height = 790
export const alt =
    'State diagram of a durable human-in-the-loop workflow. An agent saves checkpoint v3 and pauses for human review. The reviewer either cancels or edits into a new digest with zero gated writes, or atomically commits an authorization and outbox token. Execution checks live preconditions with compare-and-swap, routing timeouts to remote reconciliation by operation key.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 2.0)

    const nodes: GraphDiagramNode[] = [
        {
            id: 'interrupt',
            label: 'Pause v3',
            detail: 'Save + hash',
            tone: 'blue',
            icon: 'lock',
        },
        {
            id: 'decision',
            label: 'Review Gate',
            detail: 'Verify scope',
            tone: 'warm',
            icon: 'user',
        },
        {
            id: 'reject',
            label: 'Stop / Edit',
            detail: '0 writes on v3',
            tone: 'critical',
            icon: 'warning',
        },
        {
            id: 'outbox',
            label: 'Outbox TX',
            detail: 'Auth + msg',
            tone: 'green',
            icon: 'database',
        },
        {
            id: 'cas',
            label: 'CAS Write',
            detail: 'WHERE rev=41',
            tone: 'green',
            icon: 'check',
        },
        {
            id: 'reconcile',
            label: 'Reconcile',
            detail: 'Poll op_key',
            tone: 'warm',
            icon: 'monitor',
        },
    ]

    const edges: GraphDiagramEdge[] = [
        { from: 'interrupt', to: 'decision', label: 'enqueue', kind: 'event' },
        {
            from: 'decision',
            to: 'reject',
            label: 'deny / edit',
            kind: 'association',
            tone: 'critical',
        },
        {
            from: 'decision',
            to: 'outbox',
            label: 'approve',
            kind: 'sync',
            tone: 'green',
            emphasis: true,
        },
        {
            from: 'outbox',
            to: 'cas',
            label: 'dispatch',
            kind: 'async',
            tone: 'green',
        },
        {
            from: 'outbox',
            to: 'reconcile',
            label: 'timeout',
            kind: 'event',
            tone: 'warm',
            style: 'dashed',
        },
    ]

    return (
        <Scene c={c} density={2.0} padding={8} gap={6} title="Durable Interrupt and CAS Execution">
            <GraphDiagram
                c={c}
                nodes={nodes}
                edges={edges}
                direction="TB"
                routing="dagre"
                arrowSize={6}
                padding={8}
                nodeWidth={210}
                nodeHeight={60}
                nodeGap={20}
                rankGap={22}
                edgeGap={12}
                labelFontSize={22}
                detailFontSize={19}
                ariaLabel="Durable human-in-the-loop approval and execution state graph"
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
