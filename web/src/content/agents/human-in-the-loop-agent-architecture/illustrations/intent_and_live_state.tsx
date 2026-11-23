import React from 'react'
import {
    GraphDiagram,
    Scene,
    defineIllustration,
    withDensity,
    type GraphDiagramEdge,
    type GraphDiagramGroup,
    type GraphDiagramNode,
} from 'vizmatic'

export const width = 620
export const height = 740
export const alt =
    'Diagram comparing an immutable approval snapshot against a mutating live deployment. Proposal v3 records digest sha256=9f3c and requires revision 41. Between approval and execution, another writer moves live state from revision 41 to 42. Because the write enforces WHERE revision = 41, zero rows update even though the proposal digest never changed.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 1.9)
    const groups: GraphDiagramGroup[] = [
        { id: 'intent', label: 'Snapshot', tone: 'blue' },
        { id: 'live', label: 'Live Cluster', tone: 'warm' },
    ]

    const nodes: GraphDiagramNode[] = [
        {
            id: 'snap',
            label: '14:00 Grant',
            detail: 'rev=41, 9f3c',
            group: 'intent',
            tone: 'blue',
            icon: 'lock',
        },
        {
            id: 'token',
            label: '14:45 Check',
            detail: 'Hash valid',
            group: 'intent',
            tone: 'blue',
            icon: 'check',
        },
        {
            id: 'live41',
            label: '14:00 rev=41',
            detail: 'Canary 0%',
            group: 'live',
            tone: 'green',
            icon: 'server',
        },
        {
            id: 'live42',
            label: '14:20 Write',
            detail: 'Live rev=42',
            group: 'live',
            tone: 'warm',
            icon: 'warning',
        },
        {
            id: 'cas',
            label: 'CAS: rev=41',
            detail: '0 rows; stop',
            tone: 'critical',
            icon: 'firewall',
        },
    ]

    const edges: GraphDiagramEdge[] = [
        {
            from: 'snap',
            to: 'token',
            label: 'unchanged',
            kind: 'data',
            tone: 'blue',
        },
        {
            from: 'live41',
            to: 'live42',
            label: 'drifted',
            kind: 'event',
            tone: 'warm',
        },
        { from: 'token', to: 'cas', label: 'want 41', kind: 'sync', tone: 'blue' },
        {
            from: 'live42',
            to: 'cas',
            label: 'actual 42',
            kind: 'sync',
            tone: 'critical',
        },
    ]

    return (
        <Scene
            c={c}
            density={1.9}
            padding={8}
            gap={6}
            title="Payload Digest vs. Live Compare-and-Swap"
        >
            <GraphDiagram
                c={c}
                nodes={nodes}
                edges={edges}
                groups={groups}
                direction="TB"
                groupDirection="TB"
                routing="orthogonal"
                arrowSize={6}
                padding={8}
                nodeWidth={172}
                nodeHeight={64}
                nodeGap={16}
                rankGap={24}
                labelFontSize={20}
                detailFontSize={17}
                ariaLabel="Frozen approval digest blocked by live revision compare-and-swap"
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
