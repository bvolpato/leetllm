import React from 'react'
import {
    GraphDiagram,
    Scene,
    defineIllustration,
    withDensity,
    type GraphDiagramEdge,
    type GraphDiagramNode,
} from 'vizmatic'

export const width = 920
export const height = 420
export const alt =
    'Scoped approval verification for GUI updates: grant review-1 binds session-1, record model-2048, and expected version v4; matching state commits v5 cleanly, whereas stale versions, wrong sessions, expired grants, or replays are rejected with zero writes.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 1.35)

    const nodes: GraphDiagramNode[] = [
        {
            id: 'grant',
            label: 'Grant review-1',
            detail: 'model-2048 at v4',
            tone: 'blue',
            icon: 'lock',
        },
        {
            id: 'verify',
            label: 'Verify Scope & v4',
            detail: 'Check session + nonce',
            tone: 'blue',
            icon: 'database',
        },
        {
            id: 'commit',
            label: 'Commit Update v5',
            detail: 'Exact match applies',
            tone: 'green',
            icon: 'check',
        },
        {
            id: 'reject',
            label: 'Zero Writes',
            detail: 'Stale v4 or replay',
            tone: 'critical',
            icon: 'warning',
        },
    ]

    const edges: GraphDiagramEdge[] = [
        {
            from: 'grant',
            to: 'verify',
            label: 'submit edit',
            kind: 'sync',
            tone: 'blue',
            emphasis: true,
        },
        {
            from: 'verify',
            to: 'commit',
            label: 'all match',
            kind: 'event',
            tone: 'green',
        },
        {
            from: 'verify',
            to: 'reject',
            label: 'stale / replay',
            kind: 'association',
            tone: 'critical',
            style: 'dashed',
        },
    ]

    return (
        <Scene c={c} density={1.35} padding={8} gap={4}>
            <GraphDiagram
                c={c}
                nodes={nodes}
                edges={edges}
                direction="LR"
                routing="dagre"
                arrowSize={6}
                padding={8}
                nodeWidth={196}
                nodeHeight={68}
                nodeGap={22}
                rankGap={36}
                edgeGap={12}
                labelFontSize={16}
                detailFontSize={14}
                ariaLabel="Scoped approval verification gating live record update from v4 to v5"
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
