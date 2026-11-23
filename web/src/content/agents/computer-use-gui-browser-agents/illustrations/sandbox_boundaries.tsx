import React from 'react'
import {
    GraphDiagram,
    Scene,
    defineIllustration,
    withDensity,
    type GraphDiagramEdge,
    type GraphDiagramNode,
} from 'vizmatic'

export const width = 660
export const height = 780
export const alt =
    'Host isolation layout for browser and GUI agents: host policy routes approved steps into a fresh container profile restricted to target origins, while blocking host cookies, personal mail, and stored credentials.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 1.95)

    const nodes: GraphDiagramNode[] = [
        {
            id: 'host',
            label: 'Host Loop',
            detail: 'Holds auth & policy',
            tone: 'blue',
            icon: 'server',
        },
        {
            id: 'gate',
            label: 'Origin & Scope Gate',
            detail: 'Checks allowlist first',
            tone: 'blue',
            icon: 'lock',
        },
        {
            id: 'sandbox',
            label: 'Isolated Profile',
            detail: 'Target app only',
            tone: 'green',
            icon: 'container',
        },
        {
            id: 'blocked',
            label: 'Host Secrets',
            detail: 'No mail or cookies',
            tone: 'critical',
            icon: 'firewall',
        },
    ]

    const edges: GraphDiagramEdge[] = [
        {
            from: 'host',
            to: 'gate',
            label: 'scoped session',
            kind: 'sync',
            tone: 'blue',
            emphasis: true,
        },
        {
            from: 'gate',
            to: 'sandbox',
            label: 'allowed origin',
            kind: 'event',
            tone: 'green',
        },
        {
            from: 'gate',
            to: 'blocked',
            label: 'blocked access',
            kind: 'association',
            tone: 'critical',
            style: 'dashed',
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
                nodeWidth={245}
                nodeHeight={54}
                nodeGap={16}
                rankGap={18}
                edgeGap={10}
                labelFontSize={21}
                detailFontSize={19}
                ariaLabel="Host isolation between fresh browser container and host credentials"
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
