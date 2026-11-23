import React from 'react'
import {
    GraphDiagram,
    Scene,
    defineIllustration,
    withDensity,
    type GraphDiagramEdge,
    type GraphDiagramNode,
} from 'vizmatic'

export const width = 700
export const height = 840
export const alt =
    'State diagram for recovering an uncertain timeout after dispatching deploy-rev-17 with a stable operation key. Instead of retrying blindly, recovery queries remote state by operation key: already queued jobs keep their existing record, unobserved requests replay safely with the same key, and changed arguments trigger a 409 conflict halt.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 2.08)

    const nodes: GraphDiagramNode[] = [
        {
            id: 'timeout',
            label: 'Reply Dropped',
            detail: 'deploy-rev-17',
            tone: 'warm',
            icon: 'warning',
        },
        {
            id: 'query',
            label: 'Query by Key',
            detail: 'Remote state',
            tone: 'blue',
            icon: 'monitor',
        },
        {
            id: 'done',
            label: 'Found Queued',
            detail: 'Return job-1',
            tone: 'green',
            icon: 'check',
        },
        {
            id: 'replay',
            label: 'No Record',
            detail: 'Replay key',
            tone: 'green',
            icon: 'database',
        },
        {
            id: 'conflict',
            label: 'Args Changed',
            detail: '409 Conflict',
            tone: 'critical',
            icon: 'warning',
        },
    ]

    const edges: GraphDiagramEdge[] = [
        {
            from: 'timeout',
            to: 'query',
            label: 'reconcile op_key',
            kind: 'sync',
            tone: 'blue',
            emphasis: true,
        },
        {
            from: 'query',
            to: 'done',
            label: 'committed',
            kind: 'event',
            tone: 'green',
        },
        {
            from: 'query',
            to: 'replay',
            label: 'absent',
            kind: 'async',
            tone: 'green',
        },
        {
            from: 'query',
            to: 'conflict',
            label: 'mismatch',
            kind: 'association',
            tone: 'critical',
            style: 'dashed',
        },
    ]

    return (
        <Scene c={c} density={2.08} padding={12} gap={8}>
            <GraphDiagram
                c={c}
                width={676}
                nodes={nodes}
                edges={edges}
                direction="TB"
                routing="dagre"
                arrowSize={6}
                padding={8}
                nodeWidth={198}
                nodeHeight={66}
                nodeGap={22}
                rankGap={74}
                edgeGap={20}
                labelFontSize={22}
                detailFontSize={21}
                ariaLabel="Timeout reconciliation fork by stable operation key"
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
